import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  getIndexableTattooStudioCities,
  getLargestTattooStudioCities,
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

test("studio overview exposes the ten largest cities per country in population order", async () => {
  const expected = {
    de: ["berlin", "hamburg", "muenchen", "koeln", "frankfurt-am-main", "duesseldorf", "stuttgart", "leipzig", "dortmund", "essen"],
    at: ["wien", "graz", "linz", "salzburg", "innsbruck", "klagenfurt", "villach", "wels", "sankt-poelten", "dornbirn"],
    ch: ["zuerich", "genf", "basel", "lausanne", "bern", "winterthur", "luzern", "st-gallen", "lugano", "biel-bienne"],
  };

  for (const market of ["de", "at", "ch"]) {
    const cities = getLargestTattooStudioCities(market);
    assert.equal(cities.length, 10, `${market} must expose exactly ten cities`);
    assert.deepEqual(cities.map((city) => city.slug), expected[market]);
    assert.equal(new Set(cities.map((city) => city.slug)).size, 10);
    assert.deepEqual(cities.map((city) => city.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.ok(cities.every((city) => city.label && city.imageUrl && city.href));
    assert.ok(cities.every((city) => city.imageAttribution.title && city.imageAttribution.creator && city.imageAttribution.license));
    assert.ok(cities.every((city) => city.imageAttribution.sourceUrl.startsWith("https://")));
    assert.ok(cities.every((city) => city.href.startsWith(city.hasCityGuide ? "/tattoo-studios/" : "/tattoo-singles/")));
    await Promise.all(cities.map((city) => access(new URL(`public${city.imageUrl}`, root))));
  }

  assert.equal(getLargestTattooStudioCities("de").find((city) => city.slug === "berlin")?.hasVerifiedStudios, true);
  assert.equal(getLargestTattooStudioCities("at").find((city) => city.slug === "innsbruck")?.hasVerifiedStudios, true);
  assert.equal(getLargestTattooStudioCities("ch").find((city) => city.slug === "zuerich")?.hasVerifiedStudios, true);
});

test("Austrian and Swiss studio overviews use matching country artwork", async () => {
  const marketOverview = await source("app/market-tattoo-studios/[market]/page.tsx");
  const expectedAssets = [
    "public/tattoo-studios/tattoo-studio-verzeichnis-oesterreich.png",
    "public/tattoo-studios/tattoo-studios-nach-stadt-oesterreich.png",
    "public/tattoo-studios/tattoo-studio-verzeichnis-schweiz.png",
    "public/tattoo-studios/tattoo-studios-nach-stadt-schweiz.png",
  ];

  assert.match(marketOverview, /directoryBanner/);
  assert.match(marketOverview, /cityFinderArtwork/);
  assert.match(marketOverview, /className="studio-directory-banner"/);
  assert.match(marketOverview, /className="content-section studio-city-finder-feature"/);
  assert.match(marketOverview, /src=\{copy\.directoryBanner\.src\}/);
  assert.match(marketOverview, /src=\{copy\.cityFinderArtwork\.src\}/);
  assert.match(marketOverview, /src=\{staticAsset\(city\.imageUrl\)\}[\s\S]*\bunoptimized\b/);
  assert.match(marketOverview, /href="#stadtguides"/);
  assert.match(marketOverview, /loading="eager"/);
  assert.match(marketOverview, /\bunoptimized\b/);
  await Promise.all(expectedAssets.map((path) => access(new URL(path, root))));
});

test("all studio overviews visibly list the ten largest cities with honest destination labels", async () => {
  const [deOverview, marketOverview, shared] = await Promise.all([
    source("app/tattoo-studios/page.tsx"),
    source("app/market-tattoo-studios/[market]/page.tsx"),
    source("components/tattoo-studio-largest-cities.tsx"),
  ]);

  assert.doesNotMatch(deOverview, /studio-guide-stats/);
  assert.doesNotMatch(marketOverview, /studio-guide-stats|strukturierte Studios|redaktionelle Stadtguides|gekaufte Rangplätze/);
  assert.match(deOverview, /<TattooStudioLargestCities market="de"/);
  assert.match(marketOverview, /<TattooStudioLargestCities market=\{market\}/);
  assert.match(shared, /getLargestTattooStudioCities/);
  assert.match(shared, /Die 10 größten Städte/);
  assert.match(shared, /city\.hasVerifiedStudios \? "Tattoo-Studios entdecken"/);
  assert.match(shared, /targetMarket=\{market\}/);
  assert.match(shared, /pathname=\{city\.href\}/);
  assert.match(shared, /rel="noopener noreferrer nofollow"/);
  assert.match(shared, /Bevölkerungsstand/);
});

test("German overview exposes ten real studio city pages and preserves useful cities outside the top ten", async () => {
  const topSlugs = new Set(getLargestTattooStudioCities("de").map((city) => city.slug));
  const guideSlugs = new Set(getTattooStudioCities("de").map((city) => city.slug));
  const additional = getTattooCityDirectory().filter((city) => !topSlugs.has(city.slug) && !guideSlugs.has(city.slug));
  const overview = await source("app/tattoo-studios/page.tsx");

  const topCities = getLargestTattooStudioCities("de");
  assert.ok(topCities.every((city) => city.hasCityGuide));
  assert.ok(topCities.every((city) => city.href === `/tattoo-studios/${city.slug}`));
  assert.ok(topCities.every((city) => getTattooStudioCityGuide("de", city.slug)));
  assert.deepEqual(additional.map((city) => city.slug), ["mannheim"]);
  assert.match(overview, /Weitere Tattoo-Städte/);
  assert.match(overview, /additionalTattooCities\.map/);
  assert.match(overview, /city\.imageAttribution\.sourceUrl/);
  assert.match(overview, /rel="noopener noreferrer nofollow"/);
});

test("German legacy city pages expose sourced editorial copy and are published with verified studio profiles", async () => {
  const legacySlugs = ["berlin", "bochum", "bonn", "bremen", "dortmund", "dresden", "duisburg", "duesseldorf", "essen", "frankfurt-am-main", "hamburg", "hannover", "karlsruhe", "koeln", "leipzig", "muenchen", "muenster", "nuernberg", "stuttgart", "wuppertal"];
  const [cityRoute, cityRenderer, generatedCatalog] = await Promise.all([
    source("app/tattoo-studios/[city]/page.tsx"),
    source("components/tattoo-studio-city-guide.tsx"),
    source("data/tattoo-studio-guides-de.json"),
  ]);

  for (const slug of legacySlugs) {
    const guide = getTattooStudioCityGuide("de", slug);
    assert.ok(guide, `${slug} must resolve as a studio city page`);
    assert.equal(guide.sourceUrl, `https://dich-mit-stich.de/tattoo-studios/${slug}/`);
    assert.ok(guide.editorialHtml.length > 500, `${slug} must preserve substantial editorial copy`);
    assert.equal(guide.publicationStatus, "verified");
    assert.ok(guide.studios.length > 0, `${slug} must publish studio profiles`);
  }

  assert.doesNotMatch(generatedCatalog, /entry-footer|entry-content|post-content|kategorie\/tattoo-studios|<!--\s*\.(?:entry|post)-content|<\/div>/i);
  assert.match(cityRoute, /guide\.publicationStatus === "verified"/);
  assert.match(cityRenderer, /Noch keine Studio-Profile/);
  assert.match(cityRenderer, /studios\.length \? \(/);
  assert.doesNotMatch(cityRenderer, /<p>\{studios\.length\} redaktionell erfasste Studios/);
});

test("missing publication status fails closed without publishing profiles", () => {
  const normalized = normalizeTattooStudioManifest({
    schemaVersion: 1,
    guide: {
      identity: "DE:teststadt",
      market: "de",
      country: "DE",
      citySlug: "teststadt",
      cityName: "Teststadt",
      title: "Tattoo-Studios in Teststadt",
      sourceUrl: "https://example.com/teststadt/",
      contentHtml: "<p>Redaktioneller Testinhalt.</p>",
      selectionMethodHtml: "<p>Quellenprüfung.</p>",
      lastVerified: "2026-09-21",
      acf: { guide_region: "Testregion" },
    },
    studios: [{
      identity: "DE:teststadt:teststudio",
      market: "de",
      country: "DE",
      citySlug: "teststadt",
      cityName: "Teststadt",
      slug: "teststudio",
      name: "Teststudio",
      description: "Nur ein Testdatensatz.",
      websiteUrl: "https://example.com/",
      address: "Teststraße 1, 12345 Teststadt",
      contact: "",
      sourceUrl: "https://example.com/",
      acf: {},
    }],
  }).guide;

  assert.equal(normalized.publicationStatus, "rollout");
  assert.deepEqual(normalized.studios, []);
});

test("all published German studio city pages are indexable", async () => {
  const sitemap = await source("app/sitemap.ts");
  const expectedIndexable = ["berlin", "bochum", "bonn", "bremen", "dortmund", "dresden", "duisburg", "duesseldorf", "essen", "frankfurt-am-main", "hamburg", "hannover", "karlsruhe", "koeln", "leipzig", "muenchen", "muenster", "nuernberg", "stuttgart", "wuppertal"].sort((left, right) => left.localeCompare(right, "de"));
  assert.deepEqual(getIndexableTattooStudioCities("de").map((city) => city.slug).sort((left, right) => left.localeCompare(right, "de")), expectedIndexable);
  assert.match(sitemap, /getIndexableTattooStudioCities/);
  assert.doesNotMatch(sitemap, /getTattooStudioCities/);
});

test("tattoo studio guide loader exposes all sourced German city pages", async () => {
  const cities = getTattooStudioCities("de");
  assert.deepEqual(cities.map((city) => city.slug), ["berlin", "bochum", "bonn", "bremen", "dortmund", "dresden", "duisburg", "duesseldorf", "essen", "frankfurt-am-main", "hamburg", "hannover", "karlsruhe", "koeln", "leipzig", "muenchen", "muenster", "nuernberg", "stuttgart", "wuppertal"]);
  assert.ok(cities.every((city) => city.publicationStatus === "verified" && city.studios.length > 0));
  assert.ok(cities.every((city) => city.region));
  assert.ok(cities.every((city) => city.imageUrl && city.imageAttribution.title && city.imageAttribution.creator && city.imageAttribution.license));
  assert.ok(cities.every((city) => city.imageAttribution.sourceUrl.startsWith("https://")));
  assert.ok(cities.every((city) => city.legacyImageUrl === `/tattoo-studios/cities/${city.slug}.webp`));
  assert.ok(cities.every((city) => city.legacyImageSourceUrl?.startsWith("https://dich-mit-stich.de/tattoo-studios/wp-content/uploads/2026/05/")));
  assert.ok(cities.every((city) => city.legacyImageAlt === `Tattoo-Illustration zum Stadtguide für ${city.cityName}`));
  for (const city of cities) {
    await access(new URL(`public${city.imageUrl}`, root));
    const legacyHtml = await source(`data/legacy/tattoo-studios-de/${city.slug}.html`);
    const legacyImageUrl = legacyHtml.match(/<img\b[^>]*src=["'](https:\/\/dich-mit-stich\.de\/tattoo-studios\/wp-content\/uploads\/[^"']+)["']/i)?.[1];
    assert.equal(city.legacyImageSourceUrl, legacyImageUrl, `${city.slug} must preserve its exact legacy image source`);
    await access(new URL(`public${city.legacyImageUrl}`, root));
  }

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

  const inkJunkies = getTattooStudio("de", "ink-junkies-tattoo-hannover");
  assert.ok(inkJunkies);
  assert.deepEqual(inkJunkies.styles, []);
  assert.doesNotMatch(inkJunkies.description, /Mandala/i);

  const berlin = getTattooStudioCityGuide("de", "berlin");
  assert.ok(berlin);
  assert.equal(berlin.studios.length, 4);
  assert.equal(berlin.imageUrl, "/studio-guides/berlin.jpg");
  assert.equal(berlin.region, "Berlin");
  assert.ok(berlin.studios.every((studio) => studio.sourceUrl.startsWith("https://")));
  assert.ok(berlin.studios.every((studio) => !new URL(studio.sourceUrl).hostname.endsWith("dich-mit-stich.de")));
  assert.ok(berlin.studios.every((studio) => studio.websiteUrl));
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

test("largest-city sections keep compact responsive images across all markets", async () => {
  const cities = getLargestTattooStudioCities("de");
  const shared = await source("components/tattoo-studio-largest-cities.tsx");
  const css = await source("app/globals.css");

  assert.equal(cities.length, 10);
  assert.ok(cities.every((city) => city.imageUrl.endsWith(`/${city.slug}.jpg`)));
  assert.ok(cities.every((city) => city.imageAttribution.title && city.imageAttribution.creator && city.imageAttribution.license));
  assert.ok(cities.every((city) => city.imageAttribution.sourceUrl.startsWith("https://")));
  await Promise.all(cities.map((city) => access(new URL(`public${city.imageUrl}`, root))));
  assert.match(shared, /className="studio-all-city-grid"/);
  assert.match(shared, /className="studio-all-city-media"/);
  assert.match(shared, /sizes="\(max-width: 640px\) 112px, 150px"[\s\S]*\n\s+unoptimized\s*\n/);
  assert.doesNotMatch(shared, /unoptimized=\{market === "de"\}/);
  assert.match(shared, /<LocationPinIcon/);
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
  assert.match(overview, /<MarketLink[^>]+targetMarket="at"[^>]+pathname="\/tattoo-studios"[^>]*>Tattoo-Studios Österreich<\/MarketLink>/);
  assert.match(overview, /<MarketLink[^>]+className="studio-guide-country-link"[^>]+targetMarket="de"[^>]+pathname="\/tattoo-studios"/);
  assert.match(overview, /<MarketLink[^>]+className="studio-guide-country-link"[^>]+targetMarket="at"[^>]+pathname="\/tattoo-studios"/);
  assert.match(overview, /<MarketLink[^>]+className="studio-guide-country-link"[^>]+targetMarket="ch"[^>]+pathname="\/tattoo-studios"/);
  assert.match(overview, /<strong>Deutschland<\/strong><span>20 Stadtguides<\/span>/);
  assert.match(overview, /<strong>Österreich<\/strong><span>5 Stadtguides<\/span>/);
  assert.match(overview, /<strong>Schweiz<\/strong><span>Zürich-Guide<\/span>/);
  assert.doesNotMatch(overview, /studio-guide-stats|strukturierte Studios|deutsche Studio-Stadtseiten|gekaufte Rangplätze|Jetzt verfügbar|Fünf Stadtguides verfügbar|Zürich-Guide verfügbar|Vorschau verfügbar|Vier Stadtguides verfügbar|Nächste Ausbaustufe/);
  assert.match(overview, /city\.region/);
  assert.doesNotMatch(overview, /Niedersachsen ·/);

  assert.match(cityRoute, /getTattooStudioCityGuide/);
  assert.match(city, /\{guide\.region\} · \{marketGuideLabel\}Studio Guide/);
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
  assert.match(city, /Stand des Stadtguides/);
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
  assert.match(city, /Keine eigene Studio-Webseite verfügbar/);
  assert.doesNotMatch(city, /guide\.selectionMethodHtml|dangerouslySetInnerHTML=\{\{ __html: guide\.selectionMethodHtml \}\}/);
  assert.match(city, /So findest du das passende Studio/);
  assert.match(studio, /const sourceIsGuide = normalizeUrl\(studio\.sourceUrl\) === normalizeUrl\(city\.sourceUrl\)/);
  assert.match(studio, /Zum Stadtguide/);
  assert.match(studio, /Keine Website verfügbar/);
  assert.doesNotMatch(`${city}\n${studio}`, /übernommen|in Prüfung|Prüfstatus|Prüfdatum|redaktionellen Check|[Vv]erifizierte(?:n|r)? (?:Website|Kontaktdaten|Studio-Profile)|Redaktionelle Ausgangsseite|Datenstatus/);
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
  assert.match(chCityLayout, /<SiteFrame market=\{market\} sectionLive aid="location" stickyCta>/);
  assert.match(chStudioLayout, /<SiteFrame market=\{market\} sectionLive aid="location" stickyCta>/);
  assert.match(frame, /config\.contentEnabled \|\| \(sectionLive && stickyCta\)/);
  assert.match(frame, /<SiteHeader market=\{market\} sectionLive=\{sectionLive\} aid=\{aid\}/);
  assert.match(frame, /<SiteFooter market=\{market\} sectionLive=\{sectionLive\} stickyCta=\{showStickyCta\} aid=\{aid\}/);
  assert.match(shell, /stickyCta \? " footer-surface-sticky" : ""/);
  assert.match(frame, /<StickyCTAButton market=\{market\} aid=\{aid\}/);
  assert.match(shell, /return conversionUrl\(publicUrl\(market\), pathname, aid\)/);
  assert.match(sticky, /aid === 'location'/);
});

test("sticky conversion bar stays visible on desktop without covering the footer", async () => {
  const [frame, shell, css] = await Promise.all([
    source("components/site-frame.tsx"),
    source("components/site-shell.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(frame, /const showStickyCta = config\.contentEnabled \|\| \(sectionLive && stickyCta\)/);
  assert.match(frame, /stickyCta=\{showStickyCta\}/);
  assert.match(shell, /className=\{`footer-surface\$\{stickyCta \? " footer-surface-sticky" : ""\}`\}/);
  assert.match(css, /\.sticky-cta-button\s*\{[^}]*display:\s*flex/s);
  assert.doesNotMatch(css, /\.sticky-cta-button\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.site-footer-shell:has\(\+ \.sticky-cta-button\) \.footer-surface\.footer-surface-sticky\s*\{[^}]*padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom, 0px\)\)/s);
  assert.doesNotMatch(css, /(?<!\)) \.footer-surface\.footer-surface-sticky\s*\{/);
});

test("every Tattoo-Singles registration surface uses location attribution", async () => {
  const [deLayout, marketLayout, deOverview, deCity, marketOverview, marketCity, sticky, expertCard] = await Promise.all([
    source("app/tattoo-singles/layout.tsx"),
    source("app/market-tattoo-singles/[market]/layout.tsx"),
    source("app/tattoo-singles/page.tsx"),
    source("app/tattoo-singles/[slug]/page.tsx"),
    source("app/market-tattoo-singles/[market]/page.tsx"),
    source("app/market-tattoo-singles/[market]/[slug]/page.tsx"),
    source("components/sticky-cta-button.tsx"),
    source("components/expert-trust-card.tsx"),
  ]);

  assert.match(deLayout, /<SiteFrame market="de" aid="location">/);
  assert.match(marketLayout, /<SiteFrame market=\{market\} sectionLive stickyCta aid="location">/);
  for (const page of [deOverview, deCity, marketOverview, marketCity]) {
    assert.match(page, /conversionUrl\([^\n]+"\/registration\/", "location"\)/);
    assert.doesNotMatch(page, /href=\{?(?:cityPage|city|AT_OVERVIEW_HERO)\.registrationUrl\}?/);
    assert.doesNotMatch(page, /href="\/registration\/"/);
  }
  assert.match(sticky, /conversionUrl\(publicUrl\(market\), '\/registration\/', 'location'\)/);
  assert.doesNotMatch(sticky, /Tattoo-Singles in deiner Stadt finden/);
  assert.match(sticky, /text: 'Jetzt kostenlos registrieren'/);
  assert.doesNotMatch(sticky, /`\$\{publicUrl\(market\)\}\?AID=location`/);
  assert.match(deCity, /<ExpertTrustCard[\s\S]*aid="location"[\s\S]*\/>/);
  assert.match(expertCard, /href=\{conversionUrl\(publicUrl\(market\), "\/registration\/", aid\)\}/);
});

test("DE, AT and CH city routes use the same complete studio-guide architecture", async () => {
  const [deRoute, chRoute, shared] = await Promise.all([
    source("app/tattoo-studios/[city]/page.tsx"),
    source("app/market-tattoo-studios/[market]/[city]/page.tsx"),
    source("components/tattoo-studio-city-guide.tsx"),
  ]);

  assert.match(deRoute, /<TattooStudioCityGuide guide=\{guide\} market="de"/);
  assert.match(chRoute, /<TattooStudioCityGuide guide=\{guide\} market=\{market\}/);
  for (const marker of ["CollectionPage", "BreadcrumbList", "ItemList", "FAQPage", 'id="studio-auswahl"', 'id="auswahl-check"', 'id="haeufige-fragen"', "studio-place-card"]) {
    assert.match(shared, new RegExp(marker));
  }
  assert.match(shared, /const studios = \[\.\.\.guide\.studios\]\.sort/);
  assert.match(shared, /sourceIsPage/);
  assert.match(shared, /Webseiten und Kontaktwege findest du direkt bei den Studios/);
});

test("DE, AT and CH detail routes use the same honest studio-profile architecture", async () => {
  const [deRoute, chRoute, shared] = await Promise.all([
    source("app/tattoo-studio/[slug]/page.tsx"),
    source("app/market-tattoo-studio/[market]/[slug]/page.tsx"),
    source("components/tattoo-studio-detail.tsx"),
  ]);

  assert.match(deRoute, /<TattooStudioDetail studio=\{studio\} city=\{city\} market="de"/);
  assert.match(chRoute, /<TattooStudioDetail studio=\{studio\} city=\{city\} market=\{market\}/);
  assert.match(shared, /"@type": "TattooParlor"/);
  assert.match(shared, /"@type": "BreadcrumbList"/);
  assert.match(shared, /hasCompleteStreetAddress\(studio\.address\)/);
  assert.match(shared, /className="studio-detail-place"/);
  assert.match(shared, /<LocationPinIcon/);
  assert.match(shared, /Keine Website verfügbar/);
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
  assert.match(detail, /mailto:christian@datingnischen\.de\?subject=/);
  assert.match(detail, /encodeURIComponent\(`Datenkorrektur Studio: \$\{studio\.name\}`\)/);
  assert.doesNotMatch(detail, /publicUrl\(market, "\/kontakt\/"\)/);
  assert.match(shell, /function isCityLink/);
  assert.match(shell, /<LocationPinIcon className="footer-city-link-icon"/);
  assert.match(css, /\.studio-place-card\s*\{/);
  assert.match(css, /\.studio-place-icon\s*\{/);
  assert.match(css, /\.footer-city-link\s*\{/);
  assert.match(css, /\.studio-editorial-card a\[href\*="\/tattoo-singles\/"\]::before/);
});

test("studio metadata mentions styles only when structured style evidence exists", async () => {
  const [deRoute, marketRoute] = await Promise.all([
    source("app/tattoo-studio/[slug]/page.tsx"),
    source("app/market-tattoo-studio/[market]/[slug]/page.tsx"),
  ]);

  for (const route of [deRoute, marketRoute]) {
    assert.match(route, /studio\.styles\.length/);
    assert.match(route, /Stilrichtungen, Adresse/);
    assert.match(route, /Adresse, .*Quellen/);
  }
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
  const [city, css] = await Promise.all([
    source("components/tattoo-studio-city-guide.tsx"),
    source("app/globals.css"),
  ]);
  assert.match(city, /className="studio-editorial-tattoo-image"/);
  assert.match(city, /guide\.legacyImageAlt/);
  assert.match(city, /className="studio-city-hero-media"[\s\S]*unoptimized=\{market === "de"\}/);
  assert.match(city, /src=\{guide\.legacyImageUrl\}[\s\S]*\bunoptimized\b/);
  assert.match(city, /src=\{guide\.legacyImageUrl\}[\s\S]*loading="eager"/);
  assert.match(city, /Tattoo-Illustration aus dem Stadtguide/);
  assert.match(css, /\.studio-choice-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /\.studio-faq-list\s*\{/);
  assert.match(css, /\.studio-hero-actions\s*\{/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.studio-choice-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.tattoo-studio-card-mark\s*\{[^}]*min-height:\s*88px/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.studio-city-hero-media\s*\{[^}]*min-height:\s*220px/s);
  assert.match(css, /\.studio-editorial-tattoo-image\s*\{[^}]*aspect-ratio:/s);
  assert.match(css, /\.site-footer-shell:has\(\+ \.sticky-cta-button\) \.footer-surface\.footer-surface-sticky\s*\{[^}]*padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom, 0px\)\)/s);
  assert.doesNotMatch(css, /\.footer-surface-compact\s*\{[^}]*padding-bottom:\s*calc\(88px/);
});

test("site navigation links to the new studio guide rather than the singles city list", async () => {
  const [shell, page, largestCities] = await Promise.all([
    source("components/site-shell.tsx"),
    source("app/tattoo-studios/page.tsx"),
    source("components/tattoo-studio-largest-cities.tsx"),
  ]);
  assert.match(shell, /Lieblings-Studios", href: "\/tattoo-studios"/);
  assert.match(shell, /Tattoo-Studio-Guide/);
  assert.match(shell, /Tattoo-Studios Berlin/);
  assert.match(page, /Tattoo-Studios Schweiz/);
  assert.match(page, /tattoo-studio-verzeichnis-deutschland\.png/);
  assert.match(page, /tattoo-studio-verzeichnis-deutschland\.png[\s\S]*\bunoptimized\b/);
  assert.match(page, /tattoo-studios-nach-stadt-deutschland\.png/);
  assert.match(page, /tattoo-studios-nach-stadt-deutschland\.png[\s\S]*loading="eager"[\s\S]*\bunoptimized\b/);
  assert.match(page, /src=\{city\.imageUrl\}[\s\S]*\bunoptimized\b/);
  assert.match(largestCities, /sizes="\(max-width: 640px\) 112px, 150px"[\s\S]*\n\s+unoptimized\s*\n/);
  assert.match(page, /href="#stadtguides"/);
  assert.match(page, /id="stadtguides"/);
  assert.match(page, /guideCities\.map/);
  assert.match(page, /Wähle deine Stadt und entdecke hilfreiche Tipps für deine Studiosuche/);
  assert.match(page, /city\.publicationStatus === "verified" \? `\$\{city\.studios\.length\} Studios und Tipps zur Auswahl` : "Tipps für deine Studiosuche"/);
  assert.match(page, /city\.publicationStatus === "verified" \? `Studios in \$\{city\.cityName\} entdecken` : `Guide für \$\{city\.cityName\} öffnen`/);
  assert.match(page, /Darauf solltest du bei der Studiosuche achten/);
  assert.match(page, /Vergleiche nicht nur die Entfernung/);
  assert.doesNotMatch(`${page}\n${largestCities}`, /übernommen|in Prüfung|Prüfstatus|Prüfdatum|So prüfen wir Studios|redaktionellen Check|[Gg]eprüfte Studios|[Vv]erifizierte Einzelprofile/);
  assert.doesNotMatch(page, /Für Berlin und Hannover findest du/);
});
