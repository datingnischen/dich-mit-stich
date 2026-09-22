import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadSingles() {
  try {
    return await import("../lib/tattoo-singles.ts");
  } catch (error) {
    assert.fail(`lib/tattoo-singles.ts must provide the singles bridge contract: ${error.message}`);
  }
}

test("a studio city that has its own singles page links straight to it", async () => {
  const { tattooSinglesPath } = await loadSingles();

  assert.equal(tattooSinglesPath("ch", "genf"), "/tattoo-singles/genf");
  assert.equal(tattooSinglesPath("ch", "zuerich"), "/tattoo-singles/zuerich");
  assert.equal(tattooSinglesPath("at", "wien"), "/tattoo-singles/wien");
  assert.equal(tattooSinglesPath("de", "berlin"), "/tattoo-singles/berlin");
});

test("a studio city without a singles page falls back to the overview instead of a dead link", async () => {
  const { tattooSinglesPath } = await loadSingles();

  // These cities have a studio guide but no singles city page.
  for (const [market, slug] of [
    ["at", "innsbruck"],
    ["de", "bonn"],
    ["de", "duisburg"],
    ["de", "karlsruhe"],
    ["de", "muenster"],
    ["de", "wuppertal"],
  ]) {
    assert.equal(
      tattooSinglesPath(market, slug),
      "/tattoo-singles",
      `${market}/${slug} has no singles city page and must fall back to the overview`,
    );
  }
});

test("the studio city guide offers the bridge to the singles pages", async () => {
  const component = await readFile(
    new URL("../components/tattoo-studio-city-guide.tsx", import.meta.url),
    "utf8",
  );

  assert.match(component, /studio-singles-card/, "the guide must render the singles bridge card");
  assert.match(
    component,
    /tattooSinglesPath\(market, guide\.slug\)/,
    "the bridge must resolve its target through the shared helper, so cities without a singles page stay safe",
  );
  assert.match(
    component,
    /<MarketLink[^>]*targetMarket={market}/,
    "the bridge must use MarketLink so the link stays inside the visitor's market",
  );
  assert.doesNotMatch(component, /studio-singles-card[\s\S]{0,400}AID=/, "an internal link must not carry campaign tracking");
});

test("the singles bridge card is styled", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.studio-singles-card\s*\{/, "the bridge card needs its own styling");
});

test("the bridge card sets its own text colours instead of inheriting section defaults", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const ruleBody = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  };

  // `.content-section h2` sets a colour, so a card that does not declare its own
  // ends up with dark grey text — unreadable on anything but a light background.
  assert.match(
    ruleBody(".studio-singles-card h2"),
    /color:/,
    "the heading must declare its colour, otherwise .content-section h2 wins",
  );

  // The global `.eyebrow` ships a light pill background; a card that only
  // overrides the text colour can end up white on near-white.
  const eyebrow = ruleBody(".studio-singles-card .eyebrow");
  assert.match(eyebrow, /color:/, "the eyebrow must declare its text colour");
  assert.match(eyebrow, /background:/, "the eyebrow must declare its pill background to stay legible");
});
