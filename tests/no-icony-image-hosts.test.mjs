import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

// Regel (2026-10-20): Bilder liegen im Repo, nie zur Laufzeit aus dem ICONY-CMS
// (static-cms/static2/cdn3/dynamic-cdn.icony-hosting.de …). Reine Herkunftsvermerke
// in Feldern wie originalImageUrl/originalCmsUrl/legacyUrl sind erlaubt, solange sie nicht gerendert werden.
const ICONY_HOST = /icony-hosting\.(?:de|com)/i;
const ORIGIN_FIELD = /\b(?:originalImageUrl|originalCmsUrl|legacyUrl)\b/;
const SCANNED_DIRS = ["app", "components", "lib", "data", "content", "public"];
const TEXT_FILE = /\.(?:tsx?|mjs|js|json|md|mdx|css|html|txt|xml|svg)$/i;

async function collectFiles(dir) {
  let entries;
  try {
    entries = await readdir(new URL(`../${dir}/`, import.meta.url), { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await collectFiles(relative)));
    else if (TEXT_FILE.test(entry.name)) files.push(relative);
  }
  return files;
}

function offendingLines(source) {
  const lines = source.split(/\r?\n/);
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => {
      if (!ICONY_HOST.test(line)) return false;
      // Herkunftsfeld in derselben oder der vorherigen Zeile (umbrochene Zuweisung).
      return !ORIGIN_FIELD.test(line) && !ORIGIN_FIELD.test(lines[index - 1] ?? "");
    })
    .map(({ line, index }) => `${index + 1}: ${line.trim().slice(0, 160)}`);
}

test("no ICONY image host appears in rendered code or data", async () => {
  const files = (await Promise.all(SCANNED_DIRS.map(collectFiles))).flat();
  assert.ok(files.length > 50, "scan must cover the app sources");

  const offenders = [];
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    for (const hit of offendingLines(source)) offenders.push(`${file}:${hit}`);
  }

  assert.deepEqual(offenders, [], "ICONY-Bilder ins Repo (public/) holen und über staticAsset() ausliefern");
});

test("next.config allows no ICONY image hosts", async () => {
  const configFiles = (await readdir(new URL("../", import.meta.url))).filter((name) => /^next\.config\./.test(name));
  assert.ok(configFiles.length > 0);
  for (const name of configFiles) {
    const config = await readFile(new URL(`../${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(config, ICONY_HOST, `${name} must not allow ICONY image hosts`);
  }
});

test("market overview captions link the repo copy, not the ICONY original", async () => {
  const page = await readFile(new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<a href=\{staticAsset\(imagePath\)\}>/);
  assert.doesNotMatch(page, /sourceUrl=/);
});
