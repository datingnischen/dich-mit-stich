// Einmaliger Vollexport des Magazin-WordPress (öffentliche REST-API, nur Lesen, keine Zugangsdaten).
// Schreibt je Route eine JSON-Datei nach <ausgabeordner> (Standard: .wp-export, gitignored).
// Aufruf: node scripts/export-wordpress.mjs [ausgabeordner]
import fs from "node:fs";
import path from "node:path";

const BASE = "https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2";
const out = path.resolve(process.argv[2] || ".wp-export");
fs.mkdirSync(out, { recursive: true });

async function getJson(route, params) {
  const url = `${BASE}${route}&${new URLSearchParams(params)}`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "dich-mit-stich wp export" } });
    if (response.ok) return { items: await response.json(), pages: Number(response.headers.get("x-wp-totalpages") || 1) };
    if (attempt === 4) throw new Error(`${route} ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

async function exportRoute(name, route, extra = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const { items, pages } = await getJson(route, { per_page: 50, page, ...extra });
    all.push(...items);
    if (page >= pages || !items.length) break;
    page += 1;
  }
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(all, null, 2));
  console.log(name, all.length);
  return all;
}

await exportRoute("posts", "/posts", { _embed: 1, status: "publish" });
await exportRoute("pages", "/pages", { _embed: 1, status: "publish" });
await exportRoute("categories", "/categories", { hide_empty: false });
await exportRoute("tags", "/tags", { hide_empty: false });
await exportRoute("users", "/users");
await exportRoute("media", "/media");
await exportRoute("stadt", "/stadt", { _embed: 1 });
