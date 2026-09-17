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
  assert.match(renderer, /href=\{publicUrl\(market, "\/registration\/"\)\}/);
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
  assert.match(expert, /href=\{publicUrl\(market, "\/registration\/"\)\}/);
  assert.match(override, /<MarketLink/);

  const { conversionUrl } = await import("../lib/conversion-links.ts");
  for (const domain of ["dich-mit-stich.de", "dich-mit-stich.at", "dich-mit-stich.ch"]) {
    assert.equal(conversionUrl(`https://${domain}`, "/", "magazin"), `https://${domain}/suche/?AID=magazin`);
  }
});

test("imported magazine HTML localizes first-party absolute links before rendering", async () => {
  const { localizeFirstPartyHtmlLinks } = await import("../lib/market-html.ts");
  const html = '<p>Mehr bei Dich-mit-Stich.de: <a href="https://dich-mit-stich.de/magazin/ratgeber/?x=1#top">Ratgeber</a><a href="https://example.org/">Quelle</a></p>';

  assert.equal(
    localizeFirstPartyHtmlLinks(html, "https://dich-mit-stich.at"),
    '<p>Mehr bei Dich-mit-Stich.at: <a href="https://dich-mit-stich.at/magazin/ratgeber/?x=1#top">Ratgeber</a><a href="https://example.org/">Quelle</a></p>',
  );
  assert.equal(localizeFirstPartyHtmlLinks(html, "https://dich-mit-stich.de"), html);

  const renderer = await readSource("../components/market-html-content.tsx");
  assert.match(renderer, /localizeFirstPartyHtmlLinks\(html, publicUrl\(market\)\)/);
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
