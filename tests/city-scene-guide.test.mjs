import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { cityGuideTheme, parseCityGuide } from "../lib/city-guide.ts";

const BERLIN_LIKE = `
<p>Berlin ist das Herz der alternativen Szene.</p>
<h2>Die Top Tattoo-Studios in Berlin</h2>
<ul><li><strong>Berlin Ink</strong> &ndash; <em>Chausseestraße 124, 10115 Berlin</em><br />Studio-Text.</li></ul>
<h2>Subkultur-Hotspots und alternative Szenen in Berlin</h2>
<p>Zu den bekanntesten Treffpunkten zählen:</p>
<ul>
<li><strong>Kreuzberg</strong> &ndash; Das Epizentrum der Berliner Subkultur.</li>
<li><strong>RAW-Gelände</strong> &ndash; Street Art und Flohmärkte.</li>
</ul>
<h2>Nachtleben für die alternative Szene in Berlin</h2>
<ul><li><strong>SO36</strong> &ndash; Punk, Metal und Gothic.</li></ul>
<h2>Andere interessante Städte für tätowierte und gepiercte Singles</h2>
<ul><li><a href="https://dich-mit-stich.de/tattoo-singles/leipzig/">Leipzig</a></li><li><a href="/tattoo-singles/hamburg">Hamburg</a></li></ul>
<p>Bildquelle: https://www.freepik.com/free-photo/example</p>`;

test("city guide drops the studio list and turns named lists into cards", () => {
  const guide = parseCityGuide(BERLIN_LIKE);

  assert.equal(guide.hasStudioSection, true);
  assert.deepEqual(guide.sections.map((section) => section.theme), ["hotspots", "nightlife"]);
  assert.doesNotMatch(JSON.stringify(guide), /Berlin Ink|Chausseestraße/);
  assert.deepEqual(guide.sections[0].items.map((item) => item.name), ["Kreuzberg", "RAW-Gelände"]);
  assert.equal(guide.sections[0].items[0].html, "Das Epizentrum der Berliner Subkultur.");
  assert.match(guide.sections[0].leadHtml, /Treffpunkten/);
});

test("city guide collects similar cities and removes the legacy image credit", () => {
  const guide = parseCityGuide(BERLIN_LIKE);

  assert.deepEqual(guide.relatedCitySlugs, ["leipzig", "hamburg"]);
  assert.doesNotMatch(JSON.stringify(guide), /Bildquelle|freepik/);
});

test("prose sections without named list items stay prose", () => {
  const guide = parseCityGuide("<h2>Bars zum Kennenlernen in Dornbirn</h2><p>Text.</p><ul><li>ohne Namen</li></ul>");

  assert.equal(guide.sections[0].theme, "nightlife");
  assert.equal(guide.sections[0].items.length, 0);
  assert.match(guide.sections[0].leadHtml, /ohne Namen/);
});

test("section themes follow the WordPress headings", () => {
  assert.equal(cityGuideTheme("Events und Festivals in Köln"), "events");
  assert.equal(cityGuideTheme("Street Art und Urban Culture in Essen"), "streetart");
  assert.equal(cityGuideTheme("Mode und Shops für alternative Styles in Bremen"), "shopping");
  assert.equal(cityGuideTheme("Kunst und Kultur in Leipzig"), "culture");
});

test("city pages use the scene guide and the compact author box", async () => {
  const deSource = await readFile(new URL("../app/tattoo-singles/[slug]/page.tsx", import.meta.url), "utf8");

  assert.match(deSource, /<CitySceneGuide/);
  assert.match(deSource, /variant="compact"/);
  assert.doesNotMatch(deSource, /dangerouslySetInnerHTML=\{\{ __html: cityPage\.contentHtml \}\}/);
});
