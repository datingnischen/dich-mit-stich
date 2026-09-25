import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage wrappers reuse one country-aware renderer", async () => {
  const [deRoute, marketRoute, renderer] = await Promise.all([
    readSource("../app/page.tsx"),
    readSource("../app/[market]/page.tsx"),
    readSource("../components/home-page.tsx"),
  ]);

  assert.match(deRoute, /<HomePage market="de"\s*\/>/);
  assert.match(deRoute, /publicUrl\("de"\)/);
  assert.match(marketRoute, /<HomePage market=\{market\}\s*\/>/);
  assert.match(marketRoute, /publicUrl\(market\)/);
  assert.match(marketRoute, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);

  assert.match(renderer, /getWordPressCityOverview\(market\)/);
  assert.match(renderer, /const HOME_MARKET_COPY/);
  assert.match(renderer, /exampleCitySlug:\s*"wien"/);
  assert.match(renderer, /exampleCitySlug:\s*"zuerich"/);
  assert.match(renderer, /Von Wien bis Graz/);
  assert.match(renderer, /Von Zürich bis Basel/);
  assert.match(renderer, /<MarketLink/);
  assert.match(renderer, /href=\{conversionUrl\(publicUrl\(market\), "\/registration\/", "location"\)\}/);
  assert.doesNotMatch(renderer, /from "next\/link"/);
});

test("editorial robots preserve DE indexing and safety overrides while gating AT and CH", async () => {
  const { marketEditorialRobots } = await import("../lib/editorial-metadata.ts");

  assert.equal(marketEditorialRobots("de", false), undefined);
  assert.deepEqual(marketEditorialRobots("at", false), { index: false, follow: true });
  assert.deepEqual(marketEditorialRobots("ch", false), { index: false, follow: true });
  assert.deepEqual(marketEditorialRobots("de", true), { index: false, follow: false });
  assert.deepEqual(marketEditorialRobots("at", true), { index: false, follow: false });
});

test("magazine route families reuse shared market-aware renderers", async () => {
  const routePairs = [
    ["../app/magazin/page.tsx", "../app/[market]/magazin/page.tsx", "MagazineOverview"],
    ["../app/magazin/[slug]/page.tsx", "../app/[market]/magazin/[slug]/page.tsx", "MagazineDetail"],
    ["../app/magazin/thema/[slug]/page.tsx", "../app/[market]/magazin/thema/[slug]/page.tsx", "MagazineCategory"],
    ["../app/magazin/author/[slug]/page.tsx", "../app/[market]/magazin/author/[slug]/page.tsx", "MagazineAuthor"],
  ];

  for (const [dePath, marketPath, rendererName] of routePairs) {
    const [deRoute, marketRoute] = await Promise.all([readSource(dePath), readSource(marketPath)]);
    assert.match(deRoute, new RegExp(`<${rendererName}[^>]*market="de"`), dePath);
    assert.match(marketRoute, new RegExp(`<${rendererName}[^>]*market=\\{market\\}`), marketPath);
    assert.match(marketRoute, /marketEditorialRobots/);
    assert.match(marketRoute, /publicUrl\(market,/);
  }

  const layout = await readSource("../app/[market]/magazin/layout.tsx");
  assert.match(layout, /<SiteFrame market=\{market\} aid="magazin">/);
});

test("AT and CH magazine sources fail closed until complete market loaders exist", async () => {
  const {
    emptyMagazineMarketCopy,
    MAGAZINE_SOURCE_LOADER_KEYS,
    resolveMagazineMarketSource,
  } = await import("../lib/market-magazine-policy.ts");
  let deLoads = 0;
  let atLoads = 0;
  const completeSource = (load) => Object.fromEntries(
    MAGAZINE_SOURCE_LOADER_KEYS.map((key) => [key, async () => { load(); return key; }]),
  );
  const deSource = completeSource(() => { deLoads += 1; });
  const atSource = completeSource(() => { atLoads += 1; });

  assert.equal(resolveMagazineMarketSource("at", { de: deSource }), null);
  assert.equal(resolveMagazineMarketSource("ch", { de: deSource }), null);
  assert.equal(resolveMagazineMarketSource("at", { de: deSource, at: { posts: deSource.posts } }), null);
  assert.equal(deLoads, 0, "an absent or incomplete sibling source must never fall back to DE loaders");
  assert.equal(resolveMagazineMarketSource("at", { de: deSource, at: atSource }), atSource);
  await resolveMagazineMarketSource("at", { de: deSource, at: atSource }).posts();
  assert.equal(atLoads, 1);
  assert.equal(deLoads, 0);

  assert.deepEqual(emptyMagazineMarketCopy("at"), {
    country: "Österreich",
    title: "Flirtradar Österreich: Magazin im Aufbau",
    description: "Für Österreich sind derzeit noch keine Magazinbeiträge veröffentlicht. Eigene Artikel folgen.",
  });
  assert.deepEqual(emptyMagazineMarketCopy("ch"), {
    country: "die Schweiz",
    title: "Flirtradar Schweiz: Magazin im Aufbau",
    description: "Für die Schweiz sind derzeit noch keine Magazinbeiträge veröffentlicht. Eigene Artikel folgen.",
  });

  const marketMagazine = await readSource("../lib/market-magazine.ts");
  assert.match(marketMagazine, /MARKET_MAGAZINE_SOURCES/);
  assert.match(marketMagazine, /resolveMagazineMarketSource/);
  assert.doesNotMatch(marketMagazine, /ACTIVE_MAGAZINE_MARKETS/);
});

test("every magazine surface consumes the fail-closed market catalog", async () => {
  const [home, overview, detail, category, author, detailRoute, categoryRoute, authorRoute] = await Promise.all([
    readSource("../components/home-page.tsx"),
    readSource("../components/magazine-overview.tsx"),
    readSource("../components/magazine-detail.tsx"),
    readSource("../components/magazine-category.tsx"),
    readSource("../components/magazine-author.tsx"),
    readSource("../app/[market]/magazin/[slug]/page.tsx"),
    readSource("../app/[market]/magazin/thema/[slug]/page.tsx"),
    readSource("../app/[market]/magazin/author/[slug]/page.tsx"),
  ]);

  assert.match(home, /getMarketMagazineCatalog\(market\)/);
  assert.match(overview, /getMarketMagazineCatalog\(market\)/);
  assert.match(detail, /getMarketMagazineEntryBySlug\(market, slug\)/);
  assert.match(detail, /getMarketMagazineDetailContext\(market, slug,/);
  assert.match(detail, /getMarketMagazinePublishedProfileGraph\(market,/);
  assert.match(detail, /getMarketMagazineAuthorProfile\(market, entry\.authorSlug\)/);
  assert.doesNotMatch(detail, /from "@\/lib\/author-profiles"/);
  assert.doesNotMatch(detail, /from "@\/lib\/magazine-(?:answer-engine|content-safety|editorial-overrides|featured-images|videos)"/);
  assert.match(category, /getMarketMagazineCategoryBySlug\(market, slug\)/);
  assert.match(category, /getMarketMagazineEntriesForCategory\(market, slug\)/);
  assert.match(author, /getMarketMagazineAuthorProfile\(market, slug\)/);
  assert.match(author, /getMarketMagazineAuthorPosts\(market, slug\)/);
  assert.match(overview, /marketHasMagazineContent\(market\)/);
  assert.match(detailRoute, /getMarketMagazineRouteEntries\("at"\)/);
  assert.match(detailRoute, /getMarketMagazineEntryBySlug\(market, slug\)/);
  assert.match(detailRoute, /getMarketMagazineDetailContext\(market, slug,/);
  assert.doesNotMatch(detailRoute, /from "@\/lib\/magazine-(?:answer-engine|content-safety|editorial-overrides)"/);
  assert.match(categoryRoute, /getMarketMagazineCategories\("at"\)/);
  assert.match(categoryRoute, /getMarketMagazineCategoryBySlug\(market, slug\)/);
  assert.match(authorRoute, /getMarketMagazineAuthorSlugs\("at"\)/);
  assert.match(authorRoute, /getMarketMagazineAuthorProfile\(market, slug\)/);
});

test("shared magazine rendering keeps preview navigation and country conversion URLs correct", async () => {
  const [overview, detail, category, author, cta, expert, override] = await Promise.all([
    readSource("../components/magazine-overview.tsx"),
    readSource("../components/magazine-detail.tsx"),
    readSource("../components/magazine-category.tsx"),
    readSource("../components/magazine-author.tsx"),
    readSource("../components/magazine-dating-cta.tsx"),
    readSource("../components/expert-trust-card.tsx"),
    readSource("../components/anti-eyebrow-editorial.tsx"),
  ]);

  for (const [name, source] of [["overview", overview], ["detail", detail], ["category", category], ["author", author]]) {
    assert.match(source, /<MarketLink/, `${name} must use MarketLink`);
    assert.doesNotMatch(source, /from "next\/link"/, `${name} must not use raw Next links`);
  }
  assert.match(detail, /<MarketHtmlContent[^>]*market=\{market\}[^>]*html=\{renderedContent\}/);
  assert.match(cta, /conversionUrl\(publicUrl\(market\), "\/", "magazin"\)/);
  assert.match(cta, /<MarketLink[^>]*targetMarket=\{market\}[^>]*pathname="\/tattoo-singles"/);
  assert.match(expert, /<MarketLink/);
  assert.match(expert, /href=\{conversionUrl\(publicUrl\(market\), "\/registration\/", aid\)\}/);
  assert.match(detail, /<ExpertTrustCard[\s\S]*aid="magazin"[\s\S]*\/>/);
  assert.match(override, /<MarketLink/);

  const { conversionUrl } = await import("../lib/conversion-links.ts");
  for (const domain of ["dich-mit-stich.de", "dich-mit-stich.at", "dich-mit-stich.ch"]) {
    assert.equal(conversionUrl(`https://${domain}`, "/", "magazin"), `https://${domain}/suche/?AID=magazin`);
  }
});

test("sanitized magazine anchors are market-safe before first paint", async () => {
  const { firstPartyInternalPath, marketizeSanitizedHtml } = await import("../lib/market-html.ts");

  assert.equal(
    firstPartyInternalPath("https://dich-mit-stich.de/magazin/ratgeber/?x=1#top"),
    "/magazin/ratgeber/?x=1#top",
  );
  assert.equal(firstPartyInternalPath("https://dich-mit-stich.at/magazin/ratgeber"), "/magazin/ratgeber");
  assert.equal(firstPartyInternalPath("https://www.dich-mit-stich.ch/magazin/ratgeber"), "/magazin/ratgeber");
  assert.equal(firstPartyInternalPath("/magazin/tattoo-studio/?x=1#top"), "/magazin/tattoo-studio/?x=1#top");
  assert.equal(firstPartyInternalPath("/tattoo-singles"), "/tattoo-singles");

  for (const unsafeOrForeignUrl of [
    "https://example.org/magazin/ratgeber",
    "http://dich-mit-stich.de/magazin/ratgeber",
    "https://user@dich-mit-stich.de/magazin/ratgeber",
    "https://dich-mit-stich.de//evil.example/path",
    "https://dich-mit-stich.de/%2f%2fevil.example/path",
    "https://dich-mit-stich.de/%5cevil.example/path",
    "https://dich-mit-stich.de/%0devil.example/path",
    "https://dich-mit-stich.de:443/magazin/x",
    "https://@dich-mit-stich.de/magazin/x",
    "https://:@dich-mit-stich.de/magazin/x",
    "https://%64ich-mit-stich.de/magazin/x",
    "https://dich-mit-stich.de/at/magazin/x",
    "/at/magazin/ratgeber",
    "//evil.example/path",
    "/%2f%2fevil.example/path",
    "/%5cevil.example/path",
    "/../magazin/x",
    "/foo/../../magazin/x",
    "/%2e%2e/magazin/x",
    "/%252e%252e/magazin/x",
    "/foo%252fbar",
    "/foo%255cbar",
    "/foo%zzbar",
    "https://dich-mit-stich.de/magazin/x ",
    "/AT/magazin/x",
  ]) {
    assert.equal(firstPartyInternalPath(unsafeOrForeignUrl), null);
  }

  assert.equal(
    marketizeSanitizedHtml(
      '<p><a href="https://dich-mit-stich.de/magazin/x" target="_blank" rel="nofollow noopener noreferrer">Absolut</a><a href="/tattoo-singles">Relativ</a><a href="https://example.org/x" target="_blank" rel="noopener noreferrer nofollow">Extern</a><a href="/../magazin/x">Unsicher</a></p>',
      "ch",
    ),
    '<p><a href="/magazin/x/" data-dms-internal="true">Absolut</a><a href="/tattoo-singles/" data-dms-internal="true">Relativ</a><a href="https://example.org/x" target="_blank" rel="noopener noreferrer nofollow">Extern</a><a href="/../magazin/x">Unsicher</a></p>',
  );
  assert.equal(
    marketizeSanitizedHtml('<a href="https://dich-mit-stich.de/magazin/helix-piercing/?x=1#top">A</a><a href="/">B</a>', "de"),
    '<a href="/magazin/helix-piercing/?x=1#top" data-dms-internal="true">A</a><a href="/" data-dms-internal="true">B</a>',
  );
  assert.equal(
    marketizeSanitizedHtml('<a href="https://example.org/x" data-dms-internal="true">Extern</a>', "at"),
    '<a href="https://example.org/x">Extern</a>',
  );

  const renderer = await readSource("../components/market-html-content.tsx");
  const clientRenderer = await readSource("../components/market-html-content-client.tsx");
  assert.match(renderer, /marketizeSanitizedHtml\(html, market\)/);
  assert.match(clientRenderer, /useLayoutEffect/);
  assert.match(clientRenderer, /a\[data-dms-internal="true"\]/);
  assert.match(clientRenderer, /isPreviewHost\(window\.location\.hostname\)/);
  assert.match(clientRenderer, /dangerouslySetInnerHTML=\{\{ __html: html \}\}/);
  assert.doesNotMatch(renderer, /localizeFirstPartyHtmlLinks/);
});

test("AT and CH editorial previews stay crawlable for noindex but absent from their sitemaps", async () => {
  const [robots, sitemap] = await Promise.all([
    readSource("../app/market-robots/[market]/route.ts"),
    readSource("../app/market-sitemap/[market]/route.ts"),
  ]);

  assert.match(robots, /Allow: \/magazin/);
  assert.match(robots, /Allow: \/\$/);
  assert.doesNotMatch(sitemap, /getMagazine|\/magazin/);
  assert.doesNotMatch(sitemap, /publicUrl\(market, "\/"\)/);
});
