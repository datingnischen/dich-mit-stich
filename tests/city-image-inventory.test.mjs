import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedSlugs = [
  "berlin",
  "bochum",
  "bremen",
  "dortmund",
  "dresden",
  "duesseldorf",
  "essen",
  "frankfurt-am-main",
  "hamburg",
  "hannover",
  "koeln",
  "leipzig",
  "mannheim",
  "muenchen",
  "nuernberg",
  "stuttgart",
];

const inventory = JSON.parse(
  await readFile(new URL("../data/tattoo-city-images.json", import.meta.url), "utf8"),
);

test("every supported German tattoo city has a branded WordPress image", () => {
  for (const slug of expectedSlugs) {
    assert.ok(inventory[slug], `${slug} must exist in the shared image inventory`);
    assert.match(
      inventory[slug].imageUrl,
      new RegExp(
        `^https://dich-mit-stich\\.de/magazin/wp-content/uploads/\\d{4}/\\d{2}/dich-mit-stich-tattoo-singles-${slug}\\.jpg$`,
      ),
      `${slug} must use its branded WordPress image`,
    );
  }
});

test("every supported tattoo city has complete image attribution", () => {
  for (const slug of expectedSlugs) {
    const attribution = inventory[slug].imageAttribution;
    assert.ok(attribution.title, `${slug} needs a source title`);
    assert.ok(attribution.creator, `${slug} needs a creator`);
    assert.match(attribution.license, /^(?:CC|by)/i, `${slug} needs a Creative Commons license`);
    assert.match(attribution.sourceUrl, /^https:\/\//, `${slug} needs an HTTPS source URL`);
  }
});
