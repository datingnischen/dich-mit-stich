// Vorher/Nachher-Vergleich der Migration: lädt alle relevanten Routen und speichert den HTML-Text.
// Aufruf: node scripts/crawl-routes.mjs <basis-url> <ausgabeordner> [routen-datei]
// Routenliste (JSON-Array) wird bei der ersten Ausführung aus .wp-export erzeugt, wenn keine Datei angegeben ist.
import fs from "node:fs";
import path from "node:path";

const [base, outDir, routesFile] = process.argv.slice(2);
if (!base || !outDir) throw new Error("Aufruf: crawl-routes.mjs <basis-url> <ausgabeordner> [routen.json]");
fs.mkdirSync(outDir, { recursive: true });

const routes = JSON.parse(fs.readFileSync(routesFile || ".wp-export/routes.json", "utf8"));
const results = {};
const queue = [...routes];

function fileName(route) {
  return route.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "root";
}

async function worker() {
  while (queue.length) {
    const route = queue.shift();
    let status = 0;
    let location = "";
    let body = "";
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(base + route, { redirect: "manual", headers: { "User-Agent": "dich-mit-stich migration check" } });
        status = response.status;
        location = response.headers.get("location") || "";
        body = await response.text();
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    results[route] = { status, location: location.replace(base, ""), length: body.length };
    fs.writeFileSync(path.join(outDir, `${fileName(route)}.html`), body);
  }
}

await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync(path.join(outDir, "_status.json"), JSON.stringify(results, null, 2));
const bad = Object.entries(results).filter(([, value]) => value.status >= 400 || value.status === 0);
console.log(`${routes.length} Routen, davon ${bad.length} mit Fehlerstatus`);
for (const [route, value] of bad) console.log(value.status, route);
