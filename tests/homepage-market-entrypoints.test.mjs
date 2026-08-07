import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage exposes country-specific city entrypoints for DE, AT, and CH", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /getWordPressCityOverview/);
  assert.match(source, /countryLabel:\s*"Deutschland"/);
  assert.match(source, /countryLabel:\s*"Österreich"/);
  assert.match(source, /countryLabel:\s*"Schweiz"/);
  assert.match(source, /publicUrl\("de", "\/tattoo-singles"\)/);
  assert.match(source, /publicUrl\("at", "\/tattoo-singles"\)/);
  assert.match(source, /publicUrl\("ch", "\/tattoo-singles"\)/);
  assert.match(source, /Städte in Deutschland/);
  assert.match(source, /Städte in Österreich/);
  assert.match(source, /Städte in der Schweiz/);
});
