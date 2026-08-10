import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

function assertCredentialFreeHttpsUrl(value, label) {
  const parsed = new URL(value);
  assert.equal(parsed.protocol, "https:", `${label} must use HTTPS`);
  assert.ok(parsed.hostname, `${label} must include a host`);
  assert.equal(parsed.username, "", `${label} must not embed a username`);
  assert.equal(parsed.password, "", `${label} must not embed a password`);
}

test("Zürich pilot manifest contains a conservative, source-backed Swiss studio slice", async () => {
  const manifest = JSON.parse(await readFile(new URL("data/tattoo-studio-guide-zuerich.json", root), "utf8"));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.guide.identity, "CH:zuerich");
  assert.equal(manifest.guide.market, "ch");
  assert.equal(manifest.guide.country, "CH");
  assert.equal(manifest.guide.citySlug, "zuerich");
  assert.equal(manifest.guide.cityName, "Zürich");
  assert.match(manifest.guide.selectionMethodHtml, /keine Rangliste/i);
  assertCredentialFreeHttpsUrl(manifest.guide.sourceUrl, "guide source");

  assert.ok(manifest.studios.length >= 6 && manifest.studios.length <= 10);
  assert.equal(new Set(manifest.studios.map((studio) => studio.identity)).size, manifest.studios.length);
  assert.equal(new Set(manifest.studios.map((studio) => studio.slug)).size, manifest.studios.length);

  for (const studio of manifest.studios) {
    assert.equal(studio.market, "ch");
    assert.equal(studio.country, "CH");
    assert.equal(studio.cityIdentity, "CH:zuerich");
    assert.equal(studio.citySlug, "zuerich");
    assert.equal(studio.cityName, "Zürich");
    assert.ok(studio.name && studio.address && studio.description);
    assertCredentialFreeHttpsUrl(studio.websiteUrl, `${studio.identity} website`);
    assertCredentialFreeHttpsUrl(studio.sourceUrl, `${studio.identity} source`);
    assert.doesNotMatch(`${studio.name} ${studio.description}`, /\b(?:beste|besten|top|ranking|sterne|bewertung)\b/i);
  }
});

test("Zürich studio guide reuses the licensed Swiss city image with provenance", async () => {
  const images = JSON.parse(await readFile(new URL("data/tattoo-city-images.json", root), "utf8"));
  assert.equal(images.zuerich.imageUrl, "/cities/ch/zuerich.jpg");
  assert.equal(images.zuerich.imageAttribution.creator, "Pexels");
  assert.equal(images.zuerich.imageAttribution.license, "Pixabay Content License");
  assert.equal(
    images.zuerich.imageAttribution.sourceUrl,
    "https://pixabay.com/de/photos/br%C3%BCcke-stadt-fluss-z%C3%BCrich-schweiz-4636745/",
  );
});

test("Swiss studio guide preview routes stay noindex and declare .ch canonicals", async () => {
  const [overview, city, studio] = await Promise.all([
    readFile(new URL("app/market-tattoo-studios/[market]/page.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studios/[market]/[city]/page.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studio/[market]/[slug]/page.tsx", root), "utf8"),
  ]);

  for (const source of [overview, city, studio]) {
    assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
    assert.doesNotMatch(source, /vercel\.app/);
  }
  assert.match(overview, /publicUrl\("ch", "\/tattoo-studios"\)/);
  assert.match(city, /publicUrl\("ch", `\/tattoo-studios\/\$\{city\}`\)/);
  assert.match(studio, /publicUrl\("ch", `\/tattoo-studio\/\$\{slug\}`\)/);
  assert.match(overview, /targetMarket="ch"/);
  assert.match(city, /targetMarket="ch"/);
  assert.match(studio, /targetMarket="ch"/);
});

test("shared tattoo studio loader isolates and resolves the Zürich pilot", async () => {
  const {
    getTattooStudio,
    getTattooStudioCities,
    getTattooStudioSlugs,
  } = await import("../lib/tattoo-studio-guide.ts");

  const swissCities = getTattooStudioCities("ch");
  assert.equal(swissCities.length, 1);
  assert.equal(swissCities[0].identity, "CH:zuerich");
  assert.equal(swissCities[0].studios.length, 7);
  assert.equal(getTattooStudioCities("de").some((city) => city.identity === "CH:zuerich"), false);

  const slugs = getTattooStudioSlugs("ch");
  assert.equal(slugs.length, 7);
  assert.equal(new Set(slugs).size, 7);

  const sinkply = getTattooStudio("ch", "sinkply-zuerich");
  assert.equal(sinkply?.name, "SINKPLY Zürich");
  assert.deepEqual(sinkply?.styles.map((style) => style.label), [
    "Fineline",
    "Lettering",
    "Ornamental",
    "Microrealism",
  ]);
  assert.equal(getTattooStudio("de", "sinkply-zuerich"), null);
});
