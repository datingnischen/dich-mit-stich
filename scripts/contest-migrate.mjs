// Legt die Contest-Tabellen an (idempotent). Aufruf: node --env-file=.env.local scripts/contest-migrate.mjs
import { neon } from "@neondatabase/serverless";
import { CONTEST_SCHEMA_STATEMENTS } from "../lib/contest/schema.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL fehlt (vercel env pull .env.local).");
  process.exit(1);
}

const sql = neon(connectionString);
for (const statement of CONTEST_SCHEMA_STATEMENTS) {
  await sql.query(statement);
}
const [{ entries }] = await sql.query("SELECT count(*)::int AS entries FROM contest_entries");
console.log(`Contest-Schema bereit, ${entries} Beiträge vorhanden.`);
