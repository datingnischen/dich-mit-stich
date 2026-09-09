import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadAboutPages() {
  try {
    return await import("../lib/about-pages.ts");
  } catch (error) {
    assert.fail(`lib/about-pages.ts must provide the Dich-mit-Stich about-page contract: ${error.message}`);
  }
}

test("defines the canonical Dich-mit-Stich about hierarchy for every market", async () => {
  const { ABOUT_PATHS, ABOUT_SLUGS, getAboutPage } = await loadAboutPages();

  assert.deepEqual(ABOUT_SLUGS, ["expertenteam", "erfolgsgeschichten", "kooperationen", "bewertungen", "social-media"]);
  assert.deepEqual(ABOUT_PATHS, [
    "/ueber-uns",
    "/ueber-uns/expertenteam",
    "/ueber-uns/erfolgsgeschichten",
    "/ueber-uns/kooperationen",
    "/ueber-uns/bewertungen",
    "/ueber-uns/social-media",
  ]);

  for (const market of ["de", "at", "ch"]) {
    for (const slug of [null, ...ABOUT_SLUGS]) {
      const page = getAboutPage(market, slug);
      assert.ok(page, `${market}/${slug ?? "root"} must exist`);
      assert.equal(page.market, market);
      assert.equal(page.path, slug ? `/ueber-uns/${slug}` : "/ueber-uns");
      assert.match(page.title, /Dich mit Stich|Expertenteam|Erfolgsgeschichten|Kooperationen|Bewertungen|Social Media/);
      assert.doesNotMatch(JSON.stringify(page), /elFlirt|www\.elflirt/i);
    }
  }

  assert.equal(getAboutPage("de", "geschichte"), null);
  assert.equal(getAboutPage("ch", "presseberichte"), null);
});

test("routes the complete about hierarchy to live DE, AT and CH pages", async () => {
  const { ABOUT_PATHS } = await loadAboutPages();
  const { resolveMarketRequest } = await import("../lib/markets.ts");

  for (const path of ABOUT_PATHS) {
    assert.deepEqual(resolveMarketRequest(path), {
      action: "rewrite",
      market: "de",
      pathname: path,
    });
    assert.deepEqual(resolveMarketRequest(`/de${path}`), {
      action: "rewrite",
      market: "de",
      pathname: path,
    });
    assert.deepEqual(resolveMarketRequest(`/at${path}`), {
      action: "market-content",
      market: "at",
      pathname: `/at${path}`,
    });
    assert.deepEqual(resolveMarketRequest(`/ch${path}`), {
      action: "market-content",
      market: "ch",
      pathname: `/ch${path}`,
    });
  }

  assert.deepEqual(resolveMarketRequest("/market-about/ch"), { action: "not-found" });
  assert.deepEqual(resolveMarketRequest("/at/ueber-uns/geschichte"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/ueber-uns/geschichte",
  });
});

test("builds a market-isolated AboutPage entity graph", async () => {
  const { buildAboutPageGraph, getAboutPage } = await loadAboutPages();

  for (const market of ["de", "at", "ch"]) {
    const page = getAboutPage(market, "expertenteam");
    const graph = buildAboutPageGraph(page);
    const serialized = JSON.stringify(graph);
    const domain = market === "de" ? "dich-mit-stich.de" : `dich-mit-stich.${market}`;

    assert.equal(graph["@context"], "https://schema.org");
    assert.ok(graph["@graph"].some((node) => node["@type"] === "AboutPage"));
    assert.match(serialized, new RegExp(`https://${domain.replace(".", "\\.")}/ueber-uns/expertenteam`));
    if (market !== "de") assert.doesNotMatch(serialized, /https:\/\/dich-mit-stich\.de/);
    assert.doesNotMatch(serialized, /worksFor|parentOrganization|owner/);
  }
});

test("wires reusable rendered pages with canonical metadata and safe external links", async () => {
  const paths = [
    "../components/about-page.tsx",
    "../app/ueber-uns/page.tsx",
    "../app/ueber-uns/[slug]/page.tsx",
    "../app/[market]/ueber-uns/page.tsx",
    "../app/[market]/ueber-uns/[slug]/page.tsx",
  ];
  const sources = await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const combined = sources.join("\n");

  assert.match(combined, /buildAboutPageGraph/);
  assert.match(combined, /serializeJsonLd/);
  assert.match(combined, /publicUrl\(page\.market, page\.path\)/);
  assert.match(combined, /<MarketLink/);
  assert.match(combined, /nofollow noopener noreferrer/);
  assert.match(combined, /<SiteFrame market=\{page\.market\} sectionLive>/);
  assert.doesNotMatch(combined, /elFlirt|vercel\.app/i);
});

test("provides a responsive elFlirt-inspired about composition in the Dich-mit-Stich design system", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const selector of [
    ".about-hero",
    ".about-highlight-row",
    ".about-topic-grid",
    ".about-topic-card",
    ".about-split-section",
    ".about-final-cta",
  ]) {
    assert.match(css, new RegExp(selector.replace(".", "\\.")));
  }

  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.about-hero[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.about-topic-card:focus-visible/);
});

test("publishes the about hierarchy through sitemaps, crawl rules and navigation", async () => {
  const [mainSitemap, marketSitemap, marketRobots, shell] = await Promise.all([
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/market-sitemap/[market]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/market-robots/[market]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(mainSitemap, /ABOUT_PATHS/);
  assert.match(marketSitemap, /ABOUT_PATHS/);
  assert.match(marketRobots, /Allow: \/ueber-uns/);
  assert.match(shell, /Über uns/);
  for (const slug of ["expertenteam", "erfolgsgeschichten", "kooperationen", "bewertungen", "social-media"]) {
    assert.match(shell, new RegExp(`/ueber-uns/${slug}`));
  }
});

test("redirects legacy trust URLs to exact destinations in the new hierarchy", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const expected = [
    ["/magazin/expertenteam", "/ueber-uns/expertenteam"],
    ["/magazin/thema/erfolgsgeschichten", "/ueber-uns/erfolgsgeschichten"],
    ["/social-media", "/ueber-uns/social-media"],
    ["/bewertungen-und-erfahrungen", "/ueber-uns/bewertungen"],
    ["/wir-suchen", "/ueber-uns/kooperationen"],
    ["/kooperation-mit-tattoo-studios", "/ueber-uns/kooperationen"],
    ["/kooperation-mit-influencern", "/ueber-uns/kooperationen"],
  ];

  for (const [source, destination] of expected) {
    assert.match(config, new RegExp(`source: \\"${source}\\"[\\s\\S]{0,100}destination: \\"${destination}\\"`));
  }
  assert.doesNotMatch(config, /source: "\/unsere-erfolgsgeschichten\.html"/);
});
