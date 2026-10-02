// Einmalwerkzeug: lädt WordPress-Uploads (öffentliche URLs) in einen lokalen Ordner.
// Aufruf: node scripts/download-wp-uploads.mjs <liste.txt> <zielordner>
// Die Liste enthält je Zeile eine URL oder einen Pfad (/magazin|cms-mag/wp-content/uploads/...). Vorhandene Dateien werden übersprungen.
import fs from "node:fs";
import path from "node:path";

const [listFile, targetDir] = process.argv.slice(2);
if (!listFile || !targetDir) throw new Error("Aufruf: download-wp-uploads.mjs <liste.txt> <zielordner>");

const ORIGIN = "https://dich-mit-stich.de";
const lines = fs.readFileSync(listFile, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function relativeUpload(value) {
  const cleaned = value.replace(/^(https?:)?\/\/(?:www\.)?dich-mit-stich\.de(?:\.de)?/, "");
  const match = cleaned.match(/^\/(?:magazin|cms-mag)\/wp-content\/uploads\/(.+)$/);
  return match ? decodeURIComponent(match[1].split("?")[0]) : null;
}

const wanted = new Map();
for (const line of lines) {
  const relative = relativeUpload(line);
  if (relative) wanted.set(relative, `${ORIGIN}/cms-mag/wp-content/uploads/${relative.split("/").map(encodeURIComponent).join("/")}`);
}

const missing = [];
const queue = [...wanted.entries()];

async function worker() {
  while (queue.length) {
    const [relative, url] = queue.shift();
    const target = path.join(targetDir, ...relative.split("/"));
    if (fs.existsSync(target) && fs.statSync(target).size > 0) continue;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        const response = await fetch(url, { headers: { "User-Agent": "dich-mit-stich wp export" } });
        if (response.ok) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
          ok = true;
        } else if (response.status === 404) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
    if (!ok) missing.push(relative);
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
console.log(`geladen/vorhanden: ${wanted.size - missing.length} von ${wanted.size}; fehlend: ${missing.length}`);
for (const relative of missing) console.log("FEHLT", relative);
