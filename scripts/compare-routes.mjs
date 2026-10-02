// Vorher/Nachher-Vergleich der WordPress-Ablösung: vergleicht zwei Crawls (scripts/crawl-routes.mjs) Route für Route.
// Geprüft werden Status, sichtbarer Text, Links (a href) und Bildpfade (img src/srcset, auf den Upload-Pfad normiert).
// Aufruf: node scripts/compare-routes.mjs <vorher-ordner> <nachher-ordner> [--verbose]
import fs from "node:fs";
import path from "node:path";

const [beforeDir, afterDir] = process.argv.slice(2);
const verbose = process.argv.includes("--verbose");
const before = JSON.parse(fs.readFileSync(path.join(beforeDir, "_status.json"), "utf8"));
const after = JSON.parse(fs.readFileSync(path.join(afterDir, "_status.json"), "utf8"));

const fileName = (route) => route.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "root";

function normalizeUrl(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/(?:https?:\/\/[^/"' ]+)?(?:\/app-assets)?\/_next\/image\/?\?url=([^&"' ]+)[^"' ]*/g, (_m, url) => decodeURIComponent(url))
    .replace(/https?:\/\/(?:www\.)?dich-mit-stich\.de\/(?:cms-mag|magazin)\/wp-content\/uploads\//g, "/UPLOADS/")
    .replace(/https?:\/\/dich-mit-stich\.vercel\.app\/app-assets\/magazin\/wp-content\/uploads\//g, "/UPLOADS/")
    .replace(/https?:\/\/localhost:\d+\/app-assets\/magazin\/wp-content\/uploads\//g, "/UPLOADS/")
    .replace(/https?:\/\/dich-mit-stich\.vercel\.app\/app-assets/g, "/ASSETS")
    .replace(/https?:\/\/localhost:\d+\/app-assets/g, "/ASSETS")
    .replace(/https?:\/\/(?:dich-mit-stich\.vercel\.app|localhost:\d+)/g, "");
}

function parts(html) {
  const main = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = main
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  const links = [...main.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/gi)].map((m) => normalizeUrl(m[1])).sort();
  const images = [...main.matchAll(/<img\b[^>]*>/gi)]
    .map((m) => {
      const src = normalizeUrl(m[0].match(/\bsrc="([^"]*)"/i)?.[1] ?? "");
      const alt = m[0].match(/\balt="([^"]*)"/i)?.[1] ?? "<kein alt>";
      return `${src} | ${alt}`;
    })
    .sort();
  const head = [...main.matchAll(/<(?:title|meta name="description"|link rel="canonical")[^>]*>(?:[^<]*<\/title>)?/gi)]
    .map((m) => normalizeUrl(m[0]))
    .sort();
  return { text, links, images, head };
}

let identical = 0;
const different = [];
for (const route of Object.keys(before)) {
  const a = before[route];
  const b = after[route];
  if (!b) { different.push([route, "fehlt nachher"]); continue; }
  if (a.status !== b.status || normalizeUrl(a.location) !== normalizeUrl(b.location)) {
    different.push([route, `Status ${a.status} ${a.location} -> ${b.status} ${b.location}`]);
    continue;
  }
  if (a.status >= 400 || a.status >= 300) { identical += 1; continue; }
  const x = parts(fs.readFileSync(path.join(beforeDir, `${fileName(route)}.html`), "utf8"));
  const y = parts(fs.readFileSync(path.join(afterDir, `${fileName(route)}.html`), "utf8"));
  const problems = [];
  if (x.text !== y.text) {
    let i = 0;
    while (i < x.text.length && x.text[i] === y.text[i]) i += 1;
    problems.push(`Text weicht ab ab Zeichen ${i}: «${x.text.slice(Math.max(0, i - 40), i + 80)}» vs «${y.text.slice(Math.max(0, i - 40), i + 80)}»`);
  }
  if (JSON.stringify(x.links) !== JSON.stringify(y.links)) problems.push(`Links weichen ab (${x.links.length} vs ${y.links.length})`);
  if (JSON.stringify(x.images) !== JSON.stringify(y.images)) problems.push(`Bilder weichen ab (${x.images.length} vs ${y.images.length})`);
  if (JSON.stringify(x.head) !== JSON.stringify(y.head)) problems.push(`Head weicht ab: ${JSON.stringify(x.head)} vs ${JSON.stringify(y.head)}`);
  if (problems.length) {
    different.push([route, problems.join(" | ")]);
    if (verbose && (x.links.join() !== y.links.join())) {
      const sa = new Set(x.links), sb = new Set(y.links);
      console.log(route, "nur vorher:", x.links.filter((l) => !sb.has(l)).slice(0, 5), "nur nachher:", y.links.filter((l) => !sa.has(l)).slice(0, 5));
    }
    if (verbose && (x.images.join() !== y.images.join())) {
      const sa = new Set(x.images), sb = new Set(y.images);
      console.log(route, "Bilder nur vorher:", x.images.filter((l) => !sb.has(l)).slice(0, 3), "nur nachher:", y.images.filter((l) => !sa.has(l)).slice(0, 3));
    }
  } else identical += 1;
}
console.log(`${Object.keys(before).length} Routen verglichen, ${identical} identisch, ${different.length} mit Abweichung`);
for (const [route, why] of different) console.log("ABW", route, why.slice(0, 600));
