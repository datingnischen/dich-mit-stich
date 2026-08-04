import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cityDataSource = await readFile(new URL("../lib/tattoo-singles.ts", import.meta.url), "utf8");
const cityPageSource = await readFile(new URL("../app/tattoo-singles/[slug]/page.tsx", import.meta.url), "utf8");

test("Berlin uses the licensed WordPress city image and exposes its attribution", () => {
  assert.match(
    cityDataSource,
    /https:\/\/dich-mit-stich\.de\/magazin\/wp-content\/uploads\/2026\/08\/dich-mit-stich-tattoo-singles-berlin\.jpg/,
  );
  assert.match(cityDataSource, /imageAttribution/);
  assert.match(cityDataSource, /Berlin_Skyline_Architecture_City_Germany_Lights\.jpg/);
});

test("city detail pages render the city image and a visible image source", () => {
  assert.match(cityPageSource, /cityPage\.imageUrl/);
  assert.match(cityPageSource, />Bildquelle</);
  assert.match(cityPageSource, /cityPage\.imageAttribution/);
});
