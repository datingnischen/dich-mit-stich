import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getTattooStudio,
  getTattooStudioCities,
  getTattooStudioCityGuide,
  normalizeTattooStudioManifest,
} from "../lib/tattoo-studio-guide.ts";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("tattoo studio guide loader exposes Hannover and Berlin with their structured studios", () => {
  const cities = getTattooStudioCities("de");
  assert.deepEqual(cities.map((city) => city.slug), ["berlin", "hannover"]);

  const city = getTattooStudioCityGuide("de", "hannover");
  assert.ok(city);
  assert.equal(city.studios.length, 10);
  assert.equal(city.imageAttribution.license, "CC BY-SA 3.0");
  assert.doesNotMatch(city.editorialHtml, /Datenstand, Auswahl und Hinweise/);
  assert.match(city.selectionMethodHtml, /Datenstand, Auswahl und Hinweise/);

  const studio = getTattooStudio("de", "tats-studio-hannover");
  assert.ok(studio);
  assert.equal(studio.citySlug, "hannover");
  assert.ok(studio.styles.some((style) => style.slug === "fineline"));
  assert.equal(studio.lastVerified, "2026-06-07");

  const berlin = getTattooStudioCityGuide("de", "berlin");
  assert.ok(berlin);
  assert.equal(berlin.studios.length, 7);
  assert.equal(berlin.region, "Berlin");
  const withoutWebsite = berlin.studios.find((item) => item.name === "Bläckfisk Tattoo Co.");
  assert.ok(withoutWebsite);
  assert.equal(withoutWebsite.websiteUrl, "");
  assert.equal(withoutWebsite.sourceUrl, "https://dich-mit-stich.de/tattoo-studios/berlin/");
});

test("tattoo studio guide normalization sanitizes editorial CMS HTML", () => {
  const normalized = normalizeTattooStudioManifest({
    schemaVersion: 1,
    guide: {
      identity: "DE:teststadt",
      country: "DE",
      market: "de",
      citySlug: "teststadt",
      cityName: "Teststadt",
      title: "Studios in Teststadt",
      sourceUrl: "https://example.com/source",
      contentHtml: '<h2>Szene</h2><script>alert(1)</script><p onclick="bad()">Sicher</p><a href="javascript:bad()">Nein</a>',
      selectionMethodHtml: "<p>Transparent.</p>",
      lastVerified: "2026-01-01",
      acf: {},
    },
    studios: [],
  });

  assert.match(normalized.guide.editorialHtml, /<h2>Szene<\/h2>/);
  assert.match(normalized.guide.editorialHtml, /<p>Sicher<\/p>/);
  assert.doesNotMatch(normalized.guide.editorialHtml, /script|onclick|javascript:/i);
});

test("guide overview, city and studio routes expose SEO and structured data contracts", async () => {
  const [overview, city, studio] = await Promise.all([
    source("app/tattoo-studios/page.tsx"),
    source("app/tattoo-studios/[city]/page.tsx"),
    source("app/tattoo-studio/[slug]/page.tsx"),
  ]);

  assert.match(overview, /publicUrl\("de", "\/tattoo-studios"\)/);
  assert.match(overview, /\/tattoo-studios\/\$\{city\.slug\}/);
  assert.match(overview, /Tattoo-Studio-Guide für Deutschland/);
  assert.match(overview, /city\.region/);
  assert.doesNotMatch(overview, /Niedersachsen ·/);

  assert.match(city, /getTattooStudioCityGuide/);
  assert.match(city, /\{guide\.region\} · Studio Guide/);
  assert.match(city, /alt=\{`\$\{guide\.cityName\} als Standort des Tattoo-Studio-Guides`\}/);
  assert.doesNotMatch(city, /Niedersachsen · Studio Guide|Hannover als Standort/);
  assert.match(city, /"@type": "ItemList"/);
  assert.match(city, /\/tattoo-studio\/\$\{studio\.slug\}/);
  assert.match(city, /Zuletzt redaktionell geprüft/);
  assert.match(city, /Keine bezahlte Platzierung/);

  assert.match(studio, /getTattooStudio/);
  assert.match(studio, /"@type": "TattooParlor"/);
  assert.match(studio, /publicUrl\("de", `\/tattoo-studio\/\$\{slug\}`\)/);
  assert.match(studio, /rel="noopener noreferrer nofollow"/);
  assert.match(studio, /studio\.websiteUrl\s*\?/);
  assert.match(studio, /Keine verifizierte Website/);
  assert.match(studio, /Datenänderung melden/);
});

test("site navigation links to the new studio guide rather than the singles city list", async () => {
  const shell = await source("components/site-shell.tsx");
  assert.match(shell, /Lieblings-Studios", href: "\/tattoo-studios"/);
  assert.match(shell, /Tattoo-Studio-Guide/);
  assert.match(shell, /Tattoo-Studios Berlin/);
});
