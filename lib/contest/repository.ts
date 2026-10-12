import { CONTEST_LIMITS } from "./config.ts";
import type { SqlClient, SqlRow } from "./db.ts";

export type EntryStatus = "pending" | "approved" | "rejected";

export type ContestEntry = {
  id: string;
  publicId: string;
  displayName: string;
  age: number;
  city: string | null;
  caption: string;
  photoUrl: string;
  photoPathname: string;
  status: EntryStatus;
  votes: number;
  createdAt: Date;
  approvedAt: Date | null;
};

/** Interne Felder nur für die Moderation. */
export type ContestEntryInternal = ContestEntry & { email: string };

export type NewEntry = {
  publicId: string;
  displayName: string;
  age: number;
  city: string | null;
  caption: string;
  email: string;
  photoUrl: string;
  photoPathname: string;
  consentTerms: boolean;
  consentImage: boolean;
  ipHash: string;
  userAgent: string | null;
};

export type VoteResult =
  | { status: "counted"; votes: number }
  | { status: "duplicate"; votes: number }
  | { status: "ip-limit" }
  | { status: "not-found" };

const ENTRY_COLUMNS = `e.id, e.public_id, e.display_name, e.age, e.city, e.caption, e.photo_url, e.photo_pathname,
  e.status, e.created_at, e.approved_at,
  (SELECT count(*)::int FROM contest_votes v WHERE v.entry_id = e.id) AS votes`;

const ENTRY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function mapEntry(row: SqlRow): ContestEntry {
  return {
    id: String(row.id),
    publicId: String(row.public_id),
    displayName: String(row.display_name),
    age: Number(row.age),
    city: row.city == null ? null : String(row.city),
    caption: String(row.caption),
    photoUrl: String(row.photo_url),
    photoPathname: String(row.photo_pathname),
    status: String(row.status) as EntryStatus,
    votes: Number(row.votes ?? 0),
    createdAt: toDate(row.created_at),
    approvedAt: row.approved_at == null ? null : toDate(row.approved_at),
  };
}

function mapInternal(row: SqlRow): ContestEntryInternal {
  return { ...mapEntry(row), email: String(row.email) };
}

export async function countEntriesByIpToday(sql: SqlClient, ipHash: string): Promise<number> {
  const rows = await sql(
    `SELECT count(*)::int AS total FROM contest_entries WHERE ip_hash = $1 AND created_at >= date_trunc('day', now())`,
    [ipHash],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function createEntry(sql: SqlClient, entry: NewEntry): Promise<ContestEntry> {
  const rows = await sql(
    `INSERT INTO contest_entries (public_id, display_name, age, city, caption, email, photo_url, photo_pathname,
       consent_terms, consent_image, ip_hash, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, public_id, display_name, age, city, caption, photo_url, photo_pathname, status, created_at, approved_at, 0 AS votes`,
    [
      entry.publicId,
      entry.displayName,
      entry.age,
      entry.city,
      entry.caption,
      entry.email,
      entry.photoUrl,
      entry.photoPathname,
      entry.consentTerms,
      entry.consentImage,
      entry.ipHash,
      entry.userAgent,
    ],
  );
  return mapEntry(rows[0]);
}

export async function getEntryByPublicId(sql: SqlClient, publicId: string): Promise<ContestEntry | null> {
  const rows = await sql(`SELECT ${ENTRY_COLUMNS} FROM contest_entries e WHERE e.public_id = $1`, [publicId]);
  return rows[0] ? mapEntry(rows[0]) : null;
}

/** Freigegebene Teilnehmer nach Stimmen, bei Gleichstand die frühere Freigabe zuerst. */
export async function listRanking(sql: SqlClient, limit = CONTEST_LIMITS.rankingSize): Promise<ContestEntry[]> {
  const rows = await sql(
    `SELECT ${ENTRY_COLUMNS} FROM contest_entries e WHERE e.status = 'approved'
     ORDER BY votes DESC, e.approved_at ASC NULLS LAST, e.created_at ASC LIMIT $1`,
    [limit],
  );
  return rows.map(mapEntry);
}

/** Platz eines Teilnehmers im Ranking (1-basiert), null wenn nicht freigegeben. */
export async function rankOf(sql: SqlClient, entryId: string): Promise<number | null> {
  const rows = await sql(
    `WITH ranked AS (
       SELECT e.id, row_number() OVER (
         ORDER BY (SELECT count(*) FROM contest_votes v WHERE v.entry_id = e.id) DESC, e.approved_at ASC NULLS LAST, e.created_at ASC
       ) AS position
       FROM contest_entries e WHERE e.status = 'approved'
     )
     SELECT position::int AS position FROM ranked WHERE id = $1`,
    [entryId],
  );
  return rows[0] ? Number(rows[0].position) : null;
}

export async function countApproved(sql: SqlClient): Promise<number> {
  const rows = await sql(`SELECT count(*)::int AS total FROM contest_entries WHERE status = 'approved'`);
  return Number(rows[0]?.total ?? 0);
}

export async function castVote(
  sql: SqlClient,
  vote: { entryId: string; voterHash: string; ipHash: string },
): Promise<VoteResult> {
  const entry = await sql(`SELECT id FROM contest_entries WHERE id = $1 AND status = 'approved'`, [vote.entryId]);
  if (!entry[0]) return { status: "not-found" };

  const ipRows = await sql(
    `SELECT count(*)::int AS total FROM contest_votes WHERE ip_hash = $1 AND vote_day = current_date`,
    [vote.ipHash],
  );
  if (Number(ipRows[0]?.total ?? 0) >= CONTEST_LIMITS.votesPerIpPerDay) return { status: "ip-limit" };

  const inserted = await sql(
    `INSERT INTO contest_votes (entry_id, voter_hash, ip_hash) VALUES ($1, $2, $3)
     ON CONFLICT (entry_id, voter_hash, vote_day) DO NOTHING RETURNING id`,
    [vote.entryId, vote.voterHash, vote.ipHash],
  );
  const countRows = await sql(`SELECT count(*)::int AS total FROM contest_votes WHERE entry_id = $1`, [vote.entryId]);
  const votes = Number(countRows[0]?.total ?? 0);
  return inserted[0] ? { status: "counted", votes } : { status: "duplicate", votes };
}

export async function listEntriesForModeration(sql: SqlClient, status: EntryStatus): Promise<ContestEntryInternal[]> {
  const rows = await sql(
    `SELECT ${ENTRY_COLUMNS}, e.email FROM contest_entries e WHERE e.status = $1
     ORDER BY CASE WHEN $1 = 'pending' THEN e.created_at END ASC, votes DESC, e.created_at DESC LIMIT 200`,
    [status],
  );
  return rows.map(mapInternal);
}

export async function moderateEntry(
  sql: SqlClient,
  entryId: string,
  action: "approve" | "reject",
): Promise<ContestEntry | null> {
  const status: EntryStatus = action === "approve" ? "approved" : "rejected";
  const rows = await sql(
    `UPDATE contest_entries e SET status = $2, moderated_at = now(),
       approved_at = CASE WHEN $2 = 'approved' THEN coalesce(e.approved_at, now()) ELSE e.approved_at END
     WHERE e.id = $1
     RETURNING ${ENTRY_COLUMNS}`,
    [entryId, status],
  );
  return rows[0] ? mapEntry(rows[0]) : null;
}

/** Löscht Eintrag samt Stimmen; liefert den Blob-Pfad zum Entfernen des Fotos. */
export async function deleteEntry(sql: SqlClient, entryId: string): Promise<{ photoPathname: string } | null> {
  const rows = await sql(`DELETE FROM contest_entries WHERE id = $1 RETURNING photo_pathname`, [entryId]);
  return rows[0] ? { photoPathname: String(rows[0].photo_pathname) } : null;
}

export function isEntryId(value: unknown): value is string {
  return typeof value === "string" && ENTRY_ID_PATTERN.test(value);
}
