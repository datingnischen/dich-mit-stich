import { buildTattooStudioWpPayload, planTattooStudioUpserts } from "./tattoo-studio-import-lib.mjs";

function authHeader(auth) {
  if (!auth?.username || !auth?.password) throw new Error("WordPress credentials are required");
  return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
}

async function readJson(response, label) {
  const text = await response.text();
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function makeClient({ fetchImpl, baseUrl, auth }) {
  const root = baseUrl.replace(/\/$/, "");
  const authorization = authHeader(auth);
  return {
    async json(path, { method = "GET", body } = {}) {
      const response = await fetchImpl(`${root}/${path.replace(/^\//, "")}`, {
        method,
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return readJson(response, `${method} ${path}`);
    },
  };
}

function rawField(value) {
  return value && typeof value === "object" && "raw" in value ? value.raw : value;
}

function normalizeEmpty(value) {
  return value === false || value === undefined || value === null || value === "" ? null : value;
}

function collectMismatches(actual, expected, path, failed) {
  const a = normalizeEmpty(actual);
  const e = normalizeEmpty(expected);
  if (e === null) {
    if (a !== null) failed.push(path);
    return;
  }
  if (Array.isArray(e)) {
    if (!Array.isArray(a) || a.length !== e.length) {
      failed.push(path);
      return;
    }
    e.forEach((value, index) => collectMismatches(a[index], value, `${path}[${index}]`, failed));
    return;
  }
  if (typeof e === "object") {
    if (!a || typeof a !== "object") {
      failed.push(path);
      return;
    }
    for (const [key, value] of Object.entries(e)) collectMismatches(a[key], value, `${path}.${key}`, failed);
    return;
  }
  if (String(a).trim() !== String(e).trim()) failed.push(path);
}

export function findTattooStudioPayloadMismatches(post, payload) {
  const failed = [];
  collectMismatches(post.slug, payload.slug, "slug", failed);
  collectMismatches(post.status, payload.status, "status", failed);
  collectMismatches(rawField(post.title), payload.title, "title", failed);
  collectMismatches(rawField(post.content), payload.content, "content", failed);
  collectMismatches(rawField(post.excerpt), payload.excerpt, "excerpt", failed);
  collectMismatches(post.acf, payload.acf, "acf", failed);
  return failed;
}

function planGuideUpserts(records, existingPosts) {
  const identities = new Set();
  return records.map((record) => {
    if (identities.has(record.identity)) throw new Error(`Duplicate tattoo studio city identity ${record.identity}`);
    identities.add(record.identity);
    const candidates = existingPosts.filter((post) =>
      post?.acf?.guide_city_id === record.identity || post?.slug === record.wpSlug,
    );
    const unique = [...new Map(candidates.map((post) => [Number(post.id), post])).values()];
    if (unique.length > 1) throw new Error(`Multiple existing tattoo studio city guides for ${record.identity}`);
    const existing = unique[0] || null;
    return { action: existing ? "update" : "create", postId: existing?.id ?? null, existing, record };
  });
}

function classify(plan, status) {
  if (!plan.existing) return "create";
  const payload = buildTattooStudioWpPayload(plan.record, { status });
  return findTattooStudioPayloadMismatches(plan.existing, payload).length ? "update" : "noop";
}

function summarize(plans, status) {
  const actions = plans.map((plan) => classify(plan, status));
  return {
    total: plans.length,
    create: actions.filter((action) => action === "create").length,
    update: actions.filter((action) => action === "update").length,
    noop: actions.filter((action) => action === "noop").length,
  };
}

async function loadCollection(client, restBase) {
  return client.json(`${restBase}?context=edit&per_page=100&_fields=id,slug,status,title,content,excerpt,acf`);
}

async function applyPlans({ client, restBase, plans, status }) {
  let written = 0;
  let verified = 0;
  for (const plan of plans) {
    const payload = buildTattooStudioWpPayload(plan.record, { status });
    if (plan.existing && findTattooStudioPayloadMismatches(plan.existing, payload).length === 0) {
      verified += 1;
      continue;
    }
    const endpoint = plan.postId ? `${restBase}/${plan.postId}` : restBase;
    const result = await client.json(endpoint, { method: "POST", body: payload });
    const postId = Number(result?.id || plan.postId);
    if (!postId) throw new Error(`WordPress did not return an ID for ${plan.record.identity}`);
    written += 1;
    const readback = await client.json(
      `${restBase}/${postId}?context=edit&_fields=id,slug,status,title,content,excerpt,acf`,
    );
    const failed = findTattooStudioPayloadMismatches(readback, payload);
    if (failed.length) throw new Error(`Read-back verification failed for ${plan.record.identity}: ${failed.join(", ")}`);
    verified += 1;
  }
  return { written, verified };
}

export async function runTattooStudioImport({
  guideRecords,
  studioRecords,
  fetchImpl = fetch,
  baseUrl,
  auth,
  apply = false,
  status = "draft",
}) {
  if (!baseUrl?.startsWith("https://")) throw new Error("Tattoo studio WordPress base URL must use HTTPS");
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
    throw new Error("Refusing tattoo studio import while trusted TLS is disabled");
  }
  const client = makeClient({ fetchImpl, baseUrl, auth });
  const existingGuides = await loadCollection(client, "tattoo-studio-cities");
  const existingStudios = await loadCollection(client, "tattoo-studios");
  const guidePlans = planGuideUpserts(guideRecords, existingGuides);
  const studioPlans = planTattooStudioUpserts(studioRecords, existingStudios);
  const guideSummary = summarize(guidePlans, status);
  const studioSummary = summarize(studioPlans, status);

  if (!apply) {
    return {
      mode: "dry-run",
      guides: guideSummary,
      studios: studioSummary,
      written: 0,
      verified: 0,
      idempotent: false,
    };
  }

  const guideResult = await applyPlans({ client, restBase: "tattoo-studio-cities", plans: guidePlans, status });
  const studioResult = await applyPlans({ client, restBase: "tattoo-studios", plans: studioPlans, status });
  const afterGuides = await loadCollection(client, "tattoo-studio-cities");
  const afterStudios = await loadCollection(client, "tattoo-studios");
  const secondGuidePlans = planGuideUpserts(guideRecords, afterGuides);
  const secondStudioPlans = planTattooStudioUpserts(studioRecords, afterStudios);
  const idempotent = secondGuidePlans.every((plan) => classify(plan, status) === "noop")
    && secondStudioPlans.every((plan) => classify(plan, status) === "noop");
  if (!idempotent) throw new Error("Tattoo studio post-import idempotency verification failed");

  return {
    mode: "apply",
    guides: guideSummary,
    studios: studioSummary,
    written: guideResult.written + studioResult.written,
    verified: guideResult.verified + studioResult.verified,
    idempotent,
  };
}
