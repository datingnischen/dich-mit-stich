import assert from "node:assert/strict";
import test from "node:test";

import { cleanWordPressSeoTitle, magazineMetaTitle } from "../lib/magazine-seo.ts";

test("AIOSEO-Suffix des Magazins wird entfernt", () => {
  assert.equal(cleanWordPressSeoTitle("Suprasorb® F: Tattoo-Schutzfolie richtig anwenden | Tattoo-Magazin"), "Suprasorb® F: Tattoo-Schutzfolie richtig anwenden");
  assert.equal(cleanWordPressSeoTitle("Tattoo-Magazin"), "Tattoo-Magazin");
});

test("Magazin-Titel bekommt die Marke nur, solange er kurz genug bleibt", () => {
  assert.equal(magazineMetaTitle({ title: "Kreuz-Tattoos", seoTitle: "Kreuz-Tattoos: Bedeutung & Ideen" }), "Kreuz-Tattoos: Bedeutung & Ideen");
  assert.deepEqual(
    magazineMetaTitle({ title: "x", seoTitle: "Space & Galaxy Sleeve Tattoo: Astronaut, Planeten & Nebel" }),
    { absolute: "Space & Galaxy Sleeve Tattoo: Astronaut, Planeten & Nebel" },
  );
  assert.equal(magazineMetaTitle({ title: "Narbentattoos" }), "Narbentattoos");
});
