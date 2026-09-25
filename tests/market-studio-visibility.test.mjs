import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadMarketSitemap() {
  try {
    return await import("../lib/market-sitemap.ts");
  } catch (error) {
    assert.fail(`lib/market-sitemap.ts must provide the market sitemap contract: ${error.message}`);
  }
}

async function loadStudioGuides() {
  return import("../lib/tattoo-studio-guide.ts");
}

test("market sitemaps list studio city pages that carry verified studios", async () => {
  const { marketSitemapLocations } = await loadMarketSitemap();

  assert.ok(
    marketSitemapLocations("ch").includes("https://dich-mit-stich.ch/tattoo-studios/zuerich/"),
    "Zürich has verified studios and must be discoverable through the CH sitemap",
  );
  assert.ok(
    marketSitemapLocations("at").includes("https://dich-mit-stich.at/tattoo-studios/wien/"),
    "Wien has verified studios and must be discoverable through the AT sitemap",
  );
});

test("market sitemaps list the studio overview once a market has indexable cities", async () => {
  const { marketSitemapLocations } = await loadMarketSitemap();

  assert.ok(marketSitemapLocations("ch").includes("https://dich-mit-stich.ch/tattoo-studios/"));
  assert.ok(marketSitemapLocations("at").includes("https://dich-mit-stich.at/tattoo-studios/"));
});

test("market sitemaps keep the existing pages", async () => {
  const { marketSitemapLocations } = await loadMarketSitemap();
  const locations = marketSitemapLocations("ch");

  assert.ok(locations.includes("https://dich-mit-stich.ch/faq/"));
  assert.ok(locations.includes("https://dich-mit-stich.ch/ueber-uns/"));
  assert.ok(locations.includes("https://dich-mit-stich.ch/tattoo-singles/bern/"));
  assert.equal(new Set(locations).size, locations.length, "a sitemap must not repeat a location");
});

test("studio city indexability follows the published studio data", async () => {
  const { isIndexableTattooStudioCity } = await loadStudioGuides();

  assert.equal(isIndexableTattooStudioCity("ch", "zuerich"), true);
  assert.equal(isIndexableTattooStudioCity("at", "wien"), true);
  assert.equal(isIndexableTattooStudioCity("ch", "eine-stadt-ohne-guide"), false);
});

test("market studio pages derive robots from indexability instead of hardcoding noindex", async () => {
  const cityPage = await readFile(
    new URL("../app/market-tattoo-studios/[market]/[city]/page.tsx", import.meta.url),
    "utf8",
  );
  const overviewPage = await readFile(
    new URL("../app/market-tattoo-studios/[market]/page.tsx", import.meta.url),
    "utf8",
  );

  for (const [label, source] of [["city", cityPage], ["overview", overviewPage]]) {
    assert.doesNotMatch(
      source,
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/,
      `the ${label} page must not hardcode noindex for pages that have publishable content`,
    );
  }
});
