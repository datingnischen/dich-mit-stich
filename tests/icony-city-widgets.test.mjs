import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getIconyCityWidgetConfig, listIconyWidgetCities } from "../lib/icony-city-widgets.ts";

const EXPECTED = {
  de: [
    "berlin", "bochum", "bremen", "dortmund", "dresden", "duesseldorf", "essen", "frankfurt-am-main",
    "hamburg", "hannover", "koeln", "leipzig", "mannheim", "muenchen", "nuernberg", "stuttgart",
  ],
  at: [
    "dornbirn", "graz", "klagenfurt", "linz", "salzburg", "sankt-poelten", "villach", "wels", "wien", "wiener-neustadt",
  ],
  ch: [
    "basel", "bern", "biel-bienne", "genf", "lausanne", "lugano", "luzern", "st-gallen", "winterthur", "zuerich",
  ],
};

test("every supported DE, AT, and CH city has a local ICONY widget configuration", () => {
  for (const [market, slugs] of Object.entries(EXPECTED)) {
    assert.deepEqual(listIconyWidgetCities(market), slugs);
    for (const slug of slugs) {
      const config = getIconyCityWidgetConfig(market, slug);
      assert.ok(config, `${market}/${slug} must have a widget config`);
      assert.match(config.postalCode, /^\d{4,5}$/);
      assert.ok(config.projectKey);
      assert.match(config.legacyCounter, /^\d+$/);
    }
  }
});

test("all country city renderers mount the shared local singles widget", async () => {
  const deSource = await readFile(new URL("../app/tattoo-singles/[slug]/page.tsx", import.meta.url), "utf8");
  const marketSource = await readFile(new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url), "utf8");
  const widgetSource = await readFile(new URL("../components/icony-singles-widget.tsx", import.meta.url), "utf8");

  assert.match(deSource, /getIconyCityWidgetConfig\("de", slug\)/);
  assert.match(deSource, /<IconySinglesWidget/);
  assert.match(deSource, /market="de"/);
  assert.match(marketSource, /getIconyCityWidgetConfig\(market, slug\)/);
  assert.doesNotMatch(marketSource, /market === "at" && widgetPostalCode/);
  assert.match(widgetSource, /market: MarketCode/);
  assert.match(widgetSource, /publicUrl\(market, '\/suche\/'\)/);
});
