import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertCompleteCityResponse, normalizeWordPressCity } from "../lib/wordpress-cities.ts";

const wpCity = {
  id: 1786,
  slug: "ch-zuerich",
  title: { rendered: "Tattoo-Singles in Z&uuml;rich" },
  excerpt: { rendered: "<p>Singles in Z&uuml;rich kennenlernen.</p>" },
  content: { rendered: "<p>Redaktioneller Inhalt aus WordPress.</p>" },
  acf: {
    city_id: "CH:zuerich",
    city_name: "Zürich",
    city_country: "CH",
    city_region: "Zürich",
    hero_title: "Tattoo-Singles in Zürich",
    hero_lead: "Singles in Zürich kennenlernen.",
    city_hero_claim: "Finde Singles in Zürich und Umgebung",
    primary_cta_url: "https://dich-mit-stich.ch/registration/",
    sources: [
      { title: "Stadtseite", url: "https://dich-mit-stich.ch/tattoo-singles/zuerich/", note: "Ausgangsseite" },
      {
        title: "Foto von Pexels auf Pixabay",
        url: "https://example.com/image",
        publisher: "Pixabay",
        note: "Quelle des Stadtbildes; Urheber: Pexels.",
      },
      {
        title: "Pixabay Content License",
        url: "https://pixabay.com/service/license-summary/",
        publisher: "Pixabay",
        note: "Lizenz für das zugeordnete Stadtbild.",
      },
    ],
  },
  _embedded: {
    "wp:featuredmedia": [
      { source_url: "https://dich-mit-stich.de/magazin/wp-content/uploads/zuerich.jpg", alt_text: "Zürich" },
    ],
  },
};

test("assertCompleteCityResponse rejects silently truncated CPT responses", () => {
  const response = new Response("[]", { headers: { "x-wp-totalpages": "2" } });
  assert.throws(() => assertCompleteCityResponse(response), /exceeds the 100-record loader invariant/);
});

test("normalizeWordPressCity maps the market-scoped CPT record to the public city model", () => {
  const city = normalizeWordPressCity(wpCity);

  assert.equal(city.market, "ch");
  assert.equal(city.slug, "zuerich");
  assert.equal(city.cityName, "Zürich");
  assert.equal(city.title, "Tattoo-Singles in Zürich");
  assert.equal(city.metaDescription, "Singles in Zürich kennenlernen.");
  assert.equal(city.h1, "Tattoo-Singles in Zürich");
  assert.equal(city.heroTitle, "Finde Singles in Zürich und Umgebung");
  assert.equal(city.imageUrl, "https://dich-mit-stich.de/magazin/wp-content/uploads/zuerich.jpg");
  assert.equal(city.imageAlt, "Zürich");
  assert.equal(city.imageAttribution.label, "Foto von Pexels auf Pixabay");
  assert.equal(city.imageAttribution.sourceUrl, "https://example.com/image");
  assert.equal(city.imageAttribution.publisher, "Pixabay");
  assert.equal(city.imageAttribution.licenseLabel, "Pixabay Content License");
  assert.equal(city.imageAttribution.licenseUrl, "https://pixabay.com/service/license-summary/");
  assert.equal(city.registrationUrl, "https://dich-mit-stich.ch/registration/");
  assert.match(city.contentHtml, /aus WordPress/);
});

test("normalizeWordPressCity represents missing featured media safely", () => {
  const city = normalizeWordPressCity({ ...wpCity, featured_media: 0, _embedded: {} });
  assert.equal(city.imageUrl, null);
});

test("normalizeWordPressCity sanitizes hostile CMS HTML while preserving editorial markup", () => {
  const city = normalizeWordPressCity({
    ...wpCity,
    content: {
      rendered: '<h2>Studios</h2><p onclick="alert(1)">Sicher<script>alert(1)</script><a href="javascript:alert(1)">Böse</a><a href="/tattoo-singles">Intern</a></p>',
    },
  });

  assert.match(city.contentHtml, /<h2>Studios<\/h2>/);
  assert.match(city.contentHtml, /href="\/tattoo-singles"/);
  assert.doesNotMatch(city.contentHtml, /script|onclick|javascript:/i);
});

test("DE and CH city renderers use WordPress rather than legacy HTML or repository JSON", async () => {
  const [deOverview, deDetail, chOverview, chDetail, loader] = await Promise.all([
    readFile(new URL("../app/tattoo-singles/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tattoo-singles/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/market-tattoo-singles/[market]/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/wordpress-cities.ts", import.meta.url), "utf8"),
  ]);
  const routeSources = `${deOverview}\n${deDetail}\n${chOverview}\n${chDetail}`;

  assert.match(routeSources, /@\/lib\/wordpress-cities/);
  assert.doesNotMatch(routeSources, /@\/lib\/(?:ch-)?tattoo-singles/);
  assert.doesNotMatch(loader, /tattoo-cities-ch\.json|dich-mit-stich\.de\/tattoo-singles/);
  assert.match(loader, /\/stadt/);
  assert.match(loader.match(/CITY_ROUTE_FIELDS[^;]+/)?.[0] || "", /acf\.city_id/);
  assert.doesNotMatch(loader.match(/CITY_ROUTE_FIELDS[^;]+/)?.[0] || "", /content|excerpt|_embed|_embedded/);
  for (const source of [deOverview, deDetail, chOverview, chDetail]) {
    assert.match(source, /imageUrl \?/);
  }
  assert.match(deDetail, /data-city-hero-layout="stacked"/);
  assert.match(chDetail, /data-city-hero-layout="stacked"/);
  for (const source of [deDetail, chDetail]) {
    assert.match(source, /imageAttribution\.licenseLabel/);
    assert.match(source, /imageAttribution\.licenseUrl/);
    assert.match(source, /data-image-attribution-version="licensed-v1"/);
  }
  assert.match(loader, /city_source_revision:\s*CITY_SOURCE_REVISION/);
});

test("AT and CH market overviews preserve their selected branded legacy overview images with provenance", async () => {
  const [source, styles, markets] = await Promise.all([
    readFile(new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../lib/markets.ts", import.meta.url), "utf8"),
  ]);

  assert.match(source, /dich-mit-stich-ch-partnersuche\.jpg/);
  assert.match(source, /Tattoo-Singles nach Region in der Schweiz/);
  assert.match(source, /data-market-overview-asset="legacy-icony-3506"/);
  assert.match(source, /static-cms\.icony-hosting\.de\/cms\/639CB037D8430757BEE61CDBFF2A243E7794CCCBA1E5242CB0B73A56AB076DB4\/1000\/dich-mit-stich-ch-partnersuche\.jpg/);

  assert.match(source, /frontpage-visual-dichmitstich\.webp/);
  assert.match(source, /Finde jetzt tätowierte Singles aus Österreich/);
  assert.match(source, /assetKey: "legacy-icony-at-home-hero"/);
  assert.match(source, /Singles aus Österreich/);
  assert.match(source, /static2\.icony-hosting\.de\/dyncontentbf91b1bc561a9d20d467d3270352d3e5\/img\/generic2021\/frontpage-v4\/backgrounds\/frontpage-visual-dichmitstich\.webp/);
  assert.match(markets, /market === "ch"/);
  assert.match(markets, /pathname: `\/market-tattoo-singles\/\$\{market\}`/);
  assert.match(markets, /pathname: `\/market-tattoo-singles\/ch\/\$\{cityMatch\[1\]\}`/);

  assert.match(styles, /\.market-overview-asset figcaption a\s*\{[^}]*color:\s*var\(--brand\)[^}]*text-decoration:\s*underline/s);
  assert.match(styles, /\.market-overview-asset figcaption a:focus-visible\s*\{[^}]*outline:/s);
});
