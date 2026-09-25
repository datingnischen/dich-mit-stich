import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTattooStudioCityRecord,
  buildTattooStudioRecord,
  inferTattooStyles,
} from "../scripts/tattoo-studio-import-lib.mjs";

const guide = {
  identity: "DE:hannover",
  market: "de",
  country: "DE",
  citySlug: "hannover",
  cityName: "Hannover",
  title: "Tattoo-Studios in Hannover – Die besten Tattoo-Studios finden",
  sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  editorialHtml: "<h2>Tattoo-Szene in Hannover</h2><p>Lokaler Guide.</p>",
  selectionMethodHtml: "<h2>Datenstand</h2><p>Keine bezahlte Platzierung.</p>",
  lastVerified: "2026-06-07",
};

const sourceStudio = {
  identity: "DE:hannover:tats-studio-hannover",
  cityIdentity: "DE:hannover",
  market: "de",
  country: "DE",
  citySlug: "hannover",
  cityName: "Hannover",
  slug: "tats-studio-hannover",
  name: "TATS Studio",
  description: "Inklusives Studio für Fineline, Linework, Realistic, Black and Grey, Traditional, Blackwork und Ornamental.",
  websiteUrl: "https://tats.studio",
  address: "Lindener Marktplatz 3, 30449 Hannover",
  contact: "Telefon und E-Mail",
  sourceUrl: "https://tats.studio",
};

test("buildTattooStudioRecord maps a source studio to the durable ACF contract", () => {
  const record = buildTattooStudioRecord(sourceStudio, guide);

  assert.equal(record.identity, "DE:hannover:tats-studio-hannover");
  assert.equal(record.wpSlug, "de-hannover-tats-studio-hannover");
  assert.equal(record.acf.studio_id, record.identity);
  assert.equal(record.acf.studio_country, "DE");
  assert.equal(record.acf.studio_city, "Hannover");
  assert.equal(record.acf.studio_address, sourceStudio.address);
  assert.equal(record.acf.website_url, sourceStudio.websiteUrl);
  assert.equal(record.acf.last_verified, "2026-06-07");
  assert.equal(record.acf.verification_status, "editorial");
  assert.equal(record.acf.paid_placement, false);
  assert.deepEqual(record.acf.tattoo_styles, [
    "black-and-grey",
    "blackwork",
    "fineline",
    "linework",
    "ornamental",
    "realistic",
    "traditional",
  ]);
});

test("inferTattooStyles does not turn explicitly unavailable styles into filter terms", () => {
  assert.deepEqual(
    inferTattooStyles("Das Studio ist offen für viele Richtungen, weist jedoch darauf hin, dass Maori-Tattoos nicht angeboten werden."),
    [],
  );
});

test("inferTattooStyles keeps positive styles when another style is explicitly unavailable", () => {
  assert.deepEqual(
    inferTattooStyles("Fineline wird angeboten, Maori-Tattoos werden nicht angeboten."),
    ["fineline"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline wird angeboten und Maori-Tattoos werden nicht angeboten."),
    ["fineline"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline offered, Maori not offered."),
    ["fineline"],
  );
});

test("inferTattooStyles propagates leading negation across coordinated style lists", () => {
  assert.deepEqual(
    inferTattooStyles("Keine Fineline- oder Maori-Tattoos werden angeboten."),
    [],
  );
  assert.deepEqual(
    inferTattooStyles("No Fineline or Maori tattoos are offered."),
    [],
  );
});

test("inferTattooStyles limits negation propagation to genuine list connectors", () => {
  assert.deepEqual(
    inferTattooStyles("Fineline wird nicht angeboten und Maori wird angeboten."),
    ["maori"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline und Maori werden nicht angeboten."),
    [],
  );
  assert.deepEqual(
    inferTattooStyles("Keine Fineline\nMaori wird angeboten."),
    ["maori"],
  );
  assert.deepEqual(
    inferTattooStyles("Keine Fineline - Maori wird angeboten."),
    ["maori"],
  );
});

test("studio records escape descriptive HTML and reject unsafe external URLs", () => {
  const record = buildTattooStudioRecord({
    ...sourceStudio,
    description: "Fineline & <script>alert('x')</script>",
  }, guide);
  assert.equal(record.contentHtml, "<p>Fineline &amp; &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;</p>");

  assert.throws(
    () => buildTattooStudioRecord({
      ...sourceStudio,
      websiteUrl: "javascript:alert(1)",
      sourceUrl: "javascript:alert(1)",
    }, guide),
    /valid HTTPS URL/,
  );
});

test("studio records allow an explicitly missing website while preserving the verified source", () => {
  const record = buildTattooStudioRecord({
    ...sourceStudio,
    websiteUrl: "",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/berlin/",
  }, guide);

  assert.equal(record.websiteUrl, "");
  assert.equal(record.acf.website_url, "");
  assert.equal(record.acf.source_url, "https://dich-mit-stich.de/tattoo-studios/berlin/");
});

test("buildTattooStudioCityRecord keeps city editorial content separate from studios", () => {
  const record = buildTattooStudioCityRecord(guide);

  assert.equal(record.identity, "DE:hannover");
  assert.equal(record.wpSlug, "de-hannover");
  assert.equal(record.acf.guide_city_id, "DE:hannover");
  assert.equal(record.acf.guide_country, "DE");
  assert.equal(record.acf.last_verified, "2026-06-07");
  assert.match(record.contentHtml, /Tattoo-Szene in Hannover/);
  assert.match(record.contentHtml, /Keine bezahlte Platzierung/);
});
