import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTattooStudioCityRecord,
  buildTattooStudioRecord,
  buildTattooStudioWpPayload,
  inferTattooStyles,
  planTattooStudioUpserts,
} from "../scripts/tattoo-studio-import-lib.mjs";
import { runTattooStudioImport } from "../scripts/tattoo-studio-import-wordpress.mjs";

const guide = {
  identity: "DE:hannover",
  market: "de",
  country: "DE",
  citySlug: "hannover",
  cityName: "Hannover",
  title: "Tattoo-Studios in Hannover – Die besten Tattoo-Studios finden",
  sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  editorialHtml: "<h2>Tattoo-Szene in Hannover</h2><p>Lokaler Guide.</p>",
  selectionMethodHtml: "<h2>Datenstand</h2><p>Keine bezahlte Platzierung.</p>",
  lastVerified: "2026-06-07",
};

const sourceStudio = {
  identity: "DE:hannover:tats-studio-hannover",
  cityIdentity: "DE:hannover",
  market: "de",
  country: "DE",
  citySlug: "hannover",
  cityName: "Hannover",
  slug: "tats-studio-hannover",
  name: "TATS Studio",
  description: "Inklusives Studio für Fineline, Linework, Realistic, Black and Grey, Traditional, Blackwork und Ornamental.",
  websiteUrl: "https://tats.studio",
  address: "Lindener Marktplatz 3, 30449 Hannover",
  contact: "Telefon und E-Mail",
  sourceUrl: "https://tats.studio",
};

test("buildTattooStudioRecord maps a source studio to the durable ACF contract", () => {
  const record = buildTattooStudioRecord(sourceStudio, guide);

  assert.equal(record.identity, "DE:hannover:tats-studio-hannover");
  assert.equal(record.wpSlug, "de-hannover-tats-studio-hannover");
  assert.equal(record.acf.studio_id, record.identity);
  assert.equal(record.acf.studio_country, "DE");
  assert.equal(record.acf.studio_city, "Hannover");
  assert.equal(record.acf.studio_address, sourceStudio.address);
  assert.equal(record.acf.website_url, sourceStudio.websiteUrl);
  assert.equal(record.acf.last_verified, "2026-06-07");
  assert.equal(record.acf.verification_status, "editorial");
  assert.equal(record.acf.paid_placement, false);
  assert.deepEqual(record.acf.tattoo_styles, [
    "black-and-grey",
    "blackwork",
    "fineline",
    "linework",
    "ornamental",
    "realistic",
    "traditional",
  ]);
});

test("inferTattooStyles does not turn explicitly unavailable styles into filter terms", () => {
  assert.deepEqual(
    inferTattooStyles("Das Studio ist offen für viele Richtungen, weist jedoch darauf hin, dass Maori-Tattoos nicht angeboten werden."),
    [],
  );
});

test("inferTattooStyles keeps positive styles when another style is explicitly unavailable", () => {
  assert.deepEqual(
    inferTattooStyles("Fineline wird angeboten, Maori-Tattoos werden nicht angeboten."),
    ["fineline"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline wird angeboten und Maori-Tattoos werden nicht angeboten."),
    ["fineline"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline offered, Maori not offered."),
    ["fineline"],
  );
});

test("inferTattooStyles propagates leading negation across coordinated style lists", () => {
  assert.deepEqual(
    inferTattooStyles("Keine Fineline- oder Maori-Tattoos werden angeboten."),
    [],
  );
  assert.deepEqual(
    inferTattooStyles("No Fineline or Maori tattoos are offered."),
    [],
  );
});

test("inferTattooStyles limits negation propagation to genuine list connectors", () => {
  assert.deepEqual(
    inferTattooStyles("Fineline wird nicht angeboten und Maori wird angeboten."),
    ["maori"],
  );
  assert.deepEqual(
    inferTattooStyles("Fineline und Maori werden nicht angeboten."),
    [],
  );
  assert.deepEqual(
    inferTattooStyles("Keine Fineline\nMaori wird angeboten."),
    ["maori"],
  );
  assert.deepEqual(
    inferTattooStyles("Keine Fineline - Maori wird angeboten."),
    ["maori"],
  );
});

test("studio records escape descriptive HTML and reject unsafe external URLs", () => {
  const record = buildTattooStudioRecord({
    ...sourceStudio,
    description: "Fineline & <script>alert('x')</script>",
  }, guide);
  assert.equal(record.contentHtml, "<p>Fineline &amp; &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;</p>");

  assert.throws(
    () => buildTattooStudioRecord({
      ...sourceStudio,
      websiteUrl: "javascript:alert(1)",
      sourceUrl: "javascript:alert(1)",
    }, guide),
    /valid HTTPS URL/,
  );
});

test("buildTattooStudioCityRecord keeps city editorial content separate from studios", () => {
  const record = buildTattooStudioCityRecord(guide);

  assert.equal(record.identity, "DE:hannover");
  assert.equal(record.wpSlug, "de-hannover");
  assert.equal(record.acf.guide_city_id, "DE:hannover");
  assert.equal(record.acf.guide_country, "DE");
  assert.equal(record.acf.last_verified, "2026-06-07");
  assert.match(record.contentHtml, /Tattoo-Szene in Hannover/);
  assert.match(record.contentHtml, /Keine bezahlte Platzierung/);
});

test("buildTattooStudioWpPayload and planner produce deterministic create/update identities", () => {
  const record = buildTattooStudioRecord(sourceStudio, guide);
  const payload = buildTattooStudioWpPayload(record, { status: "draft" });
  assert.equal(payload.status, "draft");
  assert.equal(payload.slug, record.wpSlug);
  assert.equal(payload.title, "TATS Studio");
  assert.equal(payload.acf.studio_id, record.identity);

  const create = planTattooStudioUpserts([record], [])[0];
  assert.equal(create.action, "create");

  const update = planTattooStudioUpserts([record], [{ id: 42, slug: record.wpSlug, acf: { studio_id: record.identity } }])[0];
  assert.equal(update.action, "update");
  assert.equal(update.postId, 42);

  assert.throws(
    () => planTattooStudioUpserts([record, record], []),
    /Duplicate tattoo studio identity/,
  );
});


test("runTattooStudioImport dry-run plans one guide and one studio without writes", async () => {
  const methods = [];
  const fetchImpl = async (_url, options = {}) => {
    methods.push(options.method || "GET");
    return Response.json([]);
  };

  const summary = await runTattooStudioImport({
    guideRecords: [buildTattooStudioCityRecord(guide)],
    studioRecords: [buildTattooStudioRecord(sourceStudio, guide)],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "editor", password: "app-pass" },
  });

  assert.deepEqual(methods, ["GET", "GET"]);
  assert.deepEqual(summary, {
    mode: "dry-run",
    guides: { total: 1, create: 1, update: 0, noop: 0 },
    studios: { total: 1, create: 1, update: 0, noop: 0 },
    written: 0,
    verified: 0,
    idempotent: false,
  });
});

test("runTattooStudioImport collects every WordPress REST page before planning", async () => {
  const requested = [];
  const record = buildTattooStudioRecord(sourceStudio, guide);
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const page = Number(parsed.searchParams.get("page") || 1);
    const isStudio = parsed.pathname.endsWith("/tattoo-studios");
    requested.push(`${parsed.pathname}:${page}`);

    if (!isStudio) {
      return Response.json([], { headers: { "X-WP-TotalPages": "1" } });
    }
    if (page === 1) {
      return Response.json(
        Array.from({ length: 100 }, (_, index) => ({
          id: index + 1,
          slug: `unrelated-${index + 1}`,
          acf: { studio_id: `DE:other:unrelated-${index + 1}` },
        })),
        { headers: { "X-WP-TotalPages": "2" } },
      );
    }
    return Response.json(
      [{ id: 501, slug: record.wpSlug, acf: { studio_id: record.identity } }],
      { headers: { "X-WP-TotalPages": "2" } },
    );
  };

  const summary = await runTattooStudioImport({
    guideRecords: [buildTattooStudioCityRecord(guide)],
    studioRecords: [record],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "editor", password: "app-pass" },
  });

  assert.equal(summary.studios.create, 0);
  assert.equal(summary.studios.update, 1);
  assert.ok(requested.some((entry) => entry.endsWith("/tattoo-studios:2")));
});

test("runTattooStudioImport writes, reads back, and proves a stable second plan", async () => {
  const stored = { guides: [], studios: [] };
  let nextId = 100;
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || "GET";
    const path = new URL(url).pathname;
    const isGuide = path.includes("tattoo-studio-cities");
    const collection = isGuide ? stored.guides : stored.studios;
    const base = isGuide ? "tattoo-studio-cities" : "tattoo-studios";

    if (method === "POST") {
      const payload = JSON.parse(options.body);
      const id = ++nextId;
      collection.push({ id, ...payload });
      return Response.json({ id });
    }
    const itemMatch = path.match(new RegExp(`/${base}/(\\d+)$`));
    if (itemMatch) {
      const item = collection.find((entry) => entry.id === Number(itemMatch[1]));
      return Response.json({
        ...item,
        title: { raw: item.title },
        content: { raw: item.content },
        excerpt: { raw: item.excerpt },
      });
    }
    return Response.json(collection);
  };

  const summary = await runTattooStudioImport({
    guideRecords: [buildTattooStudioCityRecord(guide)],
    studioRecords: [buildTattooStudioRecord(sourceStudio, guide)],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "editor", password: "app-pass" },
    apply: true,
    status: "draft",
  });

  assert.equal(stored.guides.length, 1);
  assert.equal(stored.studios.length, 1);
  assert.equal(stored.guides[0].status, "draft");
  assert.equal(stored.studios[0].acf.studio_id, sourceStudio.identity);
  assert.deepEqual(summary, {
    mode: "apply",
    guides: { total: 1, create: 1, update: 0, noop: 0 },
    studios: { total: 1, create: 1, update: 0, noop: 0 },
    written: 2,
    verified: 2,
    idempotent: true,
  });

  const second = await runTattooStudioImport({
    guideRecords: [buildTattooStudioCityRecord(guide)],
    studioRecords: [buildTattooStudioRecord(sourceStudio, guide)],
    fetchImpl,
    baseUrl: "https://cms.example/wp-json/wp/v2",
    auth: { username: "editor", password: "app-pass" },
    apply: true,
    status: "draft",
  });
  assert.equal(second.written, 0);
  assert.equal(second.guides.noop, 1);
  assert.equal(second.studios.noop, 1);
  assert.equal(second.idempotent, true);
});
