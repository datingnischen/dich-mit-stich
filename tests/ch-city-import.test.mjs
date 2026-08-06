import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const expectedSlugs = [
  "basel",
  "bern",
  "biel-bienne",
  "genf",
  "lausanne",
  "lugano",
  "luzern",
  "st-gallen",
  "winterthur",
  "zuerich",
];

async function loadInventory() {
  const raw = await readFile(new URL("../data/tattoo-cities-ch.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

test("CH import contains exactly the ten ICONY city pages", async () => {
  const inventory = await loadInventory();

  assert.equal(inventory.market, "ch");
  assert.equal(inventory.sourceUrl, "https://dich-mit-stich.ch/tattoo-singles/");
  assert.deepEqual(Object.keys(inventory.cities).sort(), expectedSlugs);
  assert.deepEqual(
    inventory.overview.cityLinks.map((city) => city.slug).sort(),
    expectedSlugs,
  );
});

test("every CH city has complete editorial, SEO, image and relationship data", async () => {
  const inventory = await loadInventory();

  for (const slug of expectedSlugs) {
    const city = inventory.cities[slug];
    assert.equal(city.slug, slug);
    assert.ok(city.cityName, `${slug} needs a city name`);
    assert.ok(city.title.length > 20, `${slug} needs a title`);
    assert.ok(city.metaDescription.length > 40, `${slug} needs a meta description`);
    assert.ok(city.h1.length > 20, `${slug} needs an h1`);
    assert.ok(city.heroTitle.length > 10, `${slug} needs a hero title`);
    assert.ok(city.contentHtml.length > 1000, `${slug} needs substantial editorial content`);
    assert.equal(city.imageUrl, `/cities/ch/${slug}.jpg`);
    assert.match(city.originalImageUrl, /^https:\/\/static-cms\.icony-hosting\.de\//);
    assert.match(city.imageAttribution.sourceUrl, /^https:\/\/pixabay\.com\//);
    assert.equal(city.registrationUrl, "https://dich-mit-stich.ch/registration/");

    const importedImage = await stat(new URL(`../public/cities/ch/${slug}.jpg`, import.meta.url));
    assert.ok(importedImage.size > 10_000, `${slug} needs a non-empty local image`);

    assert.doesNotMatch(city.contentHtml, /<(?:script|iframe|form|object|embed)\b/i);
    assert.doesNotMatch(city.contentHtml, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(city.contentHtml, /(?:user-media|registration\/|static-cms\.icony-hosting)/i);
    assert.doesNotMatch(city.contentHtml, /https:\/\/dich-mit-stich\.ch\/tattoo-singles\//i);

    for (const related of city.relatedCities) {
      assert.ok(expectedSlugs.includes(related.slug), `${slug} links only to imported CH cities`);
      assert.notEqual(related.slug, slug);
    }
  }
});

test("CH city routes declare .ch canonicals and use the market-aware shell", async () => {
  const overviewSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url),
    "utf8",
  );
  const detailSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  const layoutSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/layout.tsx", import.meta.url),
    "utf8",
  );
  const shellSource = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  const swissLogo = await readFile(new URL("../public/brand/dich-mit-stich-logo-ch.svg", import.meta.url), "utf8");

  assert.match(overviewSource, /publicUrl\("ch", "\/tattoo-singles"\)/);
  assert.match(detailSource, /publicUrl\("ch", `\/tattoo-singles\/\$\{slug\}`\)/);
  assert.match(detailSource, /chTattooCitySlugs/);
  assert.match(layoutSource, /<SiteFrame market="ch" sectionLive>/);
  assert.match(shellSource, /dich-mit-stich-logo-ch\.svg/);
  assert.match(shellSource, /in der Schweiz/);
  assert.match(shellSource, /width=\{isSwissMarket \? 1417 : 691\}/);
  assert.match(shellSource, /height=\{isSwissMarket \? 283 : 140\}/);
  assert.match(swissLogo, /viewBox="0 0 1417\.323 283\.46"/);
  assert.doesNotMatch(`${overviewSource}\n${detailSource}`, /vercel\.app/);
});

test("the idempotent ICONY importer remains available for future city migrations", async () => {
  const importer = await readFile(new URL("../scripts/import-icony-city-pages.mjs", import.meta.url), "utf8");
  assert.match(importer, /SOURCE_ORIGIN\s*=\s*"https:\/\/dich-mit-stich\.ch"/);
  assert.match(importer, /SOURCE_INDEX\s*=\s*`\$\{SOURCE_ORIGIN\}\/tattoo-singles\//);
  assert.match(importer, /static-cms\.icony-hosting\.de/);
  assert.match(importer, /tattoo-cities-ch\.json/);
  assert.doesNotMatch(importer, /NODE_TLS_REJECT_UNAUTHORIZED|rejectUnauthorized\s*:\s*false/);
});
