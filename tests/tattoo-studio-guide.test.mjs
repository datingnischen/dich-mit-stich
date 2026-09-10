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
  assert.equal(city.imageUrl, "/cities/hannover.jpg");
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
  assert.equal(berlin.imageUrl, "/studio-guides/berlin.jpg");
  assert.equal(berlin.region, "Berlin");
  const withoutWebsite = berlin.studios.find((item) => item.name === "Bläckfisk Tattoo Co.");
  assert.ok(withoutWebsite);
  assert.equal(withoutWebsite.websiteUrl, "");
  assert.equal(withoutWebsite.sourceUrl, "https://dich-mit-stich.de/tattoo-studios/berlin/");
  assert.doesNotMatch(
    berlin.editorialHtml,
    /150 bis 200|Hunderttausend|grobe Annahme|sehr gute Adressen|stark gefragt|besonders bekannt|sehr beliebt/i,
  );
  assert.doesNotMatch(
    berlin.studios.map((studio) => studio.description).join(" "),
    /spontane Termine|eines der größeren|bekannt für Walk-in|internationales Team|Walk-ins und viele/i,
  );
  assert.match(berlin.editorialHtml, /Portfolio/);
  assert.match(berlin.editorialHtml, /Hygiene/);
  assert.match(berlin.editorialHtml, /href="\/magazin\/tattoo-studio"/);
  assert.match(berlin.editorialHtml, /href="\/tattoo-singles\/berlin"/);
});

test("Berlin manifest keeps publish payload copy aligned with the verified studio descriptions", async () => {
  const manifest = JSON.parse(await source("data/tattoo-studio-guide-berlin.json"));
  const banned = /spontane Termine|eines der größeren|bekannt für Walk-in|internationales Team|Walk-ins und viele/i;

  for (const studio of manifest.studios) {
    assert.equal(studio.contentHtml, `<p>${studio.description}</p>`);
    assert.equal(studio.acf.editorial_summary, studio.description);
    assert.doesNotMatch(JSON.stringify(studio), banned);
  }
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
  assert.match(overview, /<MarketLink[^>]+targetMarket="ch"[^>]+pathname="\/tattoo-studios"[^>]*>Tattoo-Studios Schweiz<\/MarketLink>/);
  assert.match(overview, /Vorschau verfügbar/);
  assert.match(overview, /city\.region/);
  assert.doesNotMatch(overview, /Niedersachsen ·/);

  assert.match(city, /getTattooStudioCityGuide/);
  assert.match(city, /\{guide\.region\} · Studio Guide/);
  assert.match(city, /alt=\{`\$\{guide\.cityName\} als Standort des Tattoo-Studio-Guides`\}/);
  assert.doesNotMatch(city, /Niedersachsen · Studio Guide|Hannover als Standort/);
  assert.match(city, /"@type": "ItemList"/);
  assert.match(city, /"@type": "BreadcrumbList"/);
  assert.match(city, /<ol>/);
  assert.match(city, /aria-current="page"/);
  assert.match(city, /"@type": "FAQPage"/);
  assert.match(city, /"@type": "CollectionPage"/);
  assert.match(city, /id="studio-auswahl"/);
  assert.match(city, /id="auswahl-check"/);
  assert.match(city, /id="haeufige-fragen"/);
  assert.ok(city.indexOf('id="studio-auswahl"') < city.indexOf('id="auswahl-check"'));
  assert.match(city, /const studios = \[\.\.\.guide\.studios\]\.sort\(\(left, right\) => left\.name\.localeCompare\(right\.name, "de"\)\)/);
  assert.match(city, /itemListElement: studios\.map/);
  assert.match(city, /ItemListOrderAscending/);
  assert.match(city, /\{studios\.map\(\(studio\) =>/);
  assert.match(city, /Studios vergleichen/);
  assert.match(city, /Das solltest du vor der Anfrage prüfen/);
  assert.match(city, /Häufige Fragen zu Tattoo-Studios/);
  assert.match(city, /<time dateTime=\{guide\.lastVerified\}>/);
  assert.doesNotMatch(city, /String\(index \+ 1\)\.padStart/);
  assert.match(city, /\/tattoo-studio\/\$\{studio\.slug\}/);
  assert.match(city, /Zuletzt redaktionell geprüft/);
  assert.match(city, /Keine bezahlte Platzierung/);
  assert.match(city, /href=\{studio\.sourceUrl\}/);
  assert.match(city, /Datenquelle ansehen/);
  assert.match(city, /rel="noopener noreferrer nofollow"/);

  assert.match(studio, /getTattooStudio/);
  assert.match(studio, /"@type": "TattooParlor"/);
  assert.match(studio, /"@type": "BreadcrumbList"/);
  assert.match(studio, /hasCompleteStreetAddress\(studio\.address\)/);
  assert.match(studio, /\.\.\.\(hasCompleteStreetAddress\(studio\.address\) \? \{ streetAddress: studio\.address \} : \{\}\)/);
  assert.match(studio, /<ol>/);
  assert.match(studio, /publicUrl\("de", `\/tattoo-studio\/\$\{slug\}`\)/);
  assert.match(studio, /rel="noopener noreferrer nofollow"/);
  assert.match(studio, /studio\.websiteUrl\s*\?/);
  assert.match(city, /const sourceIsGuide = studio\.sourceUrl === guide\.sourceUrl/);
  assert.match(city, /Keine offizielle Studioseite verifiziert/);
  assert.match(studio, /const sourceIsGuide = studio\.sourceUrl === city\.sourceUrl/);
  assert.match(studio, /Redaktionelle Ausgangsseite öffnen/);
  assert.match(studio, /Keine verifizierte Website/);
  assert.match(studio, /Datenänderung melden/);
});

test("studio city and detail pages keep every shell conversion CTA on AID location", async () => {
  const [city, studio, chCityLayout, chStudioLayout, frame, shell, sticky] = await Promise.all([
    source("app/tattoo-studios/[city]/page.tsx"),
    source("app/tattoo-studio/[slug]/page.tsx"),
    source("app/market-tattoo-studios/[market]/layout.tsx"),
    source("app/market-tattoo-studio/[market]/layout.tsx"),
    source("components/site-frame.tsx"),
    source("components/site-shell.tsx"),
    source("components/sticky-cta-button.tsx"),
  ]);

  assert.match(city, /<SiteFrame market="de" sectionLive aid="location">/);
  assert.match(studio, /<SiteFrame market="de" sectionLive aid="location">/);
  assert.match(chCityLayout, /<SiteFrame market="ch" sectionLive aid="location">/);
  assert.match(chStudioLayout, /<SiteFrame market="ch" sectionLive aid="location">/);
  assert.match(frame, /<SiteHeader market=\{market\} sectionLive=\{sectionLive\} aid=\{aid\}/);
  assert.match(frame, /<SiteFooter market=\{market\} sectionLive=\{sectionLive\} aid=\{aid\}/);
  assert.match(frame, /<StickyCTAButton market=\{market\} aid=\{aid\}/);
  assert.match(shell, /url\.searchParams\.set\("AID", aid\)/);
  assert.match(sticky, /aid === 'location'/);
});

test("city guide keeps comparison, FAQ and studio cards compact and responsive", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /\.studio-choice-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /\.studio-faq-list\s*\{/);
  assert.match(css, /\.studio-hero-actions\s*\{/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.studio-choice-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.tattoo-studio-card-mark\s*\{[^}]*min-height:\s*88px/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.studio-city-hero-media\s*\{[^}]*min-height:\s*220px/s);
});

test("site navigation links to the new studio guide rather than the singles city list", async () => {
  const shell = await source("components/site-shell.tsx");
  assert.match(shell, /Lieblings-Studios", href: "\/tattoo-studios"/);
  assert.match(shell, /Tattoo-Studio-Guide/);
  assert.match(shell, /Tattoo-Studios Berlin/);
});
