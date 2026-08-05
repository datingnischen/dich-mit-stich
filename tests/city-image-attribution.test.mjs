import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cityDataSource = await readFile(new URL("../lib/tattoo-singles.ts", import.meta.url), "utf8");
const cityPageSource = await readFile(new URL("../app/tattoo-singles/[slug]/page.tsx", import.meta.url), "utf8");

test("all city pages use the central licensed WordPress image inventory", () => {
  assert.match(cityDataSource, /tattoo-city-images\.json/);
  assert.match(cityDataSource, /cityImageInventory\[slug/);
  assert.doesNotMatch(cityDataSource, /slug === "berlin"/);
});

test("city detail pages render the city image and a visible image source", () => {
  assert.match(cityPageSource, /cityPage\.imageUrl/);
  assert.match(cityPageSource, />Bildquelle</);
  assert.match(cityPageSource, /cityPage\.imageAttribution/);
});

test("city detail pages use the canonical city name instead of parsing the H1", () => {
  assert.match(cityDataSource, /cityName: cityLabelFromSlug\(slug\)/);
  assert.match(cityPageSource, /const cityName = cityPage\.cityName/);
  assert.doesNotMatch(cityPageSource, /cityPage\.h1\.replace/);
});
