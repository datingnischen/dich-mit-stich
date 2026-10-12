import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { PGlite } from "@electric-sql/pglite";

import { ensureSchema } from "../lib/contest/db.ts";
import {
  castVote,
  countEntriesByIpToday,
  createEntry,
  deleteEntry,
  getEntryByPublicId,
  listEntriesForModeration,
  listRanking,
  moderateEntry,
  rankOf,
} from "../lib/contest/repository.ts";
import { CONTEST_LIMITS } from "../lib/contest/config.ts";

let db;
const sql = async (text, params = []) => (await db.query(text, params)).rows;

before(async () => {
  db = await PGlite.create();
  await ensureSchema(sql);
  // idempotent: ein zweiter Lauf darf nichts ändern oder werfen
  await ensureSchema(sql);
});

after(async () => {
  await db.close();
});

function entryInput(overrides = {}) {
  return {
    publicId: "abcdefgh",
    displayName: "Mara",
    age: 29,
    city: "Leipzig",
    caption: "Mein Ärmel erzählt die Geschichte meiner Reisen.",
    email: "mara@example.com",
    photoUrl: "https://store.public.blob.vercel-storage.com/contest/mara.jpg",
    photoPathname: "contest/mara.jpg",
    consentTerms: true,
    consentImage: true,
    ipHash: "ip-a",
    userAgent: "test",
    ...overrides,
  };
}

test("new entries are pending and invisible in the ranking until approved", async () => {
  const entry = await createEntry(sql, entryInput({ publicId: "pend1234" }));
  assert.equal(entry.status, "pending");
  assert.equal(entry.votes, 0);
  assert.equal((await listRanking(sql)).some((item) => item.id === entry.id), false);

  const pending = await listEntriesForModeration(sql, "pending");
  assert.ok(pending.some((item) => item.id === entry.id));
  assert.equal(pending.find((item) => item.id === entry.id).email, "mara@example.com");

  const approved = await moderateEntry(sql, entry.id, "approve");
  assert.equal(approved.status, "approved");
  assert.ok(approved.approvedAt instanceof Date);
  assert.ok((await listRanking(sql)).some((item) => item.id === entry.id));

  const byPublicId = await getEntryByPublicId(sql, "pend1234");
  assert.equal(byPublicId.id, entry.id);
  assert.equal("email" in byPublicId, false, "public entries never expose the e-mail address");
});

test("one vote per voter per entry per day, duplicates are reported", async () => {
  const entry = await createEntry(sql, entryInput({ publicId: "vote1234" }));
  await moderateEntry(sql, entry.id, "approve");

  const first = await castVote(sql, { entryId: entry.id, voterHash: "voter-1", ipHash: "ip-v" });
  assert.deepEqual(first, { status: "counted", votes: 1 });
  const again = await castVote(sql, { entryId: entry.id, voterHash: "voter-1", ipHash: "ip-v" });
  assert.deepEqual(again, { status: "duplicate", votes: 1 });
  const other = await castVote(sql, { entryId: entry.id, voterHash: "voter-2", ipHash: "ip-v" });
  assert.deepEqual(other, { status: "counted", votes: 2 });

  assert.equal((await getEntryByPublicId(sql, "vote1234")).votes, 2);
});

test("votes for unknown or unapproved entries are rejected", async () => {
  const entry = await createEntry(sql, entryInput({ publicId: "nope1234" }));
  assert.deepEqual(await castVote(sql, { entryId: entry.id, voterHash: "v", ipHash: "ip" }), { status: "not-found" });
  assert.deepEqual(
    await castVote(sql, { entryId: "00000000-0000-0000-0000-000000000000", voterHash: "v", ipHash: "ip" }),
    { status: "not-found" },
  );
});

test("an IP address may cast only a limited number of votes per day", async () => {
  const entries = [];
  for (let index = 0; index < CONTEST_LIMITS.votesPerIpPerDay + 1; index += 1) {
    const entry = await createEntry(sql, entryInput({ publicId: `ip${String(index).padStart(6, "0")}` }));
    await moderateEntry(sql, entry.id, "approve");
    entries.push(entry);
  }
  for (let index = 0; index < CONTEST_LIMITS.votesPerIpPerDay; index += 1) {
    const result = await castVote(sql, { entryId: entries[index].id, voterHash: `v${index}`, ipHash: "ip-limit" });
    assert.equal(result.status, "counted");
  }
  const blocked = await castVote(sql, { entryId: entries.at(-1).id, voterHash: "v-last", ipHash: "ip-limit" });
  assert.deepEqual(blocked, { status: "ip-limit" });
});

test("ranking orders by votes, then earlier approval; rankOf matches", async () => {
  const a = await createEntry(sql, entryInput({ publicId: "ranka234" }));
  const b = await createEntry(sql, entryInput({ publicId: "rankb234" }));
  await moderateEntry(sql, a.id, "approve");
  await moderateEntry(sql, b.id, "approve");
  for (const voter of ["r1", "r2", "r3"]) {
    await castVote(sql, { entryId: b.id, voterHash: voter, ipHash: `ip-${voter}` });
  }

  const ranking = await listRanking(sql, 100);
  const positionA = ranking.findIndex((item) => item.id === a.id);
  const positionB = ranking.findIndex((item) => item.id === b.id);
  assert.ok(positionB < positionA, "b has more votes and ranks higher");
  assert.equal(await rankOf(sql, b.id), positionB + 1);
  const pendingEntry = await createEntry(sql, entryInput({ publicId: "rankc234" }));
  assert.equal(await rankOf(sql, pendingEntry.id), null);
});

test("entries per IP and day are counted; rejected entries leave the ranking; delete returns the blob path", async () => {
  await createEntry(sql, entryInput({ publicId: "cnt00001", ipHash: "ip-count" }));
  await createEntry(sql, entryInput({ publicId: "cnt00002", ipHash: "ip-count" }));
  assert.equal(await countEntriesByIpToday(sql, "ip-count"), 2);
  assert.equal(await countEntriesByIpToday(sql, "ip-other"), 0);

  const entry = await createEntry(sql, entryInput({ publicId: "del12345", photoPathname: "contest/del.jpg" }));
  await moderateEntry(sql, entry.id, "approve");
  await castVote(sql, { entryId: entry.id, voterHash: "d1", ipHash: "ip-d" });
  const rejected = await moderateEntry(sql, entry.id, "reject");
  assert.equal(rejected.status, "rejected");
  assert.equal((await listRanking(sql, 100)).some((item) => item.id === entry.id), false);

  assert.deepEqual(await deleteEntry(sql, entry.id), { photoPathname: "contest/del.jpg" });
  assert.equal(await getEntryByPublicId(sql, "del12345"), null);
  assert.equal(await deleteEntry(sql, entry.id), null);
});
