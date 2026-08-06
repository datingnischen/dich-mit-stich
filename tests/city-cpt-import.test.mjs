import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCityRecord,
  buildWpPayload,
  normalizeCityIdentity,
  planUpserts,
} from "../scripts/city-cpt-import-lib.mjs";
import { loadCityManifest } from "../scripts/city-cpt-import-sources.mjs";
import { runCityImport } from "../scripts/city-cpt-import-wordpress.mjs";
import { resolveCityMedia } from "../scripts/city-cpt-import-media.mjs";

const rawCity = {
  market: "ch",
  slug: "zuerich",
  cityName: "Zürich",
  title: "Tattoo-Singles in Zürich",
  metaDescription: "Tätowierte Singles in Zürich kennenlernen.",
  h1: "Tattoo-Singles in Zürich",
  heroTitle: "Finde Singles in Zürich und Umgebung",
  contentHtml: "<p>Zürich verbindet kreative Tattoo-Kultur mit urbanem Leben.</p><h2>Studios</h2>",
  registrationUrl: "https://dich-mit-stich.ch/registration/",
  sourceUrl: "https://dich-mit-stich.ch/tattoo-singles/zuerich/",
  imagePath: "public/cities/ch/zuerich.jpg",
  imageAttribution: {
    label: "Foto von Pexels auf Pixabay",
    sourceUrl: "https://example.com/zuerich-image",
    creator: "Pexels",
    publisher: "Pixabay",
    license: "Pixabay Content License",
    licenseUrl: "https://pixabay.com/service/license-summary/",
  },
};

test("normalizeCityIdentity uppercases only the market segment", () => {
  assert.equal(normalizeCityIdentity("de:Berlin"), "DE:berlin");
  assert.equal(normalizeCityIdentity("CH:St-Gallen"), "CH:st-gallen");
});

test("buildCityRecord creates a market-scoped WordPress identity and city ACF mapping", () => {
  const record = buildCityRecord(rawCity);

  assert.equal(record.identity, "CH:zuerich");
  assert.equal(record.wpSlug, "ch-zuerich");
  assert.equal(record.acf.city_id, "CH:zuerich");
  assert.equal(record.acf.template_variant, "city");
  assert.equal(record.acf.city_name, "Zürich");
  assert.equal(record.acf.city_country, "CH");
  assert.equal(record.acf.city_region, "Zürich");
  assert.equal(record.acf.schema_type, "auto");
  assert.equal(record.acf.primary_cta_url, rawCity.registrationUrl);
  assert.match(record.acf.intro_highlight, /Zürich verbindet/);
  assert.deepEqual(record.acf.sources.map((source) => source.url), [
    rawCity.sourceUrl,
    rawCity.imageAttribution.sourceUrl,
    rawCity.imageAttribution.licenseUrl,
  ]);
  assert.equal(record.acf.sources[1].title, "Foto von Pexels auf Pixabay");
  assert.equal(record.acf.sources[1].publisher, "Pixabay");
  assert.match(record.acf.sources[1].note, /Urheber: Pexels/);
  assert.equal(record.acf.sources[2].title, "Pixabay Content License");
  assert.equal(record.acf.sources[2].publisher, "Pixabay");
});

test("buildWpPayload keeps public HTML and adds a resolved media ID", () => {
  const record = buildCityRecord(rawCity);
  const payload = buildWpPayload(record, { status: "publish", mediaId: 321 });

  assert.equal(payload.slug, "ch-zuerich");
  assert.equal(payload.status, "publish");
  assert.equal(payload.content, rawCity.contentHtml);
  assert.equal(payload.featured_media, 321);
  assert.equal(payload.acf.hero_image, 321);
});

test("planUpserts updates by city_id before slug and never creates duplicates", () => {
  const records = [
    buildCityRecord(rawCity),
    buildCityRecord({ ...rawCity, market: "de", slug: "berlin", cityName: "Berlin" }),
  ];
  const existing = [
    { id: 9, slug: "legacy-zuerich", acf: { city_id: "CH:zuerich" } },
    { id: 10, slug: "de-berlin", acf: {} },
  ];

  assert.deepEqual(
    planUpserts(records, existing).map(({ action, postId }) => ({ action, postId })),
    [
      { action: "update", postId: 9 },
      { action: "update", postId: 10 },
    ],
  );
});

test("planUpserts rejects duplicate market and slug identities", () => {
  const record = buildCityRecord(rawCity);
  assert.throws(() => planUpserts([record, record], []), /Duplicate city identity CH:zuerich/);
});

test("loadCityManifest inventories all 16 German and 10 Swiss cities", async () => {
  const fakeFetch = async (url) => {
    const slug = new URL(url).pathname.split("/").filter(Boolean).at(-1);
    return {
      ok: true,
      text: async () => `
        <html><head><title>Tattoo-Singles ${slug}</title><meta name="description" content="Singles in ${slug}"></head>
        <body><h1>Tattoo-Singles ${slug}</h1><h2 class="h2 semibold">Finde Singles in ${slug}</h2>
        <form action="https://dich-mit-stich.de/registration/"></form>
        <div class="text-content m-t-64 m-b-64"><p>Redaktioneller Inhalt für ${slug}.</p></div>
        <div class=""><a href="https://dich-mit-stich.de/registration/">Start</a></div></body></html>`,
    };
  };

  const records = await loadCityManifest({
    fetchImpl: fakeFetch,
    rootDir: new URL("..", import.meta.url),
  });

  assert.equal(records.length, 26);
  assert.equal(records.filter((record) => record.country === "DE").length, 16);
  assert.equal(records.filter((record) => record.country === "CH").length, 10);
  assert.equal(new Set(records.map((record) => record.identity)).size, 26);
  assert.ok(records.every((record) => record.contentHtml.length > 20));
  assert.ok(records.every((record) => record.imagePath || record.imageUrl));
});

test("runCityImport dry-run plans creates without sending writes", async () => {
  const methods = [];
  const fetchImpl = async (_url, options = {}) => {
    methods.push(options.method || "GET");
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const summary = await runCityImport({
    records: [buildCityRecord(rawCity)],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "user", password: "app-pass" },
    apply: false,
  });

  assert.deepEqual(methods, ["GET"]);
  assert.deepEqual(summary, {
    mode: "dry-run",
    total: 1,
    create: 1,
    update: 0,
    written: 0,
    verified: 0,
    records: [{ identity: "CH:zuerich", action: "create", postId: null }],
  });
});

test("runCityImport apply writes, reads back, and proves the record is idempotent", async () => {
  const record = buildCityRecord(rawCity);
  let stored = null;
  const methods = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || "GET";
    methods.push(method);
    const pathname = new URL(url).pathname;

    if (method === "POST") {
      stored = { id: 42, ...JSON.parse(options.body) };
      return Response.json({ id: 42 });
    }
    if (pathname.endsWith("/stadt/42")) {
      return Response.json({
        ...stored,
        title: { raw: stored.title },
        content: { raw: stored.content },
      });
    }
    return Response.json(stored ? [{ ...stored, acf: stored.acf }] : []);
  };

  const summary = await runCityImport({
    records: [record],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "user", password: "app-pass" },
    apply: true,
    status: "publish",
    mediaResolver: async () => 321,
  });

  assert.deepEqual(methods, ["GET", "POST", "GET", "GET"]);
  assert.equal(stored.slug, "ch-zuerich");
  assert.equal(stored.featured_media, 321);
  assert.deepEqual(summary, {
    mode: "apply",
    total: 1,
    create: 1,
    update: 0,
    written: 1,
    verified: 1,
    idempotent: true,
    records: [{ identity: "CH:zuerich", action: "create", postId: 42 }],
  });
});

test("resolveCityMedia uploads a missing image once and verifies its media record", async () => {
  const calls = [];
  const client = {
    async json(path, options = {}) {
      calls.push({ kind: "json", path, method: options.method || "GET" });
      if (path.startsWith("media?")) return [];
      if (path === "media/77" && options.method === "POST") return { id: 77 };
      if (path.startsWith("media/77?")) {
        return { id: 77, slug: "dms-city-ch-zuerich", source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg" };
      }
      throw new Error(`Unexpected client call ${path}`);
    },
    async raw(path, options) {
      calls.push({ kind: "raw", path, method: options.method });
      assert.equal(path, "media");
      assert.equal(options.headers["Content-Disposition"], 'attachment; filename="dms-city-ch-zuerich.jpg"');
      assert.deepEqual(options.body, Buffer.from([1, 2, 3]));
      return { id: 77, source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg" };
    },
  };

  const mediaId = await resolveCityMedia(buildCityRecord(rawCity), client, {
    readFileImpl: async () => Buffer.from([1, 2, 3]),
  });

  assert.equal(mediaId, 77);
  assert.deepEqual(calls.map(({ kind, method }) => `${kind}:${method}`), [
    "json:GET",
    "raw:POST",
    "json:POST",
    "json:GET",
  ]);
});
