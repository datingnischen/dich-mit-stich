#!/usr/bin/env node
// Ersetzt den Inhalt einer Magazin-Seite (oder mit --type=posts eines Beitrags) in WordPress durch eine lokale HTML-Datei.
// Aufruf: DMS_WP_USERNAME=... DMS_WP_APPLICATION_PASSWORD=... node scripts/update-wp-page-content.mjs <id> <html-datei> [--type=posts] [--dry-run]
import { readFile } from "node:fs/promises";

const API = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const [pageId, htmlPath] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const type = process.argv.includes("--type=posts") ? "posts" : "pages";

if (!/^\d+$/.test(pageId ?? "") || !htmlPath) {
  console.error("Aufruf: node scripts/update-wp-page-content.mjs <id> <html-datei> [--type=posts] [--dry-run]");
  process.exit(1);
}

const username = process.env.DMS_WP_USERNAME || "";
const password = process.env.DMS_WP_APPLICATION_PASSWORD || "";
if (!dryRun && (!username || !password)) {
  console.error("DMS_WP_USERNAME und DMS_WP_APPLICATION_PASSWORD müssen gesetzt sein.");
  process.exit(1);
}

const content = (await readFile(htmlPath, "utf8")).trim();
const current = await fetch(`${API}/${type}/${pageId}?_fields=id,slug,modified`).then((res) => res.json());
console.log(`${type === "posts" ? "Beitrag" : "Seite"} ${current.id} (${current.slug}), zuletzt geändert ${current.modified}`);
console.log(`Neuer Inhalt: ${content.length} Zeichen aus ${htmlPath}`);

if (dryRun) {
  console.log("Dry-Run: nichts geschrieben.");
  process.exit(0);
}

const res = await fetch(`${API}/${type}/${pageId}`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ content }),
});
const body = await res.json();
if (!res.ok) {
  console.error(`Fehler ${res.status}: ${body.code ?? ""} ${body.message ?? ""}`);
  process.exit(1);
}
console.log(`Gespeichert: ${body.link} (geändert ${body.modified})`);
