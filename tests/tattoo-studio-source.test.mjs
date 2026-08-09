import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { extractTattooStudioCityGuide } from "../scripts/tattoo-studio-source-lib.mjs";

const fixture = await readFile(new URL("./fixtures/tattoo-studios-hannover.html", import.meta.url), "utf8");

test("extractTattooStudioCityGuide creates ten structured Hannover studio records", () => {
  const guide = extractTattooStudioCityGuide(fixture, {
    market: "DE",
    citySlug: "hannover",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  });

  assert.equal(guide.identity, "DE:hannover");
  assert.equal(guide.cityName, "Hannover");
  assert.equal(guide.studios.length, 10);
  assert.deepEqual(guide.studios.map((studio) => studio.name), [
    "Monkey Ink",
    "Ink Junkies Tattoo",
    "Laves Tattoo Studio",
    "Prime Ink Tattoo Hannover",
    "Left Hand Path Tattoo",
    "Watchink Tattoo",
    "Blut Haut Ink",
    "A Hurricane Ink Tattoo & Piercing",
    "Arvadon Tattoo Studio",
    "TATS Studio",
  ]);

  for (const studio of guide.studios) {
    assert.match(studio.identity, /^DE:hannover:[a-z0-9-]+$/);
    assert.equal(studio.cityIdentity, "DE:hannover");
    assert.ok(studio.description.length > 80, studio.name);
    assert.match(studio.websiteUrl, /^https:\/\//, studio.name);
    assert.ok(studio.address.length > 8, studio.name);
    assert.ok(studio.sourceUrl.startsWith("https://"), studio.name);
  }
});

test("extractTattooStudioCityGuide preserves editorial transparency and source identity", () => {
  const guide = extractTattooStudioCityGuide(fixture, {
    market: "DE",
    citySlug: "hannover",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  });

  assert.match(guide.editorialHtml, /Tattoo-Szene in Hannover/);
  assert.match(guide.selectionMethodHtml, /keine bezahlte Platzierung/);
  assert.equal(guide.lastVerified, "2026-06-07");
  assert.equal(guide.sourceUrl, "https://dich-mit-stich.de/tattoo-studios/hannover/");
});
