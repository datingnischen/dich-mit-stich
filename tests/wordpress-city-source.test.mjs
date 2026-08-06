import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeWordPressCity } from "../lib/wordpress-cities.ts";

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
      { title: "Bildquelle Zürich", url: "https://example.com/image", note: "Quelle des Stadtbildes." },
    ],
  },
  _embedded: {
    "wp:featuredmedia": [
      { source_url: "https://dich-mit-stich.de/magazin/wp-content/uploads/zuerich.jpg", alt_text: "Zürich" },
    ],
  },
};

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
  assert.equal(city.imageAttribution.label, "Bildquelle Zürich");
  assert.equal(city.imageAttribution.sourceUrl, "https://example.com/image");
  assert.equal(city.registrationUrl, "https://dich-mit-stich.ch/registration/");
  assert.match(city.contentHtml, /aus WordPress/);
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
  assert.match(loader, /CITY_ROUTE_FIELDS/);
  assert.doesNotMatch(loader.match(/CITY_ROUTE_FIELDS[^;]+/)?.[0] || "", /content|_embed|_embedded/);
  assert.match(deDetail, /data-city-hero-layout="stacked"/);
  assert.match(chDetail, /data-city-hero-layout="stacked"/);
});
