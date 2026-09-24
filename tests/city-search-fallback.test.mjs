import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { conversionUrl } from "../lib/conversion-links.ts";
import { publicUrl } from "../lib/markets.ts";

test("die Städteübersichten verweisen auf die individuelle Suche", async () => {
  const de = await readFile(new URL("../app/tattoo-singles/page.tsx", import.meta.url), "utf8");
  const markets = await readFile(new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url), "utf8");

  assert.match(de, /<CitySearchFallback market="de" \/>/);
  assert.match(markets, /<CitySearchFallback market="at" \/>/);
  assert.match(markets, /<CitySearchFallback market="ch" \/>/);
});

test("der Suche-Link zeigt absolut auf die Live-Domain", () => {
  assert.equal(conversionUrl(publicUrl("de"), "/suche/", "location"), "https://dich-mit-stich.de/suche/?AID=location");
  assert.match(conversionUrl(publicUrl("at"), "/suche/", "location"), /^https:\/\/[^/]*dich-mit-stich\.at\/suche\/\?AID=location$/);
  assert.match(conversionUrl(publicUrl("ch"), "/suche/", "location"), /^https:\/\/[^/]*dich-mit-stich\.ch\/suche\/\?AID=location$/);
});
