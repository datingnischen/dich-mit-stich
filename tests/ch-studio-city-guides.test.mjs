import assert from "node:assert/strict";
import test from "node:test";

async function loadStudioGuides() {
  return import("../lib/tattoo-studio-guide.ts");
}

async function loadMarkets() {
  return import("../lib/markets.ts");
}

const REQUIRED_SECTIONS = (cityName) => [
  "Einleitung",
  `Tattoo-Szene in ${cityName}`,
  `Beliebte Tattoo-Stile in ${cityName}`,
  `Worauf bei der Studioauswahl in ${cityName} geachtet werden sollte`,
  "Kurze Zusammenfassung",
];

test("the CH market publishes a studio city guide for Genf", async () => {
  const { getTattooStudioCityGuide } = await loadStudioGuides();
  const guide = getTattooStudioCityGuide("ch", "genf");

  assert.ok(guide, "Genf must have a CH studio city guide");
  assert.equal(guide.cityName, "Genf");
  assert.equal(guide.market, "ch");
  assert.equal(guide.country, "CH");
});

test("Genf publishes the studios that were checked against their own website", async () => {
  const { getTattooStudioCityGuide, isIndexableTattooStudioCity } = await loadStudioGuides();
  const guide = getTattooStudioCityGuide("ch", "genf");

  assert.equal(guide.publicationStatus, "verified");
  assert.equal(guide.studios.length, 2, "only studios verified at the primary source are published");
  assert.equal(isIndexableTattooStudioCity("ch", "genf"), true);
});

test("every published CH studio carries the data a reader needs to act on", async () => {
  const { getTattooStudioCityGuide, hasCompleteStreetAddress } = await loadStudioGuides();

  for (const studio of getTattooStudioCityGuide("ch", "genf").studios) {
    assert.ok(studio.name, "a studio needs its name");
    assert.ok(
      hasCompleteStreetAddress(studio.address),
      `${studio.name} needs a street address with postal code, got "${studio.address}"`,
    );
    assert.match(studio.address, /Gen[eè]ve$/, `${studio.name} must actually sit in the city of Genève`);
    assert.match(studio.websiteUrl, /^https:\/\//, `${studio.name} needs its official website`);
    assert.ok(studio.sourceUrl, `${studio.name} needs the source the data was read from`);
  }
});

test("a verified CH city guide reaches the sitemap", async () => {
  const { marketSitemapLocations } = await import("../lib/market-sitemap.ts");

  assert.ok(marketSitemapLocations("ch").includes("https://dich-mit-stich.ch/tattoo-studios/genf/"));
});

test("CH city guides carry the editorial sections the rollout page renders", async () => {
  const { getTattooStudioCityGuide } = await loadStudioGuides();
  const guide = getTattooStudioCityGuide("ch", "genf");

  for (const heading of REQUIRED_SECTIONS("Genf")) {
    assert.ok(
      guide.editorialHtml.includes(`<h2>${heading}</h2>`),
      `the editorial body must contain the section "${heading}"`,
    );
  }
  assert.ok(
    guide.editorialHtml.length > 2500,
    `a city guide needs real substance, got ${guide.editorialHtml.length} characters`,
  );
  assert.ok(guide.selectionMethodHtml.includes("<h2>"), "the guide must explain how the page was put together");
});

test("CH city guides resolve their city image from the CH catalogue", async () => {
  const { getTattooStudioCityGuide } = await loadStudioGuides();
  const guide = getTattooStudioCityGuide("ch", "genf");

  assert.equal(guide.imageUrl, "/cities/ch/genf.jpg");
  assert.ok(guide.imageAttribution.title, "an image needs a usable attribution title");
  assert.ok(guide.imageAttribution.creator, "an image needs its creator");
});

test("the proxy routes every CH studio city to the market renderer", async () => {
  const { resolveMarketRequest } = await loadMarkets();
  const { getTattooStudioCities } = await loadStudioGuides();

  for (const city of getTattooStudioCities("ch")) {
    assert.deepEqual(
      resolveMarketRequest(`/ch/tattoo-studios/${city.slug}`),
      { action: "market-content", market: "ch", pathname: `/market-tattoo-studios/ch/${city.slug}` },
      `${city.slug} has a guide, so the proxy must route it`,
    );
  }
});

test("the CH market covers the ten largest cities with their own guide", async () => {
  const { getLargestTattooStudioCities } = await loadStudioGuides();
  const cities = getLargestTattooStudioCities("ch");

  assert.equal(cities.length, 10);
  for (const city of cities) {
    assert.equal(city.hasCityGuide, true, `${city.slug} must have a studio city guide`);
    assert.equal(city.href, `/tattoo-studios/${city.slug}`);
  }
});

test("every CH city guide carries a substantial, city-specific editorial body", async () => {
  const { getTattooStudioCities } = await loadStudioGuides();
  const scenes = new Map();

  for (const city of getTattooStudioCities("ch")) {
    assert.ok(
      city.editorialHtml.includes(city.cityName),
      `${city.slug} must name its own city in the body`,
    );
    assert.match(
      city.editorialHtml,
      new RegExp(`href="/tattoo-singles/${city.slug}"`),
      `${city.slug} must link its own singles page from the body`,
    );

    // Near-duplicate city pages compete with each other, so the part that
    // describes the city itself has to differ between guides.
    // Zürich predates this template: it is deliberately kept short (see
    // tests/tattoo-studio-guide.test.mjs) and is checked there instead.
    const scene = city.editorialHtml.split(`<h2>Tattoo-Szene in ${city.cityName}</h2>`)[1]?.split("<h2>")[0];
    if (!scene) continue;
    assert.ok(city.editorialHtml.length > 2500, `${city.slug} needs real substance`);
    assert.ok(scene.length > 400, `${city.slug} needs a substantial scene section`);
    assert.equal(scenes.has(scene), false, `${city.slug} repeats ${scenes.get(scene)}'s scene text`);
    scenes.set(scene, city.slug);
  }

  assert.ok(scenes.size >= 8, `expected the new template on at least 8 cities, saw ${scenes.size}`);
});

test("the CH studio overview links Genf to its guide instead of the singles page", async () => {
  const { getLargestTattooStudioCities } = await loadStudioGuides();
  const genf = getLargestTattooStudioCities("ch").find((city) => city.slug === "genf");

  assert.ok(genf, "Genf must stay part of the largest CH cities");
  assert.equal(genf.hasCityGuide, true);
  assert.equal(genf.href, "/tattoo-studios/genf");
});
