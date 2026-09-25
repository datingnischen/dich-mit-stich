import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

function assertCredentialFreeHttpsUrl(value, label) {
  const parsed = new URL(value);
  assert.equal(parsed.protocol, "https:", `${label} must use HTTPS`);
  assert.ok(parsed.hostname, `${label} must include a host`);
  assert.equal(parsed.username, "", `${label} must not embed a username`);
  assert.equal(parsed.password, "", `${label} must not embed a password`);
}

test("Innsbruck guide fills the missing Austrian top-ten city with official studio sources", async () => {
  const manifest = JSON.parse(await readFile(new URL("data/tattoo-studio-guide-innsbruck.json", root), "utf8"));

  assert.equal(manifest.guide.identity, "AT:innsbruck");
  assert.equal(manifest.guide.cityName, "Innsbruck");
  assert.equal(manifest.guide.imageUrl, "/cities/at/innsbruck.jpg");
  assert.equal(manifest.guide.imageAttribution.sourceUrl, "https://pixabay.com/de/photos/stadtbild-stadt-innsbruck-7361396/");
  assert.ok(manifest.studios.length >= 5);
  assert.equal(manifest.guide.studios.length, manifest.studios.length);
  assert.deepEqual(manifest.studios.map((studio) => studio.name), [
    "Black Rose Tattoo Studio",
    "Datura Tattoo & Piercing",
    "Inky and the Pain",
    "Inn the City Ink",
    "Kingz Ink",
  ]);
  assert.doesNotMatch(manifest.guide.title, /stil/i);
  assert.doesNotMatch(manifest.guide.editorialHtml, /\/magazin\/tattoo-studio|im gewünschten Stil/i);
  assert.doesNotMatch(manifest.guide.selectionMethodHtml, /Stilhinweise/i);

  for (const studio of manifest.studios) {
    assert.equal(studio.cityIdentity, "AT:innsbruck");
    assert.equal(studio.citySlug, "innsbruck");
    assert.equal(studio.cityName, "Innsbruck");
    assertCredentialFreeHttpsUrl(studio.websiteUrl, `${studio.identity} website`);
    assertCredentialFreeHttpsUrl(studio.sourceUrl, `${studio.identity} source`);
    assert.match(studio.address, /^.+\s\d+[^,]*,\s*6020 Innsbruck$/);
    assert.doesNotMatch(`${studio.name} ${studio.description}`, /\b(?:beste|besten|top|ranking|sterne|bewertung|beliebt|renommiert)\b/i);
    assert.equal(studio.acf.editorial_summary, studio.description);
    assert.deepEqual(studio.acf.tattoo_styles, []);
    assert.doesNotMatch(studio.description, /fineline|realistic|blackwork|cover-up|pigmentierung|hygienestandard|stilrichtung/i);
    assert.equal(studio.acf.last_verified, "2026-09-17");
  }
});

test("Wien pilot manifest contains a conservative official-source studio slice", async () => {
  const manifest = JSON.parse(await readFile(new URL("data/tattoo-studio-guide-wien.json", root), "utf8"));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.guide.identity, "AT:wien");
  assert.equal(manifest.guide.market, "at");
  assert.equal(manifest.guide.country, "AT");
  assert.equal(manifest.guide.citySlug, "wien");
  assert.equal(manifest.guide.cityName, "Wien");
  assert.equal(manifest.guide.imageUrl, "/cities/at/wien.jpg");
  assert.equal(manifest.guide.imageAttribution.sourceUrl, "https://pixabay.com/de/photos/schloss-belvedere-wien-architektur-2003867/");
  assert.match(manifest.guide.selectionMethodHtml, /keine Rangliste/i);
  assertCredentialFreeHttpsUrl(manifest.guide.sourceUrl, "guide source");

  assert.ok(manifest.studios.length >= 6 && manifest.studios.length <= 10);
  assert.equal(new Set(manifest.studios.map((studio) => studio.identity)).size, manifest.studios.length);
  assert.equal(new Set(manifest.studios.map((studio) => studio.slug)).size, manifest.studios.length);
  assert.ok(manifest.studios.some((studio) => studio.slug === "dots-and-daggers-tattoo-wien"));
  assert.equal(manifest.studios.some((studio) => studio.slug === "cristi-mero-tattoo-wien"), false);
  assert.equal(
    manifest.studios.find((studio) => studio.slug === "dots-and-daggers-tattoo-wien")?.address,
    "Leibenfrostgasse 8, 1040 Wien",
  );

  for (const studio of manifest.studios) {
    assert.equal(studio.market, "at");
    assert.equal(studio.country, "AT");
    assert.equal(studio.cityIdentity, "AT:wien");
    assert.equal(studio.citySlug, "wien");
    assert.equal(studio.cityName, "Wien");
    assert.ok(studio.name && studio.address && studio.description);
    assertCredentialFreeHttpsUrl(studio.websiteUrl, `${studio.identity} website`);
    assertCredentialFreeHttpsUrl(studio.sourceUrl, `${studio.identity} source`);
    assert.doesNotMatch(`${studio.name} ${studio.description}`, /\b(?:beste|besten|top|ranking|sterne|bewertung|beliebt|renommiert)\b/i);
    assert.equal(studio.contentHtml, `<p>${studio.description.replaceAll("&", "&amp;")}</p>`);
    assert.equal(studio.acf.editorial_summary, studio.description);
  }
});

test("VOM SCHEITEL BIS ZUR SOHLE does not expose artist styles as studio-wide tags", async () => {
  const manifest = JSON.parse(await readFile(new URL("data/tattoo-studio-guide-wien.json", root), "utf8"));
  const slug = "vom-scheitel-bis-zur-sohle-wien";
  const guideStudio = manifest.guide.studios.find((studio) => studio.slug === slug);
  const studio = manifest.studios.find((entry) => entry.slug === slug);

  assert.ok(guideStudio);
  assert.ok(studio);
  assert.match(guideStudio.description, /Artist-Profile/);
  assert.deepEqual(guideStudio.styles, []);
  assert.deepEqual(studio.styles, []);
  assert.deepEqual(studio.acf.tattoo_styles, []);
});

test("AT studio guide routes share the market-aware renderers and remain noindex follow", async () => {
  const [overview, city, cityLayout, studio, studioLayout, sharedCity] = await Promise.all([
    readFile(new URL("app/market-tattoo-studios/[market]/page.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studios/[market]/[city]/page.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studios/[market]/layout.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studio/[market]/[slug]/page.tsx", root), "utf8"),
    readFile(new URL("app/market-tattoo-studio/[market]/layout.tsx", root), "utf8"),
    readFile(new URL("components/tattoo-studio-city-guide.tsx", root), "utf8"),
  ]);

  // Overview and city pages follow the published studio data: a city guide that
  // carries verified studios is publishable, a rollout draft stays out of the index.
  assert.match(overview, /index:\s*getIndexableTattooStudioCities\(market\)\.length\s*>\s*0/);
  assert.match(city, /index:\s*isIndexableTattooStudioCity\(market,\s*city\)/);
  // Individual studio detail pages remain noindex until they are reviewed separately.
  assert.match(studio, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);

  for (const source of [overview, city, studio]) {
    assert.doesNotMatch(source, /vercel\.app/);
  }
  for (const source of [overview, city, cityLayout, studio, studioLayout]) {
    assert.match(source, /isTattooStudioMarket/);
  }
  assert.match(overview, /publicUrl\(market, "\/tattoo-studios"\)/);
  assert.match(city, /publicUrl\(market, `\/tattoo-studios\/\$\{city\}`\)/);
  assert.match(studio, /publicUrl\(market, `\/tattoo-studio\/\$\{slug\}`\)/);
  assert.match(city, /<TattooStudioCityGuide guide=\{guide\} market=\{market\}/);
  assert.match(studio, /<TattooStudioDetail studio=\{studio\} city=\{city\} market=\{market\}/);
  assert.match(cityLayout, /<SiteFrame market=\{market\} sectionLive aid="location" stickyCta>/);
  assert.match(studioLayout, /<SiteFrame market=\{market\} sectionLive aid="location" stickyCta>/);
  assert.match(sharedCity, /market === "at" \? "Österreichischer "/);
  assert.match(sharedCity, /guide\.imageUrl \? staticAsset\(guide\.imageUrl\)/);
});

test("shared tattoo studio loader isolates and resolves the five standalone Austrian city guides", async () => {
  const { getIndexableTattooStudioCities, getTattooStudioCities, getTattooStudioSlugs } = await import("../lib/tattoo-studio-guide.ts");
  const standalone = new Set(["graz", "innsbruck", "linz", "salzburg", "wien"]);
  const cities = getIndexableTattooStudioCities("at").filter((city) => standalone.has(city.slug));
  const expected = [
    ["graz", "Graz", "/cities/at/graz.jpg"],
    ["innsbruck", "Innsbruck", "/cities/at/innsbruck.jpg"],
    ["linz", "Linz", "/cities/at/linz.jpg"],
    ["salzburg", "Salzburg", "/cities/at/salzburg.jpg"],
    ["wien", "Wien", "/cities/at/wien.jpg"],
  ];

  assert.equal(cities.length, expected.length);
  assert.deepEqual(cities.map((city) => city.slug), expected.map(([slug]) => slug));
  for (const [slug, cityName, imageUrl] of expected) {
    const manifest = JSON.parse(await readFile(new URL(`data/tattoo-studio-guide-${slug}.json`, root), "utf8"));
    const city = cities.find((entry) => entry.slug === slug);
    assert.ok(city, slug);
    assert.equal(city.identity, `AT:${slug}`);
    assert.equal(city.cityName, cityName);
    assert.equal(city.imageUrl, imageUrl);
    assert.ok(city.imageAttribution?.sourceUrl, `${slug} image source`);
    assert.ok(city.studios.length >= 5, `${slug} studio minimum`);
    assert.equal(manifest.guide.studios.length, manifest.studios.length);
    assert.deepEqual(
      manifest.guide.studios,
      manifest.studios.map((studio) => Object.fromEntries(
        Object.entries(studio).filter(([key]) => !["contentHtml", "acf", "wpSlug", "title"].includes(key)),
      )),
    );
    for (const studio of manifest.studios) {
      assert.ok(studio.slug.endsWith(`-${slug}`), `${studio.identity} city suffix`);
      assert.equal(studio.cityIdentity, `AT:${slug}`);
      assert.equal(studio.citySlug, slug);
      assert.equal(studio.cityName, cityName);
      assertCredentialFreeHttpsUrl(studio.websiteUrl, `${studio.identity} website`);
      assertCredentialFreeHttpsUrl(studio.sourceUrl, `${studio.identity} source`);
      assert.doesNotMatch(`${studio.name} ${studio.description}`, /\b(?:beste|besten|top|ranking|sterne|bewertung|beliebt|renommiert)\b/i);
      assert.equal(studio.contentHtml, `<p>${studio.description.replaceAll("&", "&amp;")}</p>`);
      assert.equal(studio.acf.editorial_summary, studio.description);
    }
  }
  assert.equal(
    new Set(getTattooStudioSlugs("at")).size,
    getIndexableTattooStudioCities("at").reduce((sum, city) => sum + city.studios.length, 0),
  );
  assert.equal(getTattooStudioCities("ch").some((city) => city.market === "at"), false);
  assert.equal(getTattooStudioCities("at").every((city) => city.market === "at"), true);
});

const FORMER_ROLLOUT_CITIES = [
  ["dornbirn", "Dornbirn", "6850 Dornbirn", 2],
  ["klagenfurt", "Klagenfurt", "9020 Klagenfurt", 6],
  ["sankt-poelten", "Sankt Pölten", "3100 St. Pölten", 1],
  ["villach", "Villach", "9500 Villach", 5],
  ["wels", "Wels", "4600 Wels", 4],
  ["wiener-neustadt", "Wiener Neustadt", "2700 Wiener Neustadt", 5],
];
const GUIDE_SECTIONS = (cityName) => [
  "Einleitung",
  `Tattoo-Szene in ${cityName}`,
  `Beliebte Tattoo-Stile in ${cityName}`,
  `Worauf bei der Studioauswahl in ${cityName} geachtet werden sollte`,
  "Kurze Zusammenfassung",
];

test("the six former Austrian rollout cities publish studios checked against their own websites", async () => {
  const { getIndexableTattooStudioCities, getTattooStudioCities, hasCompleteStreetAddress } = await import("../lib/tattoo-studio-guide.ts");
  const cities = getTattooStudioCities("at");
  const indexable = new Set(getIndexableTattooStudioCities("at").map((city) => city.slug));
  const scenes = new Map();

  // No Austrian city guide is left in the rollout state, so none renders an empty studio list.
  assert.equal(cities.every((city) => city.publicationStatus === "verified" && city.studios.length > 0), true);
  for (const [slug, cityName, postalCity, studioCount] of FORMER_ROLLOUT_CITIES) {
    const city = cities.find((entry) => entry.slug === slug);
    assert.ok(city, slug);
    assert.equal(city.identity, `AT:${slug}`);
    assert.equal(city.cityName, cityName);
    assert.equal(city.publicationStatus, "verified");
    assert.equal(city.studios.length, studioCount, `${slug} studio count`);
    assert.equal(indexable.has(slug), true, `${slug} must be indexable`);
    assert.equal(city.imageUrl, `/cities/at/${slug}.jpg`);
    assert.ok(city.imageAttribution?.sourceUrl, `${slug} image source`);
    assert.doesNotMatch(city.title, /Vorbereitung/);

    for (const heading of GUIDE_SECTIONS(cityName)) {
      assert.ok(city.editorialHtml.includes(`<h2>${heading}</h2>`), `${slug} needs the section "${heading}"`);
    }
    assert.match(city.editorialHtml, new RegExp(`href="/tattoo-singles/${slug}"`));
    // The AT market has no magazine yet, so a relative magazine link would 404.
    assert.doesNotMatch(city.editorialHtml, /\/magazin\//);
    assert.match(city.selectionMethodHtml, /25\. September 2026/);
    const scene = city.editorialHtml.split(`<h2>Tattoo-Szene in ${cityName}</h2>`)[1].split("<h2>")[0];
    assert.ok(scene.length > 400, `${slug} needs a substantial scene section`);
    assert.equal(scenes.has(scene), false, `${slug} repeats ${scenes.get(scene)}'s scene text`);
    scenes.set(scene, slug);

    for (const studio of city.studios) {
      assert.ok(studio.slug.endsWith(`-${slug}`), `${studio.identity} city suffix`);
      assert.ok(hasCompleteStreetAddress(studio.address), `${studio.name}: ${studio.address}`);
      assert.ok(studio.address.includes(postalCity), `${studio.name} must sit in ${cityName}`);
      assertCredentialFreeHttpsUrl(studio.websiteUrl, `${studio.identity} website`);
      assertCredentialFreeHttpsUrl(studio.sourceUrl, `${studio.identity} source`);
      assert.doesNotMatch(`${studio.name} ${studio.description}`, /(?:beste|besten|top|ranking|sterne|bewertung|beliebt|renommiert)/i);
      assert.equal(studio.lastVerified, "2026-09-25");
      assert.deepEqual(studio.styles, []);
    }
  }
});

test("AT robots lets crawlers read noindex on the public tattoo routes", async () => {
  const marketRobots = await readFile(new URL("app/market-robots/[market]/route.ts", root), "utf8");

  assert.match(marketRobots, /"Allow: \/tattoo-singles"/);
  assert.match(marketRobots, /"Allow: \/tattoo-studios"/);
  assert.match(marketRobots, /"Allow: \/tattoo-studio\/"/);
  assert.doesNotMatch(marketRobots, /market === "ch"[\s\S]*Allow: \/tattoo-studios/);
});

test("market overview uses city-guide copy instead of pilot-only language", async () => {
  const overview = await readFile(new URL("app/market-tattoo-studios/[market]/page.tsx", root), "utf8");

  assert.match(overview, /href="#stadtguides">Stadtguides ansehen/);
  assert.match(overview, /Studio-Guides nach Stadt/);
  assert.doesNotMatch(overview, /Pilot ansehen|Start mit|· PILOT/);
  // A rollout city has no studios yet, so the card must not advertise "0 Studios".
  assert.match(overview, /city\.publicationStatus === "verified"[\s\S]*?"Tipps für deine Studiosuche"/);
  assert.match(overview, /city\.publicationStatus === "verified"[\s\S]*?Guide für \$\{city\.cityName\} öffnen/);
  assert.doesNotMatch(overview, /<small>\{city\.studios\.length\} Studios/);
});

test("structured address validation accepts units and floors but rejects incomplete locations", async () => {
  const { hasCompleteStreetAddress } = await import("../lib/tattoo-studio-guide.ts");

  for (const address of [
    "Paulanergasse 14, 2. Stock, 1040 Wien",
    "Prager Straße 14/2/6, 1210 Wien",
    "Hildmannplatz 6/Top 2, 5020 Salzburg",
    "Leibenfrostgasse 8, 1040 Wien",
    "10. Oktober Straße 26A, 9020 Klagenfurt",
    "Neugasse 21/4a, 3100 St. Pölten",
  ]) {
    assert.equal(hasCompleteStreetAddress(address), true, address);
  }
  for (const address of ["Wien", "2. Stock, 1040 Wien", "1040 Wien"]) {
    assert.equal(hasCompleteStreetAddress(address), false, address);
  }
});
