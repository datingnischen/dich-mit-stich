#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildTattooStudioCityRecord, buildTattooStudioRecord } from "./tattoo-studio-import-lib.mjs";
import { extractTattooStudioCityGuide } from "./tattoo-studio-source-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "tests/fixtures/tattoo-studios-hannover.html");
const outputPath = resolve(root, "data/tattoo-studio-guide-hannover.json");
const sourceUrl = "https://dich-mit-stich.de/tattoo-studios/hannover/";

const source = await readFile(sourcePath, "utf8");
const extracted = extractTattooStudioCityGuide(source, {
  market: "DE",
  citySlug: "hannover",
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

console.log(JSON.stringify({ guide: guide.identity, studios: studios.length, outputPath }));
