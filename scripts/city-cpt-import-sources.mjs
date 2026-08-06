import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCityRecord } from "./city-cpt-import-lib.mjs";

export const DE_CITY_SLUGS = [
  "berlin",
  "bochum",
  "bremen",
  "dortmund",
  "dresden",
  "duesseldorf",
  "essen",
  "frankfurt-am-main",
  "hamburg",
  "hannover",
  "koeln",
  "leipzig",
  "mannheim",
  "muenchen",
  "nuernberg",
  "stuttgart",
];

const DE_CITY_NAMES = {
  berlin: "Berlin",
  bochum: "Bochum",
  bremen: "Bremen",
  dortmund: "Dortmund",
  dresden: "Dresden",
  duesseldorf: "Düsseldorf",
  essen: "Essen",
  "frankfurt-am-main": "Frankfurt am Main",
  hamburg: "Hamburg",
  hannover: "Hannover",
  koeln: "Köln",
  leipzig: "Leipzig",
  mannheim: "Mannheim",
  muenchen: "München",
  nuernberg: "Nürnberg",
  stuttgart: "Stuttgart",
};

function asPath(rootDir) {
  return rootDir instanceof URL ? fileURLToPath(rootDir) : path.resolve(rootDir);
}

function decodeHtml(value) {
  const named = {
    amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", ndash: "–", quot: '"',
    auml: "ä", Auml: "Ä", eacute: "é", Eacute: "É", ouml: "ö", Ouml: "Ö",
    szlig: "ß", uuml: "ü", Uuml: "Ü",
  };
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (entity, name) => named[name] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html, pattern) {
  return decodeHtml(html.match(pattern)?.[1] || "");
}

function extractContent(html) {
  return (html.match(
    /<div class="text-content m-t-64 m-b-64">([\s\S]*?)<\/div>\s*<div class="">\s*<a href="https:\/\/dich-mit-stich\.de\/registration\//i,
  )?.[1] || "")
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/loading="lazy"/gi, 'loading="lazy" decoding="async"')
    .replace(/\sdata-media-id="[^"]*"/gi, "")
    .trim();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadGermanRecords({ fetchImpl, root }) {
  const imageInventory = await loadJson(path.join(root, "data", "tattoo-city-images.json"));
  return Promise.all(DE_CITY_SLUGS.map(async (slug) => {
    const sourceUrl = `https://dich-mit-stich.de/tattoo-singles/${slug}/`;
    const response = await fetchImpl(sourceUrl, {
      headers: { "User-Agent": "Dich-mit-Stich WordPress city migration" },
    });
    if (!response.ok) throw new Error(`German city source failed for ${slug}`);
    const html = await response.text();
    const contentHtml = extractContent(html);
    if (!contentHtml) throw new Error(`German city content missing for ${slug}`);
    const image = imageInventory[slug];

    return buildCityRecord({
      market: "de",
      slug,
      cityName: DE_CITY_NAMES[slug],
      title: firstMatch(html, /<title>([\s\S]*?)<\/title>/i),
      metaDescription: firstMatch(html, /<meta name="description" content="([^"]+)"/i),
      h1: firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      heroTitle: firstMatch(html, /<h2 class="h2 semibold">([\s\S]*?)<\/h2>/i),
      contentHtml,
      registrationUrl: firstMatch(html, /<form action="([^"]*registration[^"]*)"/i) || "https://dich-mit-stich.de/registration/",
      sourceUrl,
      imageUrl: image.imageUrl,
      imagePath: path.join(root, "public", "cities", `${slug}.jpg`),
      imageAttribution: {
        label: `${image.imageAttribution.title} · ${image.imageAttribution.creator} · ${image.imageAttribution.license}`,
        sourceUrl: image.imageAttribution.sourceUrl,
      },
    });
  }));
}

async function loadSwissRecords({ root }) {
  const inventory = await loadJson(path.join(root, "data", "tattoo-cities-ch.json"));
  return Object.values(inventory.cities).map((city) => buildCityRecord({
    ...city,
    market: "ch",
    imagePath: path.join(root, "public", city.imageUrl.replace(/^\//, "")),
  }));
}

export async function loadCityManifest({ fetchImpl = fetch, rootDir = process.cwd() } = {}) {
  const root = asPath(rootDir);
  const [de, ch] = await Promise.all([
    loadGermanRecords({ fetchImpl, root }),
    loadSwissRecords({ root }),
  ]);
  return [...de, ...ch];
}
