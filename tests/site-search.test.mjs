import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const exists = (path) => access(new URL(`../${path}`, import.meta.url)).then(() => true, () => false);

test("search lives under Über uns for every market, never as a root /suche route", async () => {
  const { ABOUT_SEARCH_PATH } = await import("../lib/site-search.ts");
  const { ABOUT_SLUGS } = await import("../lib/about-pages.ts");
  const { resolveMarketRequest } = await import("../lib/markets.ts");

  assert.equal(ABOUT_SEARCH_PATH, "/ueber-uns/suche");
  assert.ok(!ABOUT_SLUGS.includes("suche"), "no Über-uns subpage may claim the slug suche");
  assert.ok(await exists("app/ueber-uns/suche/page.tsx"));
  assert.ok(await exists("app/[market]/ueber-uns/suche/page.tsx"));
  for (const path of ["app/suche", "app/[market]/suche", "app/themensuche"]) {
    assert.equal(await exists(path), false, `${path} must not exist: /suche belongs to ICONY`);
  }

  assert.deepEqual(resolveMarketRequest("/ueber-uns/suche"), { action: "rewrite", market: "de", pathname: "/ueber-uns/suche" });
  for (const market of ["at", "ch"]) {
    assert.deepEqual(resolveMarketRequest(`/${market}/ueber-uns/suche/`), {
      action: "market-content",
      market,
      pathname: `/${market}/ueber-uns/suche`,
    });
  }
});

test("search page is noindex, canonical without query and absent from every sitemap", async () => {
  const view = await read("components/site-search-page.tsx");
  assert.match(view, /robots: \{ index: false, follow: true \}/);
  assert.match(view, /canonical: publicUrl\(market, ABOUT_SEARCH_PATH\)/);
  assert.doesNotMatch(view, /formatGermanDate|visibleEntryDate/);

  const { ABOUT_PATHS } = await import("../lib/about-pages.ts");
  assert.ok(!ABOUT_PATHS.some((path) => path.includes("suche")));
  for (const sitemap of ["lib/de-sitemap.ts", "lib/market-sitemap.ts"]) {
    assert.doesNotMatch(await read(sitemap), /suche|ABOUT_SEARCH_PATH/, sitemap);
  }
});

test("search form sits in the header menu and on the Über-uns hub", async () => {
  assert.match(await read("components/site-shell.tsx"), /<SiteSearchForm market=\{market\} variant="menu" \/>/);
  assert.match(await read("components/about-page.tsx"), /page\.slug === null \? \([\s\S]*?<SiteSearchForm market=\{page\.market\} \/>/);
  const form = await read("components/site-search-form.tsx");
  assert.match(form, /method="get"/);
  assert.match(form, /action=\{publicUrl\(market, ABOUT_SEARCH_PATH\)\}/);
});

test("normalises umlauts and diacritics and ranks title hits first", async () => {
  const { normalizeSearchText, searchDocuments, cleanSearchQuery } = await import("../lib/site-search.ts");

  assert.equal(normalizeSearchText("Köln, Zürich & Straße – Café"), "koeln zuerich strasse cafe");
  assert.equal(cleanSearchQuery(["  Tribal   Tattoo ", "x"]), "Tribal Tattoo");
  assert.equal(cleanSearchQuery(undefined), "");

  const documents = [
    { area: "Magazin", title: "Septum-Piercing: Heilung und Pflege", excerpt: "Alles zum Septum.", pathname: "/magazin/septum-piercing" },
    { area: "Magazin", title: "Piercingarten im Überblick", excerpt: "Vom Septum bis zum Industrial.", pathname: "/magazin/piercingarten" },
    { area: "Stadt", title: "Tattoo-Singles in Köln", excerpt: "Szene am Rhein.", pathname: "/tattoo-singles/koeln" },
    { area: "Stadt", title: "Tattoo-Singles in Zürich", excerpt: "", pathname: "/tattoo-singles/zuerich" },
  ];

  assert.deepEqual(searchDocuments(documents, "septum").map((result) => result.pathname), [
    "/magazin/septum-piercing",
    "/magazin/piercingarten",
  ]);
  assert.deepEqual(searchDocuments(documents, "koeln").map((result) => result.pathname), ["/tattoo-singles/koeln"]);
  assert.deepEqual(searchDocuments(documents, "Zurich").map((result) => result.pathname), ["/tattoo-singles/zuerich"]);
  assert.deepEqual(searchDocuments(documents, "  "), []);
  assert.equal(searchDocuments(Array.from({ length: 80 }, (_, index) => ({
    area: "Magazin", title: `Tattoo ${index}`, excerpt: "", pathname: `/magazin/t-${index}`,
  })), "tattoo").length, 50);
});
