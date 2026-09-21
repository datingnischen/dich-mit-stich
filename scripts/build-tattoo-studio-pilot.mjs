#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildTattooStudioCityRecord, buildTattooStudioRecord } from "./tattoo-studio-import-lib.mjs";
import { extractTattooStudioCityGuide } from "./tattoo-studio-source-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const sourceIndex = JSON.parse(await readFile(resolve(root, "data/legacy/tattoo-studios-de/index.json"), "utf8"));
const curatedCities = new Set(["berlin", "hannover"]);
const cities = sourceIndex.records
  .filter((record) => record.slug !== "deutschland" && !curatedCities.has(record.slug))
  .sort((left, right) => left.slug.localeCompare(right.slug, "de"));
const results = [];
const manifests = [];

for (const city of cities) {
  const citySlug = city.slug;
  const sourcePath = resolve(root, city.snapshotPath);
  const sourceUrl = city.sourceUrl;
  const source = await readFile(sourcePath, "utf8");
  const extracted = extractTattooStudioCityGuide(source, {
    market: "DE",
    citySlug,
    sourceUrl,
  });
  const guide = {
    ...buildTattooStudioCityRecord(extracted),
    publicationStatus: "rollout",
    imageUrl: `/city-previews/${citySlug}.jpg`,
  };
  const studios = extracted.studios.map((studio) => buildTattooStudioRecord(studio, extracted));
  const manifest = {
    schemaVersion: 1,
    generatedFrom: sourceUrl,
    guide,
    studios,
  };
  manifests.push(manifest);
  results.push({ guide: guide.identity, studios: studios.length, sourcePath });
}

const outputPath = resolve(root, "data/tattoo-studio-guides-de.json");
const output = `${JSON.stringify({ schemaVersion: 1, manifests }, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const committed = await readFile(outputPath, "utf8");
  if (committed !== output) {
    throw new Error("Generated tattoo studio guide catalog is stale. Run node scripts/build-tattoo-studio-pilot.mjs.");
  }
} else {
  await writeFile(outputPath, output, "utf8");
}
console.log(JSON.stringify(results));
