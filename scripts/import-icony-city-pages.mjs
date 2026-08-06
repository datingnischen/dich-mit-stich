import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_ORIGIN = "https://dich-mit-stich.ch";
const SOURCE_INDEX = `${SOURCE_ORIGIN}/tattoo-singles/`;
const OUTPUT_FILE = fileURLToPath(new URL("../data/tattoo-cities-ch.json", import.meta.url));
const IMAGE_DIR = fileURLToPath(new URL("../public/cities/ch/", import.meta.url));
const USER_AGENT = "DichMitStich/1.0 ICONY city migration";

const entityMap = {
  amp: "&",
  apos: "'",
  quot: '"',
  nbsp: " ",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  szlig: "ß",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  iuml: "ï",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeHtmlEntities(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === "#") {
      const hex = code[1].toLowerCase() === "x";
      const parsed = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }
    return entityMap[code] ?? entity;
  });
}

function stripTags(value) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function firstMatch(html, pattern, label, sourceUrl) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`Missing ${label} in ${sourceUrl}`);
  return stripTags(value);
}

async function fetchChecked(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  return response;
}

function extractCityLinks(indexHtml) {
  const found = new Map();
  const pattern = /<a\b[^>]*href="https:\/\/dich-mit-stich\.ch\/tattoo-singles\/([^/"?#]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of indexHtml.matchAll(pattern)) {
    const slug = match[1];
    if (!found.has(slug)) found.set(slug, stripTags(match[2]));
  }
  if (found.size !== 10) throw new Error(`Expected 10 CH city links, found ${found.size}`);
  return [...found].map(([slug, label]) => ({ slug, label }));
}

function extractAttribute(tag, name) {
  return decodeHtmlEntities(tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1] || "");
}

function extractRelatedCities(contentHtml, ownSlug, supportedSlugs) {
  const related = [];
  const seen = new Set();
  const pattern = /<a\b[^>]*href="https:\/\/dich-mit-stich\.ch\/tattoo-singles\/([^/"?#]+)\/"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of contentHtml.matchAll(pattern)) {
    const slug = match[1];
    if (slug === ownSlug || !supportedSlugs.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    related.push({ slug, label: stripTags(match[2]) });
  }
  return related;
}

function sanitizeEditorialHtml(contentHtml) {
  return contentHtml
    .replace(/<p>\s*<img\b[^>]*>\s*<\/p>/i, "")
    .replace(/<h2[^>]*>\s*Andere interessante Städte[\s\S]*?(?=<hr\b)/i, "")
    .replace(/<hr\b[^>]*>[\s\S]*$/i, "")
    .replace(/<(script|iframe|form|object|embed)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|form|object|embed)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\sdata-[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "")
    .replace(/<a\b([^>]*?)\starget="_blank"([^>]*)>/gi, (tag, before, after) => {
      if (/\srel=/i.test(tag)) return tag;
      return `<a${before} target="_blank" rel="noopener noreferrer nofollow"${after}>`;
    })
    .replace(/https:\/\/dich-mit-stich\.ch\/tattoo-singles\//gi, "/tattoo-singles/")
    .trim();
}

async function writeIfChanged(path, content) {
  const existing = await readFile(path).catch(() => null);
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (existing?.equals(next)) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, next);
  return true;
}

async function importImage(originalImageUrl, slug) {
  const imageUrl = new URL(originalImageUrl);
  if (imageUrl.protocol !== "https:" || imageUrl.hostname !== "static-cms.icony-hosting.de") {
    throw new Error(`Unexpected image host for ${slug}: ${originalImageUrl}`);
  }
  const response = await fetchChecked(originalImageUrl);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error(`Unexpected image content type for ${slug}: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000) throw new Error(`Image for ${slug} is unexpectedly small: ${bytes.length} bytes`);
  const changed = await writeIfChanged(join(IMAGE_DIR, `${slug}.jpg`), bytes);
  return { changed, bytes: bytes.length };
}

async function importCity({ slug, label }, supportedSlugs) {
  const sourceUrl = `${SOURCE_INDEX}${slug}/`;
  const html = await (await fetchChecked(sourceUrl)).text();
  const contentHtml = html.match(
    /<div class="text-content m-t-64 m-b-64">([\s\S]*?)<\/div>\s*<div class="">\s*<a href="https:\/\/dich-mit-stich\.ch\/registration\//i,
  )?.[1];
  if (!contentHtml) throw new Error(`Missing editorial content in ${sourceUrl}`);

  const imageTag = contentHtml.match(/<img\b[^>]*>/i)?.[0];
  if (!imageTag) throw new Error(`Missing editorial image in ${sourceUrl}`);
  const originalImageUrl = extractAttribute(imageTag, "src");
  const imageAlt = extractAttribute(imageTag, "alt");
  const imageSourceUrl = contentHtml.match(/Bildquelle:\s*(https?:\/\/[^<\s]+)/i)?.[1];
  if (!imageSourceUrl) throw new Error(`Missing image attribution in ${sourceUrl}`);

  const relatedCities = extractRelatedCities(contentHtml, slug, supportedSlugs);
  const cleanContentHtml = sanitizeEditorialHtml(contentHtml);
  if (cleanContentHtml.length < 1_000) throw new Error(`Editorial content for ${slug} is unexpectedly short`);
  if (/(?:user-media|registration\/|static-cms\.icony-hosting|<script|<iframe|<form)/i.test(cleanContentHtml)) {
    throw new Error(`Unsafe or dynamic markup remained in ${slug}`);
  }

  const imageResult = await importImage(originalImageUrl, slug);
  return {
    city: {
      slug,
      cityName: label.replace(/^Tattoo-Singles in\s+/i, "").replace(/:\s*[\s\S]*$/, "").trim(),
      title: firstMatch(html, /<title>([\s\S]*?)<\/title>/i, "title", sourceUrl),
      metaDescription: firstMatch(html, /<meta\s+name="description"\s+content="([^"]+)"/i, "meta description", sourceUrl),
      h1: firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, "h1", sourceUrl),
      heroTitle: firstMatch(html, /<h2\s+class="h2 semibold"[^>]*>([\s\S]*?)<\/h2>/i, "hero title", sourceUrl),
      imageUrl: `/cities/ch/${slug}.jpg`,
      originalImageUrl,
      imageAlt,
      imageAttribution: {
        label: "Bildquelle der ICONY-Stadtseite",
        sourceUrl: decodeHtmlEntities(imageSourceUrl),
      },
      contentHtml: cleanContentHtml,
      relatedCities,
      registrationUrl: `${SOURCE_ORIGIN}/registration/`,
      sourceUrl,
    },
    imageResult,
  };
}

async function main() {
  const indexHtml = await (await fetchChecked(SOURCE_INDEX)).text();
  const cityLinks = extractCityLinks(indexHtml);
  const supportedSlugs = new Set(cityLinks.map((city) => city.slug));
  const cities = {};
  let changedImages = 0;

  for (const cityLink of cityLinks) {
    const imported = await importCity(cityLink, supportedSlugs);
    cities[cityLink.slug] = imported.city;
    if (imported.imageResult.changed) changedImages += 1;
    console.log(`Imported ${cityLink.slug}: ${imported.city.contentHtml.length} HTML chars, ${imported.imageResult.bytes} image bytes`);
  }

  const inventory = {
    market: "ch",
    sourceUrl: SOURCE_INDEX,
    overview: {
      title: firstMatch(indexHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i, "overview h1", SOURCE_INDEX),
      description: firstMatch(indexHtml, /<meta\s+name="description"\s+content="([^"]+)"/i, "overview meta description", SOURCE_INDEX),
      cityLinks: cityLinks.map(({ slug }) => ({ slug, label: cities[slug].cityName, imageUrl: cities[slug].imageUrl })),
    },
    cities,
  };

  const jsonChanged = await writeIfChanged(OUTPUT_FILE, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(`CH city import complete: ${cityLinks.length} cities, JSON ${jsonChanged ? "updated" : "unchanged"}, ${changedImages} images updated`);
}

await main();
