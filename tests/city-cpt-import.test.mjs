import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCityRecord,
  buildWpPayload,
  normalizeCityIdentity,
  planUpserts,
} from "../scripts/city-cpt-import-lib.mjs";
import { loadCityManifest, resolvePublicImagePath } from "../scripts/city-cpt-import-sources.mjs";
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

test("planUpserts rejects duplicate existing WordPress identities", () => {
  const record = buildCityRecord(rawCity);
  const existing = [
    { id: 9, slug: "ch-zuerich", acf: { city_id: "CH:zuerich" } },
    { id: 10, slug: "legacy-zuerich", acf: { city_id: "CH:zuerich" } },
  ];
  assert.throws(() => planUpserts([record], existing), /Multiple existing posts for CH:zuerich/);
});

test("resolvePublicImagePath confines repository image references to public image files", () => {
  const root = "C:/safe-repo";
  assert.match(resolvePublicImagePath(root, "/cities/ch/zuerich.jpg"), /public[\\/]cities[\\/]ch[\\/]zuerich\.jpg$/);
  assert.throws(() => resolvePublicImagePath(root, "../../.env"), /Unsafe public image path/);
});

test("loadCityManifest can scope to Austrian records without fetching German sources", async () => {
  const records = await loadCityManifest({
    fetchImpl: async () => { throw new Error("DE fetch should not run"); },
    rootDir: new URL("..", import.meta.url),
    markets: ["AT"],
  });

  assert.equal(records.length, 10);
  assert.ok(records.every((record) => record.country === "AT"));
  assert.deepEqual(new Set(records.map((record) => record.identity)).size, 10);
});

test("loadCityManifest inventories all 16 German, 10 Swiss, and 10 Austrian cities", async () => {
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

  assert.equal(records.length, 36);
  assert.equal(records.filter((record) => record.country === "DE").length, 16);
  assert.equal(records.filter((record) => record.country === "CH").length, 10);
  assert.equal(records.filter((record) => record.country === "AT").length, 10);
  assert.equal(new Set(records.map((record) => record.identity)).size, 36);
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
    noop: 0,
    written: 0,
    verified: 0,
    records: [{ identity: "CH:zuerich", action: "create", postId: null }],
  });
});

test("runCityImport apply skips a fully unchanged existing city", async () => {
  const record = buildCityRecord(rawCity);
  const payload = buildWpPayload(record, { status: "publish", mediaId: 321 });
  const existing = {
    id: 42,
    ...payload,
    title: { raw: payload.title },
    content: { raw: payload.content },
    excerpt: { raw: payload.excerpt },
  };
  const methods = [];
  const fetchImpl = async (_url, options = {}) => {
    methods.push(options.method || "GET");
    return Response.json([existing]);
  };

  const summary = await runCityImport({
    records: [record],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "user", password: "app-pass" },
    apply: true,
    mediaResolver: async () => 321,
  });

  assert.deepEqual(methods, ["GET", "GET"]);
  assert.deepEqual(summary, {
    mode: "apply",
    total: 1,
    create: 0,
    update: 0,
    noop: 1,
    written: 0,
    verified: 1,
    idempotent: true,
    records: [{ identity: "CH:zuerich", action: "noop", postId: 42 }],
  });
});

test("runCityImport rejects incomplete ACF read-back", async () => {
  const record = buildCityRecord(rawCity);
  let stored = null;
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || "GET";
    const pathname = new URL(url).pathname;
    if (method === "POST") {
      stored = { id: 42, ...JSON.parse(options.body) };
      return Response.json({ id: 42 });
    }
    if (pathname.endsWith("/stadt/42")) {
      const acf = { ...stored.acf };
      delete acf.primary_cta_url;
      return Response.json({
        ...stored,
        acf,
        title: { raw: stored.title },
        content: { raw: stored.content },
        excerpt: { raw: stored.excerpt },
      });
    }
    return Response.json([]);
  };

  await assert.rejects(
    runCityImport({
      records: [record],
      fetchImpl,
      baseUrl: "https://cms.example/wp-json/wp/v2",
      auth: { username: "user", password: "app-pass" },
      apply: true,
      mediaResolver: async () => 321,
    }),
    /Read-back verification failed.*acf\.primary_cta_url/,
  );
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
    noop: 0,
    written: 1,
    verified: 1,
    idempotent: true,
    records: [{ identity: "CH:zuerich", action: "create", postId: 42 }],
  });
});

test("resolveCityMedia reuses a fully verified existing media item without writes", async () => {
  const calls = [];
  const client = {
    async json(path, options = {}) {
      calls.push(options.method || "GET");
      if (path.startsWith("media?")) {
        return [{
          id: 9,
          slug: "dms-city-ch-zuerich",
          source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg",
          title: { raw: "Zürich · Dich mit Stich Tattoo-Singles" },
          alt_text: "Tattoo-Singles in Zürich",
          caption: { raw: "Foto von Pexels auf Pixabay" },
          description: { raw: "Bildquelle: https://example.com/zuerich-image" },
        }];
      }
      throw new Error(`Unexpected client call ${path}`);
    },
  };

  assert.equal(await resolveCityMedia(buildCityRecord(rawCity), client), 9);
  assert.deepEqual(calls, ["GET"]);
});

test("resolveCityMedia rejects an existing media slug collision", async () => {
  const client = {
    async json(path) {
      if (path.startsWith("media?")) {
        return [{ id: 9, slug: "dms-city-ch-zuerich", source_url: "https://cms.example/uploads/unrelated.jpg" }];
      }
      throw new Error(`Unexpected client call ${path}`);
    },
  };

  await assert.rejects(
    resolveCityMedia(buildCityRecord(rawCity), client),
    /Media slug collision for CH:zuerich/,
  );
});

test("resolveCityMedia rejects non-image bytes before upload", async () => {
  let uploaded = false;
  const client = {
    async json(path) {
      if (path.startsWith("media?")) return [];
      throw new Error(`Unexpected client call ${path}`);
    },
    async raw() {
      uploaded = true;
      return { id: 1 };
    },
  };

  await assert.rejects(
    resolveCityMedia(buildCityRecord(rawCity), client, {
      readFileImpl: async () => Buffer.from("not an image"),
    }),
    /Invalid JPEG image data/,
  );
  assert.equal(uploaded, false);
});

test("resolveCityMedia rejects incomplete media metadata persistence", async () => {
  const record = buildCityRecord(rawCity);
  const client = {
    async json(path, options = {}) {
      if (path.startsWith("media?")) return [];
      if (path === "media/77" && options.method === "POST") return { id: 77 };
      if (path.startsWith("media/77?")) {
        return {
          id: 77,
          slug: "dms-city-ch-zuerich",
          source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg",
          title: { raw: "Wrong" },
          alt_text: "Wrong",
          caption: { raw: "Wrong" },
          description: { raw: "Wrong" },
        };
      }
      throw new Error(`Unexpected client call ${path}`);
    },
    async raw() { return { id: 77 }; },
  };

  await assert.rejects(
    resolveCityMedia(record, client, {
      readFileImpl: async () => Buffer.from([0xff, 0xd8, 0xff, 1]),
    }),
    /Media read-back verification failed.*title.*alt_text.*caption.*description/,
  );
});

test("resolveCityMedia uploads a missing image once and verifies its media record", async () => {
  const calls = [];
  const client = {
    async json(path, options = {}) {
      calls.push({ kind: "json", path, method: options.method || "GET" });
      if (path.startsWith("media?")) return [];
      if (path === "media/77" && options.method === "POST") return { id: 77 };
      if (path.startsWith("media/77?")) {
        return {
          id: 77,
          slug: "dms-city-ch-zuerich",
          source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg",
          title: { raw: "Zürich · Dich mit Stich Tattoo-Singles" },
          alt_text: "Tattoo-Singles in Zürich",
          caption: { raw: "Foto von Pexels auf Pixabay" },
          description: { raw: "Bildquelle: https://example.com/zuerich-image" },
        };
      }
      throw new Error(`Unexpected client call ${path}`);
    },
    async raw(path, options) {
      calls.push({ kind: "raw", path, method: options.method });
      assert.equal(path, "media");
      assert.equal(options.headers["Content-Disposition"], 'attachment; filename="dms-city-ch-zuerich.jpg"');
      assert.deepEqual(options.body, Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]));
      return { id: 77, source_url: "https://cms.example/uploads/dms-city-ch-zuerich.jpg" };
    },
  };

  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]);
  const mediaId = await resolveCityMedia(buildCityRecord(rawCity), client, {
    readFileImpl: async () => jpeg,
  });

  assert.equal(mediaId, 77);
  assert.deepEqual(calls.map(({ kind, method }) => `${kind}:${method}`), [
    "json:GET",
    "raw:POST",
    "json:POST",
    "json:GET",
  ]);
});
