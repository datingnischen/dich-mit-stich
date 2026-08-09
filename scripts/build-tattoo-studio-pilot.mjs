#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildTattooStudioCityRecord, buildTattooStudioRecord } from "./tattoo-studio-import-lib.mjs";
import { extractTattooStudioCityGuide } from "./tattoo-studio-source-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const cities = ["berlin", "hannover"];
const results = [];

for (const citySlug of cities) {
  const sourcePath = resolve(root, `tests/fixtures/tattoo-studios-${citySlug}.html`);
  const outputPath = resolve(root, `data/tattoo-studio-guide-${citySlug}.json`);
  const sourceUrl = `https://dich-mit-stich.de/tattoo-studios/${citySlug}/`;
  const source = await readFile(sourcePath, "utf8");
  const extracted = extractTattooStudioCityGuide(source, {
    market: "DE",
    citySlug,
    sourceUrl,
  });
  const guide = buildTattooStudioCityRecord(extracted);
  const studios = extracted.studios.map((studio) => buildTattooStudioRecord(studio, extracted));

  await writeFile(outputPath, `${JSON.stringify({
    schemaVersion: 1,
    generatedFrom: sourceUrl,
    guide,
    studios,
  }, null, 2)}\n`, "utf8");
  results.push({ guide: guide.identity, studios: studios.length, outputPath });
}

console.log(JSON.stringify(results));
