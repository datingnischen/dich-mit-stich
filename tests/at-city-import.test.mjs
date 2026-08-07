import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const expectedSlugs = [
  "dornbirn",
  "graz",
  "klagenfurt",
  "linz",
  "salzburg",
  "sankt-poelten",
  "villach",
  "wels",
  "wien",
  "wiener-neustadt",
];

async function loadInventory() {
  const raw = await readFile(new URL("../data/tattoo-cities-at.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

test("AT import contains exactly the ten ICONY city pages", async () => {
  const inventory = await loadInventory();

  assert.equal(inventory.market, "at");
  assert.equal(inventory.sourceUrl, "https://dich-mit-stich.at/tattoo-singles/");
  assert.deepEqual(Object.keys(inventory.cities).sort(), expectedSlugs);
  assert.deepEqual(
    inventory.overview.cityLinks.map((city) => city.slug).sort(),
    expectedSlugs,
  );
});

test("every AT city has complete editorial, SEO, image and relationship data", async () => {
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
    assert.equal(city.imageUrl, `/cities/at/${slug}.jpg`);
    assert.match(city.originalImageUrl, /^https:\/\/static-cms\.icony-hosting\.de\//);
    assert.match(city.imageAttribution.sourceUrl, /^https:\/\/pixabay\.com\//);
    assert.match(city.imageAttribution.label, /^Foto von .+ auf Pixabay$/);
    assert.ok(city.imageAttribution.creator, `${slug} needs an image creator`);
    assert.equal(city.imageAttribution.publisher, "Pixabay");
    assert.equal(city.imageAttribution.license, "Pixabay Content License");
    assert.equal(city.imageAttribution.licenseUrl, "https://pixabay.com/service/license-summary/");
    assert.equal(city.registrationUrl, "https://dich-mit-stich.at/registration/");

    const importedImage = await stat(new URL(`../public/cities/at/${slug}.jpg`, import.meta.url));
    assert.ok(importedImage.size > 10_000, `${slug} needs a non-empty local image`);

    assert.doesNotMatch(city.contentHtml, /<(?:script|iframe|form|object|embed)\b/i);
    assert.doesNotMatch(city.contentHtml, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(city.contentHtml, /(?:user-media|registration\/|static-cms\.icony-hosting)/i);
    assert.doesNotMatch(city.contentHtml, /https:\/\/dich-mit-stich\.at\/tattoo-singles\//i);
  }
});
