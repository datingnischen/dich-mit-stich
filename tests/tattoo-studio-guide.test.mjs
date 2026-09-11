import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getTattooStudio,
  getTattooStudioCities,
  getTattooStudioCityGuide,
  normalizeTattooStudioManifest,
} from "../lib/tattoo-studio-guide.ts";
import { getTattooCityDirectory } from "../lib/tattoo-singles.ts";

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
  assert.equal(city.imageUrl, "/studio-guides/hannover.jpg");
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

test("Hannover and Zürich guides keep concise, neutral and internally linked source data", async () => {
  for (const city of ["hannover", "zuerich"]) {
    const manifest = JSON.parse(await source(`data/tattoo-studio-guide-${city}.json`));
    const editorialText = manifest.guide.editorialHtml.replace(/<[^>]+>/g, " ").trim();
    const cityPath = city === "zuerich" ? "zuerich" : city;

    assert.ok(editorialText.split(/\s+/).length <= 260);
    assert.match(manifest.guide.editorialHtml, /href="\/magazin\/tattoo-studio"/);
    assert.match(manifest.guide.editorialHtml, new RegExp(`href="/tattoo-singles/${cityPath}"`));
    assert.equal(manifest.guide.contentHtml, manifest.guide.editorialHtml);
    assert.equal(manifest.guide.acf.selection_method, manifest.guide.selectionMethodHtml);

    const guideStudios = new Map(manifest.guide.studios.map((studio) => [studio.identity, studio]));
    for (const studio of manifest.studios) {
      assert.ok(studio.description.split(/\s+/).length <= 35, `${studio.name} description is too long`);
      assert.doesNotMatch(studio.description, /besonders (?:interessant|relevant)|gut erreichbar|eignet sich|eine Option für|praktischer Anhaltspunkt|sichtbar kreativen|etabliertes Umfeld/i);
      assert.equal(studio.acf.editorial_summary, studio.description);
      assert.equal(studio.contentHtml.replace(/&amp;/g, "&"), `<p>${studio.description}</p>`);
      assert.equal(guideStudios.get(studio.identity)?.description, studio.description);
    }
  }
});

test("Zürich cards expose only claims supported by their linked official source", async () => {
  const manifest = JSON.parse(await source("data/tattoo-studio-guide-zuerich.json"));
  const studios = new Map(manifest.studios.map((studio) => [studio.name, studio]));

  assert.equal(studios.get("Absolut Art Tattoo Studio Zürich").sourceUrl, "https://www.absolut-tattoo.ch/");
  assert.ok(!studios.get("Absolut Art Tattoo Studio Zürich").acf.tattoo_styles.includes("watercolor"));
  assert.equal(studios.get("Bad Habits Ink").sourceUrl, "https://realistictattoo.ch/");
  assert.equal(studios.get("Born1891 Tattoo Studio Zürich").sourceUrl, "https://born1891.com/");
  assert.ok(!studios.get("Born1891 Tattoo Studio Zürich").acf.tattoo_styles.includes("blackwork"));
  assert.ok(!studios.get("Born1891 Tattoo Studio Zürich").acf.tattoo_styles.includes("microrealism"));

  for (const name of ["Giahi Tattoo Zurich", "Noble Art Zürich"]) {
    assert.deepEqual(studios.get(name).acf.tattoo_styles, []);
    assert.doesNotMatch(studios.get(name).description, /Realism|Fineline|Fine Line|Geometric|floral|Concept/i);
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

test("studio overview lists every existing German tattoo city with compact images", async () => {
  const cities = getTattooCityDirectory();
  const overview = await source("app/tattoo-studios/page.tsx");
  const css = await source("app/globals.css");

  assert.equal(cities.length, 16);
  assert.equal(new Set(cities.map((city) => city.slug)).size, 16);
  assert.ok(cities.every((city) => city.imageUrl === `/cities/${city.slug}.jpg`));
  assert.match(overview, /getTattooCityDirectory/);
  assert.match(overview, /Redaktionelle Studio-Guides nach Stadt/);
  assert.doesNotMatch(overview, /nicht mit einer endlosen Linkliste/);
  assert.match(overview, /Alle Tattoo-Städte/);
  assert.match(overview, /href=\{`\/tattoo-singles\/\$\{city\.slug\}`\}/);
  assert.match(overview, /<LocationPinIcon/);
  assert.match(overview, /className="studio-all-city-grid"/);
  assert.match(css, /\.studio-city-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(css, /\.studio-city-card\s*\{[^}]*grid-template-columns:\s*180px/s);
  assert.match(css, /\.studio-city-card img\s*\{[^}]*min-height:\s*0/s);
  assert.match(css, /\.studio-all-city-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.studio-all-city-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/s);
});

test("guide overview, city and studio routes expose SEO and structured data contracts", async () => {
  const [overview, cityRoute, city, studioRoute, studio] = await Promise.all([
    source("app/tattoo-studios/page.tsx"),
    source("app/tattoo-studios/[city]/page.tsx"),
    source("components/tattoo-studio-city-guide.tsx"),
    source("app/tattoo-studio/[slug]/page.tsx"),
    source("components/tattoo-studio-detail.tsx"),
  ]);

  assert.match(overview, /publicUrl\("de", "\/tattoo-studios"\)/);
  assert.match(overview, /\/tattoo-studios\/\$\{city\.slug\}/);
  assert.match(overview, /Tattoo-Studio-Guide für Deutschland/);
  assert.match(overview, /<MarketLink[^>]+targetMarket="ch"[^>]+pathname="\/tattoo-studios"[^>]*>Tattoo-Studios Schweiz<\/MarketLink>/);
  assert.match(overview, /Vorschau verfügbar/);
  assert.match(overview, /city\.region/);
  assert.doesNotMatch(overview, /Niedersachsen ·/);

  assert.match(cityRoute, /getTattooStudioCityGuide/);
  assert.match(city, /\{guide\.region\} · \{isSwiss \? "Schweizer " : ""\}Studio Guide/);
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
  assert.match(city, /const studios = \[\.\.\.guide\.studios\]\.sort/);
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
  assert.match(city, /\? "Webseite" : "Datenquelle"/);
  assert.match(city, /rel="noopener noreferrer nofollow"/);

  assert.match(studioRoute, /getTattooStudio/);
  assert.match(studio, /"@type": "TattooParlor"/);
  assert.match(studio, /"@type": "BreadcrumbList"/);
  assert.match(studio, /hasCompleteStreetAddress\(studio\.address\)/);
  assert.match(studio, /\.\.\.\(hasCompleteStreetAddress\(studio\.address\) \? \{ streetAddress: studio\.address \} : \{\}\)/);
  assert.match(studio, /<ol>/);
  assert.match(studioRoute, /publicUrl\("de", `\/tattoo-studio\/\$\{slug\}`\)/);
  assert.match(studio, /rel="noopener noreferrer nofollow"/);
  assert.match(studio, /studio\.websiteUrl\s*\?/);
  assert.match(city, /const sourceIsGuide = normalizeUrl\(studio\.sourceUrl\) === normalizeUrl\(guide\.sourceUrl\)/);
  assert.match(city, /Keine offizielle Studioseite verifiziert/);
  assert.match(studio, /const sourceIsGuide = normalizeUrl\(studio\.sourceUrl\) === normalizeUrl\(city\.sourceUrl\)/);
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
  assert.match(chCityLayout, /<SiteFrame market="ch" sectionLive aid="location" stickyCta>/);
  assert.match(chStudioLayout, /<SiteFrame market="ch" sectionLive aid="location" stickyCta>/);
  assert.match(frame, /config\.contentEnabled \|\| \(sectionLive && stickyCta\)/);
  assert.match(frame, /<SiteHeader market=\{market\} sectionLive=\{sectionLive\} aid=\{aid\}/);
  assert.match(frame, /<SiteFooter market=\{market\} sectionLive=\{sectionLive\} stickyCta=\{sectionLive && stickyCta\} aid=\{aid\}/);
  assert.match(shell, /stickyCta \? " footer-surface-sticky" : ""/);
  assert.match(frame, /<StickyCTAButton market=\{market\} aid=\{aid\}/);
  assert.match(shell, /url\.searchParams\.set\("AID", aid\)/);
  assert.match(sticky, /aid === 'location'/);
});

test("DE and CH city routes use the same complete studio-guide architecture", async () => {
  const [deRoute, chRoute, shared] = await Promise.all([
    source("app/tattoo-studios/[city]/page.tsx"),
    source("app/market-tattoo-studios/[market]/[city]/page.tsx"),
    source("components/tattoo-studio-city-guide.tsx"),
  ]);

  assert.match(deRoute, /<TattooStudioCityGuide guide=\{guide\} market="de"/);
  assert.match(chRoute, /<TattooStudioCityGuide guide=\{guide\} market="ch"/);
  for (const marker of ["CollectionPage", "BreadcrumbList", "ItemList", "FAQPage", 'id="studio-auswahl"', 'id="auswahl-check"', 'id="haeufige-fragen"', "studio-place-card"]) {
    assert.match(shared, new RegExp(marker));
  }
  assert.match(shared, /const studios = \[\.\.\.guide\.studios\]\.sort/);
  assert.match(shared, /sourceIsPage/);
  assert.match(shared, /Einzelquellen findest du direkt bei den Studios/);
});

test("DE and CH detail routes use the same honest studio-profile architecture", async () => {
  const [deRoute, chRoute, shared] = await Promise.all([
    source("app/tattoo-studio/[slug]/page.tsx"),
    source("app/market-tattoo-studio/[market]/[slug]/page.tsx"),
    source("components/tattoo-studio-detail.tsx"),
  ]);

  assert.match(deRoute, /<TattooStudioDetail studio=\{studio\} city=\{city\} market="de"/);
  assert.match(chRoute, /<TattooStudioDetail studio=\{studio\} city=\{city\} market="ch"/);
  assert.match(shared, /"@type": "TattooParlor"/);
  assert.match(shared, /"@type": "BreadcrumbList"/);
  assert.match(shared, /hasCompleteStreetAddress\(studio\.address\)/);
  assert.match(shared, /className="studio-detail-place"/);
  assert.match(shared, /<LocationPinIcon/);
  assert.match(shared, /Keine verifizierte Website/);
});

test("studio locations and city text links use a consistent place treatment", async () => {
  const [city, detail, shell, icon, css] = await Promise.all([
    source("components/tattoo-studio-city-guide.tsx"),
    source("components/tattoo-studio-detail.tsx"),
    source("components/site-shell.tsx"),
    source("components/location-pin-icon.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(icon, /viewBox="0 0 24 24"/);
  assert.match(icon, /aria-hidden="true"/);
  assert.match(city, /<LocationPinIcon/);
  assert.match(city, /className="studio-place-card"/);
  assert.match(city, /Standort in \{guide\.cityName\}/);
  assert.match(detail, /className="studio-detail-place"/);
  assert.match(shell, /function isCityLink/);
  assert.match(shell, /<LocationPinIcon className="footer-city-link-icon"/);
  assert.match(css, /\.studio-place-card\s*\{/);
  assert.match(css, /\.studio-place-icon\s*\{/);
  assert.match(css, /\.footer-city-link\s*\{/);
  assert.match(css, /\.studio-editorial-card a\[href\*="\/tattoo-singles\/"\]::before/);
});

test("studio card profile and website links render as accessible buttons", async () => {
  const [city, css] = await Promise.all([
    source("components/tattoo-studio-city-guide.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(city, /className="studio-card-actions"/);
  assert.match(city, /className="studio-card-source studio-card-action studio-card-action-secondary"/);
  assert.match(city, /className="studio-card-link studio-card-action studio-card-action-primary"/);
  assert.match(city, /rel="noopener noreferrer nofollow"/);
  assert.match(css, /\.studio-card-actions\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /\.studio-card-action\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.studio-card-action:focus-visible\s*\{[^}]*outline:\s*3px solid #7b0f45/s);
  assert.match(css, /\.studio-card-action-primary\s*\{[^}]*background:\s*var\(--brand\)/s);
  assert.match(css, /\.studio-card-action-secondary\s*\{[^}]*border:\s*1px solid/s);
});

test("city guide keeps comparison, FAQ and studio cards compact and responsive", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /\.studio-choice-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /\.studio-faq-list\s*\{/);
  assert.match(css, /\.studio-hero-actions\s*\{/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.studio-choice-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.tattoo-studio-card-mark\s*\{[^}]*min-height:\s*88px/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.studio-city-hero-media\s*\{[^}]*min-height:\s*220px/s);
  assert.match(css, /@media \(max-width: 900px\)\s*\{(?:(?!@media)[\s\S])*\.footer-surface-compact\.footer-surface-sticky\s*\{[^}]*padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.doesNotMatch(css, /\.footer-surface-compact\s*\{[^}]*padding-bottom:\s*calc\(88px/);
});

test("site navigation links to the new studio guide rather than the singles city list", async () => {
  const shell = await source("components/site-shell.tsx");
  assert.match(shell, /Lieblings-Studios", href: "\/tattoo-studios"/);
  assert.match(shell, /Tattoo-Studio-Guide/);
  assert.match(shell, /Tattoo-Studios Berlin/);
});
