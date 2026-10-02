// Einmalwerkzeug der WordPress-Ablösung (2026-10-02): macht aus dem REST-Export (scripts/export-wordpress.mjs)
// die Dateien, die die App jetzt liest. Nach redaktionellen Korrekturen im Repo NICHT erneut laufen lassen.
//
//   content/magazin/beitraege/<slug>.md   Beiträge, Frontmatter + bereinigtes HTML
//   content/magazin/seiten/<slug>.md      feste Seiten
//   content/staedte/<markt>-<stadt>.md    Tattoo-Singles-Stadtseiten
//   data/magazin-kategorien.json          Kategorien
//   data/magazin-autoren.json (nur Namen/IDs; Profiltexte pflegt lib/author-profiles.ts bzw. die Datei von Hand)
//   data/wordpress-alte-slugs.json        Inventar aller WP-Slugs (Beiträge, Seiten, Kategorien, Autoren, Städte)
//
// Aufruf: node --experimental-strip-types scripts/import-wordpress.mjs [.wp-export]
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sanitizeHtml from "sanitize-html";

import { normalizeHeadingLevels, splitLongParagraphs } from "../lib/article-structure.ts";
import { cleanWordPressSeoTitle } from "../lib/magazine-seo.ts";
import { decodeHtmlEntities, sanitizeMagazineHtml, stripHtml } from "../lib/magazine.ts";
import { normalizeLegacyUrls } from "../lib/magazine-urls.ts";

const exportDir = path.resolve(process.argv[2] || ".wp-export");
const read = (name) => JSON.parse(fs.readFileSync(path.join(exportDir, `${name}.json`), "utf8"));
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

const posts = read("posts");
const pages = read("pages");
const categories = read("categories");
const users = read("users");
const cities = read("stadt");

const categoryById = new Map(categories.map((category) => [category.id, category]));
const userById = new Map(users.map((user) => [user.id, user]));

/** Wie früher sanitizeMediaUrl: jedes Pfadsegment einmal dekodieren und sauber kodieren. */
function encodedPath(url) {
  return normalizeLegacyUrls(url)
    .split("/")
    .map((segment, index) => (index === 0 || segment === "" ? segment : encodeURIComponent(decodeURIComponent(segment))))
    .join("/");
}

function frontmatterFor(item, extra = {}) {
  const featured = item._embedded?.["wp:featuredmedia"]?.[0];
  const seoTitle = cleanWordPressSeoTitle(decodeHtmlEntities(item.aioseo_head_json?.title || ""));
  const description = decodeHtmlEntities(item.aioseo_head_json?.description || "").trim();
  const data = {
    id: item.id,
    title: decodeHtmlEntities(item.title?.rendered || ""),
    ...(seoTitle ? { seoTitle } : {}),
    ...(description ? { description } : {}),
    excerpt: sanitizeMagazineHtml(normalizeLegacyUrls(item.excerpt?.rendered || "")),
    published: item.date,
    updated: item.modified,
    categories: (item.categories || []).map((id) => categoryById.get(id)?.slug).filter(Boolean),
    author: userById.get(item.author)?.slug,
    ...(featured?.source_url ? { image: encodedPath(featured.source_url) } : {}),
    ...(featured?.alt_text ? { imageAlt: decodeHtmlEntities(featured.alt_text) } : {}),
    ...extra,
  };
  if (!data.categories.length) delete data.categories;
  if (!data.author) delete data.author;
  return data;
}

function bodyFor(item) {
  const html = normalizeLegacyUrls(item.content?.rendered || "");
  return normalizeHeadingLevels(splitLongParagraphs(sanitizeMagazineHtml(html))).trim();
}

function writeEntry(folder, item) {
  const text = matter.stringify(`${bodyFor(item)}\n`, frontmatterFor(item), { lineWidth: -1 });
  write(path.join("content", "magazin", folder, `${item.slug}.md`), text);
}

for (const post of posts) writeEntry("beitraege", post);
for (const page of pages) writeEntry("seiten", page);

write(
  path.join("data", "magazin-kategorien.json"),
  `${JSON.stringify(
    categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: decodeHtmlEntities(category.name),
      description: decodeHtmlEntities(category.description || ""),
    })),
    null,
    2,
  )}\n`,
);

// --- Stadtseiten (frühere Custom Post Type "stadt") -------------------------------------------------------------

const CITY_HTML_POLICY = {
  allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "a", "blockquote", "br"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attributes) => ({
      tagName: "a",
      attribs: { ...attributes, ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}) },
    }),
  },
};

for (const item of cities) {
  const acf = item.acf || {};
  const identity = acf.city_id || "";
  const separator = identity.indexOf(":");
  const slug = separator >= 0 ? identity.slice(separator + 1).toLowerCase() : item.slug.replace(/^(?:de|ch)-/, "");
  const country = acf.city_country || identity.split(":")[0];
  if (!["DE", "CH", "AT"].includes(country)) throw new Error(`Unbekanntes Land für Stadt ${item.id}`);
  const market = country.toLowerCase();

  const cityName = decodeHtmlEntities(acf.city_name || stripHtml(item.title?.rendered || ""));
  const title = decodeHtmlEntities(stripHtml(item.title?.rendered || ""));
  const metaDescription = decodeHtmlEntities(acf.hero_lead || stripHtml(item.excerpt?.rendered || ""));
  const media = item._embedded?.["wp:featuredmedia"]?.[0];
  const sources = Array.isArray(acf.sources) ? acf.sources : [];
  const imageSource = sources.find((source) => /bild/i.test(source.note || "")) || sources[1];
  const imageLicense =
    sources.find((source) => /lizenz/i.test(source.note || "")) ||
    sources.find((source) => /license|lizenz/i.test(source.title || ""));

  const data = {
    id: item.id,
    market,
    slug,
    cityName,
    cityRegion: decodeHtmlEntities(acf.city_region || ""),
    title,
    metaDescription,
    h1: decodeHtmlEntities(acf.hero_title || title),
    heroTitle: decodeHtmlEntities(acf.city_hero_claim || metaDescription),
    ...(media?.source_url ? { image: normalizeLegacyUrls(media.source_url) } : {}),
    imageAlt: decodeHtmlEntities(media?.alt_text || cityName),
    imageAttribution: {
      label: decodeHtmlEntities(imageSource?.title || "Bildquelle der Stadtseite"),
      sourceUrl: imageSource?.url || "",
      publisher: decodeHtmlEntities(imageSource?.publisher || ""),
      licenseLabel: decodeHtmlEntities(imageLicense?.title || ""),
      licenseUrl: imageLicense?.url || "",
    },
    registrationUrl: acf.primary_cta_url || `https://dich-mit-stich.${market}/registration/`,
  };
  const body = sanitizeHtml(normalizeLegacyUrls(item.content?.rendered || ""), CITY_HTML_POLICY).trim();
  write(path.join("content", "staedte", `${market}-${slug}.md`), matter.stringify(`${body}\n`, data, { lineWidth: -1 }));
}

// --- Inventar der WordPress-Slugs (für Weiterleitungen und Vorher/Nachher-Vergleich) ----------------------------

const inventory = {
  stand: "2026-10-02",
  quelle: "https://dich-mit-stich.de/cms-mag/ (REST ?rest_route=/wp/v2)",
  beitraege: posts.map((post) => ({ id: post.id, slug: post.slug, link: post.link })),
  seiten: pages.map((page) => ({ id: page.id, slug: page.slug, link: page.link })),
  kategorien: categories.map((category) => ({ id: category.id, slug: category.slug, count: category.count })),
  autoren: users.map((user) => ({ id: user.id, slug: user.slug, name: user.name })),
  staedte: cities.map((city) => ({ id: city.id, slug: city.slug, stadt: city.acf?.city_id })),
};
write(path.join("data", "wordpress-inventar.json"), `${JSON.stringify(inventory, null, 2)}\n`);

console.log(`${posts.length} Beiträge, ${pages.length} Seiten, ${categories.length} Kategorien, ${cities.length} Städte`);
