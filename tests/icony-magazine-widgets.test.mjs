import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildIconyActivityFrame, buildIconyRegistrationFrame } from "../lib/icony-frame-widgets.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the magazine embeds address the market's own ICONY project", async () => {
  assert.equal(new URL(buildIconyActivityFrame("de", "magazin").src).searchParams.get("id"), "dichmitstich");
  assert.equal(new URL(buildIconyActivityFrame("at", "magazin").src).searchParams.get("id"), "dichmitstichat");
  assert.equal(new URL(buildIconyRegistrationFrame("ch", "magazin").src).searchParams.get("id"), "dichmitstichch");
});

test("every magazine embed carries its attribution id so ICONY can trace the signup", () => {
  for (const widget of [buildIconyActivityFrame("de", "magazin"), buildIconyRegistrationFrame("de", "magazin")]) {
    const url = new URL(widget.src);
    assert.equal(url.origin, "https://js.icony.com");
    assert.equal(url.pathname, "/frame/");
    assert.equal(url.searchParams.get("aid"), "magazin");
    assert.equal(url.searchParams.get("pc"), "67133c");
  }
});

test("the registration embed asks ICONY for the short form, the activity embed does not", () => {
  assert.equal(new URL(buildIconyRegistrationFrame("de", "magazin").src).searchParams.get("t"), "4");
  assert.equal(new URL(buildIconyActivityFrame("de", "magazin").src).searchParams.get("t"), null);
  assert.equal(new URL(buildIconyActivityFrame("de", "magazin").src).searchParams.get("sc"), "4f4e4e");
});

test("magazine articles render both embeds between the body and the dating CTA", async () => {
  const detail = await readSource("../components/magazine-detail.tsx");

  assert.match(detail, /<IconyMagazineWidgets market=\{market\} \/>[\s\S]*<MagazineDatingCta market=\{market\} \/>/);
  assert.match(detail, /<MarketHtmlContent market=\{market\} html=\{renderedContent\} \/>[\s\S]*<IconyMagazineWidgets/);
});

test("the ICONY embeds stay sandboxed, lazy and titled", async () => {
  const widgets = await readSource("../components/icony-magazine-widgets.tsx");

  assert.match(widgets, /title=\{widget\.title\}/);
  assert.match(widgets, /loading="lazy"/);
  assert.match(widgets, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(widgets, /sandbox="[^"]*allow-scripts[^"]*"/);
  assert.doesNotMatch(widgets, /sandbox="[^"]*allow-top-navigation(?!-by-user-activation)/);
});

test("the content security policy admits the ICONY frame endpoint and nothing wider", async () => {
  const config = await readSource("../next.config.ts");

  assert.match(config, /"frame-src https:\/\/www\.youtube-nocookie\.com https:\/\/js\.icony\.com"/);
  assert.doesNotMatch(config, /frame-src[^"]*\*/);
});

test("the activity embed shows singles from the market's own country", () => {
  assert.equal(new URL(buildIconyActivityFrame("de", "magazin").src).searchParams.get("ctr"), "49");
  assert.equal(new URL(buildIconyActivityFrame("at", "magazin").src).searchParams.get("ctr"), "43");
  assert.equal(new URL(buildIconyActivityFrame("ch", "magazin").src).searchParams.get("ctr"), "41");
});
