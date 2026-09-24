#!/usr/bin/env node
// Spielt punktgenaue Textkorrekturen in Magazin-Seiten/-Beiträge ein, ohne den übrigen Inhalt anzufassen.
// Aufruf: node --env-file=.env.local scripts/apply-wp-text-edits.mjs <edits.json> [--write] [--only=slug,slug] [--max-shrink=0.03] [--backup-dir=pfad]
//
// edits.json: { "<slug>": { "edits": [ { "find": "…", "replace": "…", "reason": "…" } ], "title": "neuer Titel (optional)" } }
// Jede Fundstelle muss im aktuellen WordPress-Rohtext genau einmal vorkommen, sonst bleibt der ganze Artikel
// unverändert. Ohne --write ist es ein Probelauf. Vor dem Schreiben wird der alte Rohtext gesichert.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const API = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const args = process.argv.slice(2);
const editsPath = args.find((arg) => !arg.startsWith("--"));
const write = args.includes("--write");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length).split(",").filter(Boolean);
// Bewusste Kürzungen (z. B. ein falscher Absatz wird durch einen kürzeren ersetzt) nur ausdrücklich erlauben.
const maxShrink = Number(args.find((arg) => arg.startsWith("--max-shrink="))?.slice("--max-shrink=".length) ?? 0.03);
const backupDir = args.find((arg) => arg.startsWith("--backup-dir="))?.slice("--backup-dir=".length) ?? path.join(os.tmpdir(), "dms-wp-backups");

if (!editsPath) {
  console.error("Aufruf: node --env-file=.env.local scripts/apply-wp-text-edits.mjs <edits.json> [--write] [--only=slug,slug]");
  process.exit(1);
}

const username = process.env.DMS_WP_USERNAME || "";
const password = process.env.DMS_WP_APPLICATION_PASSWORD || "";
if (!username || !password) {
  console.error("DMS_WP_USERNAME und DMS_WP_APPLICATION_PASSWORD müssen gesetzt sein (Rohtext braucht context=edit).");
  process.exit(1);
}
const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

const visibleText = (html) => html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function occurrences(haystack, needle) {
  let count = 0;
  for (let index = haystack.indexOf(needle); index !== -1; index = haystack.indexOf(needle, index + 1)) count++;
  return count;
}

async function loadEntry(slug) {
  for (const type of ["pages", "posts"]) {
    const res = await fetch(`${API}/${type}?slug=${encodeURIComponent(slug)}&context=edit&_fields=id,slug,modified,title,content`, {
      headers: { Authorization: authorization },
    });
    if (!res.ok) throw new Error(`${type} ${slug}: HTTP ${res.status}`);
    const [item] = await res.json();
    if (item) return { ...item, type };
  }
  return null;
}

function applyEdits(raw, edits) {
  const problems = [];
  for (const edit of edits) {
    if (edit.find === edit.replace) problems.push(`unverändert: ${edit.find.slice(0, 60)}`);
    const count = occurrences(raw, edit.find);
    if (count !== 1) problems.push(`${count}× gefunden: ${edit.find.slice(0, 80)}`);
  }
  if (problems.length) return { problems };

  // Stand vor dem Ersetzen bestimmt die Positionen, damit sich Ersetzungen nicht gegenseitig beeinflussen.
  const spans = edits
    .map((edit) => ({ ...edit, start: raw.indexOf(edit.find), end: raw.indexOf(edit.find) + edit.find.length }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].start < spans[i - 1].end) problems.push(`überlappend: ${spans[i].find.slice(0, 60)}`);
  }
  if (problems.length) return { problems };

  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += raw.slice(cursor, span.start) + span.replace;
    cursor = span.end;
  }
  return { content: result + raw.slice(cursor), problems };
}

const allEdits = JSON.parse(await readFile(editsPath, "utf8"));
const slugs = Object.keys(allEdits).filter((slug) => !only || only.includes(slug));
let changed = 0;
let skipped = 0;

for (const slug of slugs) {
  const edits = allEdits[slug].edits ?? [];
  const title = allEdits[slug].title;
  if (!edits.length && !title) continue;

  const entry = await loadEntry(slug);
  if (!entry) {
    console.log(`✗ ${slug}: nicht gefunden`);
    skipped++;
    continue;
  }

  const raw = entry.content.raw;
  const { content, problems } = applyEdits(raw, edits);
  if (!content) {
    console.log(`✗ ${slug}: übersprungen\n    ${problems.join("\n    ")}`);
    skipped++;
    continue;
  }

  const before = visibleText(raw).length;
  const after = visibleText(content).length;
  if (after < before * (1 - maxShrink)) {
    console.log(`✗ ${slug}: sichtbarer Text schrumpft von ${before} auf ${after} Zeichen – übersprungen`);
    skipped++;
    continue;
  }

  console.log(`${write ? "✓" : "○"} ${slug} (${entry.type} ${entry.id}): ${edits.length} Korrekturen, Text ${before} → ${after} Zeichen`);
  if (title) console.log(`    [Titel] ${entry.title.raw}
      → ${title}`);
  for (const edit of edits) console.log(`    [${edit.reason}] ${edit.find.replace(/\s+/g, " ").slice(0, 90)}\n      → ${edit.replace.replace(/\s+/g, " ").slice(0, 90)}`);

  if (!write) continue;

  await mkdir(backupDir, { recursive: true });
  await writeFile(path.join(backupDir, `${slug}-${entry.modified.replace(/:/g, "-")}.html`), raw);
  if (title) await writeFile(path.join(backupDir, `${slug}-${entry.modified.replace(/:/g, "-")}.title.txt`), entry.title.raw);
  const res = await fetch(`${API}/${entry.type}/${entry.id}`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify(title ? { content, title } : { content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.log(`✗ ${slug}: Fehler ${res.status} ${body.code ?? ""} ${body.message ?? ""}`);
    skipped++;
    continue;
  }
  changed++;
}

console.log(`\n${write ? "Geschrieben" : "Probelauf"}: ${write ? changed : slugs.length - skipped} Artikel, übersprungen: ${skipped}`);
