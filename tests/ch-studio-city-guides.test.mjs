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

test("a CH city guide without researched studios stays a rollout draft", async () => {
  const { getTattooStudioCityGuide, isIndexableTattooStudioCity } = await loadStudioGuides();
  const guide = getTattooStudioCityGuide("ch", "genf");

  assert.equal(guide.publicationStatus, "rollout");
  assert.deepEqual(guide.studios, [], "a rollout guide must not publish unverified studio records");
  assert.equal(isIndexableTattooStudioCity("ch", "genf"), false);
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

test("the proxy routes the new CH studio city to the market renderer", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/ch/tattoo-studios/genf"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-studios/ch/genf",
  });
});

test("the CH studio overview links Genf to its guide instead of the singles page", async () => {
  const { getLargestTattooStudioCities } = await loadStudioGuides();
  const genf = getLargestTattooStudioCities("ch").find((city) => city.slug === "genf");

  assert.ok(genf, "Genf must stay part of the largest CH cities");
  assert.equal(genf.hasCityGuide, true);
  assert.equal(genf.href, "/tattoo-studios/genf");
});
