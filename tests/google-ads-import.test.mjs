import assert from "node:assert/strict";
import test from "node:test";

import { buildRows, validateRows, toCsv, COLUMNS, NEGATIVE_KEYWORDS } from "../scripts/build-google-ads-import.mjs";
import { resolveLandingContent, isLandingVariant } from "../lib/landing-tattoo-singles.ts";

const rows = buildRows();
const ads = rows.filter((row) => row["Ad type"] === "Responsive search ad");

test("Google Ads import: all texts within Google limits, Swiss copy without ß", () => {
  assert.deepEqual(validateRows(rows), []);
});

test("Google Ads import: three paused campaigns, one per market, targeted at their country", () => {
  const campaigns = rows.filter((row) => row["Campaign Type"] === "Search");
  assert.equal(campaigns.length, 3);
  for (const campaign of campaigns) {
    assert.equal(campaign["Campaign Status"], "Paused", "never import live campaigns");
    assert.equal(campaign.Networks, "Google search", "no display or search partners at launch");
    assert.equal(campaign.Languages, "de");
  }
  assert.deepEqual(
    rows.filter((row) => row["Location ID"]).map((row) => row["Location ID"]).sort(),
    ["2040", "2276", "2756"],
  );
  for (const campaign of campaigns) {
    const negatives = rows.filter((row) => row.Campaign === campaign.Campaign && row["Criterion Type"] === "Negative Phrase");
    assert.equal(negatives.length, NEGATIVE_KEYWORDS.length);
  }
});

test("Google Ads import: every ad lands on the matching landing page variant with pinned headline = H1 intent", () => {
  assert.ok(ads.length >= 20);
  for (const ad of ads) {
    const url = new URL(ad["Final URL"]);
    assert.equal(url.pathname, "/tattoo-singles/kennenlernen/");
    const market = { "dich-mit-stich.de": "de", "dich-mit-stich.at": "at", "dich-mit-stich.ch": "ch" }[url.hostname];
    assert.ok(market, url.hostname);
    assert.ok(ad.Campaign.includes(` ${market.toUpperCase()} `), `${ad.Campaign} → ${url.hostname}`);

    const v = url.searchParams.get("v");
    assert.ok(isLandingVariant(v), `${ad["Ad Group"]}: unknown variant ${v}`);
    const stadt = url.searchParams.get("stadt");
    const content = resolveLandingContent(market, Object.fromEntries(url.searchParams));
    assert.equal(content.variant, v);
    if (stadt) {
      assert.ok(content.city, `${market}/${stadt} must be a landing page city`);
      assert.ok(ad["Headline 1"].includes(content.city.label), `${ad["Headline 1"]} names ${content.city.label}`);
    }
    assert.equal(ad["Headline 1 position"], "1");
  }
});

test("Google Ads import: every ad group has keywords in phrase and exact match", () => {
  for (const ad of ads) {
    const keywords = rows.filter((row) => row.Campaign === ad.Campaign && row["Ad Group"] === ad["Ad Group"] && row.Keyword);
    assert.ok(keywords.some((row) => row["Criterion Type"] === "Phrase"), ad["Ad Group"]);
    assert.ok(keywords.some((row) => row["Criterion Type"] === "Exact"), ad["Ad Group"]);
  }
});

test("Google Ads import: CSV has a header row and one line per row", () => {
  const csv = toCsv(rows);
  const lines = csv.replace(/^﻿/, "").trimEnd().split("\r\n");
  assert.equal(lines[0], COLUMNS.join(","));
  assert.equal(lines.length, rows.length + 1);
});
