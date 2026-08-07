import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const expectedSlugs = [
  "basel",
  "bern",
  "biel-bienne",
  "genf",
  "lausanne",
  "lugano",
  "luzern",
  "st-gallen",
  "winterthur",
  "zuerich",
];

async function loadInventory() {
  const raw = await readFile(new URL("../data/tattoo-cities-ch.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

test("CH import contains exactly the ten ICONY city pages", async () => {
  const inventory = await loadInventory();

  assert.equal(inventory.market, "ch");
  assert.equal(inventory.sourceUrl, "https://dich-mit-stich.ch/tattoo-singles/");
  assert.deepEqual(Object.keys(inventory.cities).sort(), expectedSlugs);
  assert.deepEqual(
    inventory.overview.cityLinks.map((city) => city.slug).sort(),
    expectedSlugs,
  );
});

test("every CH city has complete editorial, SEO, image and relationship data", async () => {
  const inventory = await loadInventory();

  for (const slug of expectedSlugs) {
    const city = inventory.cities[slug];
    assert.equal(city.slug, slug);
    assert.ok(city.cityName, `${slug} needs a city name`);
    assert.ok(city.title.length > 20, `${slug} needs a title`);
    assert.ok(city.metaDescription.length > 40, `${slug} needs a meta description`);
    assert.ok(city.h1.length > 20, `${slug} needs an h1`);
    assert.ok(city.heroTitle.length > 10, `${slug} needs a hero title`);
    assert.ok(city.contentHtml.length > 1000, `${slug} needs substantial editorial content`);
    assert.equal(city.imageUrl, `/cities/ch/${slug}.jpg`);
    assert.match(city.originalImageUrl, /^https:\/\/static-cms\.icony-hosting\.de\//);
    assert.match(city.imageAttribution.sourceUrl, /^https:\/\/pixabay\.com\//);
    assert.match(city.imageAttribution.label, /^Foto von .+ auf Pixabay$/);
    assert.ok(city.imageAttribution.creator, `${slug} needs an image creator`);
    assert.equal(city.imageAttribution.publisher, "Pixabay");
    assert.equal(city.imageAttribution.license, "Pixabay Content License");
    assert.equal(city.imageAttribution.licenseUrl, "https://pixabay.com/service/license-summary/");
    assert.equal(city.registrationUrl, "https://dich-mit-stich.ch/registration/");

    const importedImage = await stat(new URL(`../public/cities/ch/${slug}.jpg`, import.meta.url));
    assert.ok(importedImage.size > 10_000, `${slug} needs a non-empty local image`);

    assert.doesNotMatch(city.contentHtml, /<(?:script|iframe|form|object|embed)\b/i);
    assert.doesNotMatch(city.contentHtml, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(city.contentHtml, /(?:user-media|registration\/|static-cms\.icony-hosting)/i);
    assert.doesNotMatch(city.contentHtml, /https:\/\/dich-mit-stich\.ch\/tattoo-singles\//i);

    for (const related of city.relatedCities) {
      assert.ok(expectedSlugs.includes(related.slug), `${slug} links only to imported CH cities`);
      assert.notEqual(related.slug, slug);
    }
  }
});

test("AT city routes declare .at canonicals and use the market-aware shell", async () => {
  const pageSource = await readFile(new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");

  assert.match(pageSource, /const markets: SupportedMarket\[] = \["at", "ch"\]/);
  assert.match(pageSource, /if \(!isSupportedMarket\(market\)\) return \{ robots: \{ index: false, follow: false \} \};/);
  assert.match(pageSource, /alternates: \{ canonical: publicUrl\(market, `\/tattoo-singles\/\$\{slug\}`\) \}/);
  assert.match(pageSource, /MarketHtmlContent className="rich-content" market=\{market\} html=\{city\.contentHtml\}/);
  assert.match(pageSource, /cityIndexLabel: "Alle Städte in Österreich"/);
  assert.match(pageSource, /datingEyebrow: "Dating-Einstieg Österreich"/);
  assert.match(shellSource, /dich-mit-stich-logo-at\.svg/);
  assert.match(shellSource, /at: \{ src: AT_HEADER_LOGO_URL, alt: "dich-mit-stich\.at", width: 345, height: 60 \}/);
});

test("CH city routes declare .ch canonicals and use the market-aware shell", async () => {
  const overviewSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url),
    "utf8",
  );
  const detailSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  const layoutSource = await readFile(
    new URL("../app/market-tattoo-singles/[market]/layout.tsx", import.meta.url),
    "utf8",
  );
  const shellSource = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  const marketHtmlSource = await readFile(new URL("../components/market-html-content.tsx", import.meta.url), "utf8").catch(() => "");
  const swissLogo = await readFile(new URL("../public/brand/dich-mit-stich-logo-ch.svg", import.meta.url), "utf8");

  assert.match(overviewSource, /publicUrl\("ch", "\/tattoo-singles"\)/);
  assert.match(detailSource, /alternates: \{ canonical: publicUrl\(market, `\/tattoo-singles\/\$\{slug\}`\) \}/);
  assert.match(detailSource, /getWordPressCitySlugs/);
  assert.match(overviewSource, /<MarketLink[\s\S]*targetMarket="ch"[\s\S]*pathname=\{`\/tattoo-singles\/\$\{city\.slug\}`\}/);
  assert.doesNotMatch(overviewSource, /href=\{`\/tattoo-singles\/\$\{city\.slug\}`\}/);
  assert.match(detailSource, /<MarketLink[^>]*targetMarket=\{market\}[^>]*pathname="\/tattoo-singles"/);
  assert.match(detailSource, /<MarketHtmlContent[^>]*market=\{market\}[^>]*html=\{city\.contentHtml\}/);
  assert.match(marketHtmlSource, /closest\("a"\)/);
  assert.match(marketHtmlSource, /router\.push\(marketPreviewPath\(market, href\)\)/);
  assert.match(layoutSource, /<SiteFrame market=\{market\} sectionLive>/);
  assert.doesNotMatch(layoutSource, /<SiteFrame market="ch" sectionLive>/);
  assert.match(shellSource, /dich-mit-stich-logo-ch\.svg/);
  assert.match(shellSource, /in der Schweiz/);
  assert.match(shellSource, /const BRAND_LOGOS: Record<MarketCode, \{ src: string; alt: string; width: number; height: number \}> = \{/);
  assert.match(shellSource, /ch: \{ src: CH_HEADER_LOGO_URL, alt: "dich-mit-stich\.ch", width: 1417, height: 283 \}/);
  assert.match(swissLogo, /viewBox="0 0 1417\.323 283\.46"/);
  assert.doesNotMatch(`${overviewSource}\n${detailSource}`, /vercel\.app/);
});

test("city hero images fill their visual container at desktop and mobile sizes", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const pictureRule = css.match(/\.home-stage-picture\s*\{([^}]*)\}/)?.[1] || "";
  const mobileBlock = css.match(/@media \(max-width: 900px\)\s*\{([\s\S]*?)\n\}/)?.[1] || "";

  assert.match(pictureRule, /(?:^|\n)\s*height:\s*420px/);
  assert.match(mobileBlock, /\.home-stage-picture\s*\{[\s\S]*?(?:^|\n)\s*height:\s*320px/m);
});

test("city hero CTA renders below the image without overlap", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const visualRule = css.match(/\.city-stage-visual\s*\{([^}]*)\}/)?.[1] || "";
  const cardRule = css.match(/\.city-stage-visual\s+\.city-entry-card\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(visualRule, /display:\s*grid/);
  assert.match(cardRule, /position:\s*static/);
  assert.match(cardRule, /width:\s*100%/);
  assert.match(cardRule, /margin-top:\s*0/);
});

test("the idempotent ICONY importer remains available for future city migrations", async () => {
  const importer = await readFile(new URL("../scripts/import-icony-city-pages.mjs", import.meta.url), "utf8");
  assert.match(importer, /SOURCE_ORIGIN\s*=\s*"https:\/\/dich-mit-stich\.ch"/);
  assert.match(importer, /SOURCE_INDEX\s*=\s*`\$\{SOURCE_ORIGIN\}\/tattoo-singles\//);
  assert.match(importer, /static-cms\.icony-hosting\.de/);
  assert.match(importer, /tattoo-cities-ch\.json/);
  assert.doesNotMatch(importer, /NODE_TLS_REJECT_UNAUTHORIZED|rejectUnauthorized\s*:\s*false/);
});


test("AT city pages expose the legacy-matching ICONY singles widget with city-specific postal targeting", async () => {
  const pageSource = await readFile(new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url), "utf8");
  const widgetSource = await readFile(new URL("../components/icony-singles-widget.tsx", import.meta.url), "utf8").catch(() => "");

  assert.match(pageSource, /CITY_WIDGET_POSTAL_CODES/);
  assert.match(pageSource, /dornbirn: "6850"/);
  assert.match(pageSource, /wien: "1010"/);
  assert.match(pageSource, /<IconySinglesWidget/);
  assert.match(widgetSource, /https:\/\/js\.icony\.com\/frame\/\?/);
  assert.match(widgetSource, /pc/);
  assert.match(widgetSource, /ctr/);
  assert.match(widgetSource, /it/);
  assert.doesNotMatch(widgetSource, /ctat/);
});
