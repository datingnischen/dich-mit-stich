import { neon } from "@neondatabase/serverless";
import { CONTEST_SCHEMA_STATEMENTS } from "./schema.ts";

export type SqlRow = Record<string, unknown>;
/** Minimale Abfrage-Schnittstelle: Produktion Neon (HTTP), Tests PGlite. */
export type SqlClient = (text: string, params?: unknown[]) => Promise<SqlRow[]>;

export async function ensureSchema(sql: SqlClient) {
  for (const statement of CONTEST_SCHEMA_STATEMENTS) {
    await sql(statement);
  }
}

export function isContestDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isContestBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isContestConfigured() {
  return isContestDatabaseConfigured() && isContestBlobConfigured() && Boolean(process.env.CONTEST_SECRET);
}

let schemaReady: Promise<void> | null = null;
let client: SqlClient | null = null;

/** Neon-Client mit einmalig je Prozess sichergestelltem Schema. Wirft ohne DATABASE_URL. */
export function getContestSql(): SqlClient {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL fehlt: Neon-Datenbank im Vercel-Projekt verbinden (docs/contest.md).");
  }
  const neonSql = neon(connectionString);
  const raw: SqlClient = async (text, params = []) => (await neonSql.query(text, params as never[])) as SqlRow[];
  client = async (text, params) => {
    schemaReady ??= ensureSchema(raw).catch((error) => {
      schemaReady = null;
      throw error;
    });
    await schemaReady;
    return raw(text, params);
  };
  return client;
}

/** Nur für Tests: Client austauschen (z. B. PGlite). */
export function setContestSqlForTests(testClient: SqlClient | null) {
  client = testClient;
  schemaReady = testClient ? Promise.resolve() : null;
}
