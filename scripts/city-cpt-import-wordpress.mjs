import { buildWpPayload, planUpserts } from "./city-cpt-import-lib.mjs";

function authHeader(auth) {
  if (!auth?.username || !auth?.password) throw new Error("WordPress credentials are required");
  return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
}

async function readJson(response, label) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

function makeClient({ fetchImpl, baseUrl, auth }) {
  const root = baseUrl.replace(/\/$/, "");
  const authorization = authHeader(auth);

  return {
    async json(path, { method = "GET", body, headers = {} } = {}) {
      const response = await fetchImpl(`${root}/${path.replace(/^\//, "")}`, {
        method,
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return readJson(response, `${method} ${path}`);
    },
    async raw(path, { method = "GET", body, headers = {} } = {}) {
      const response = await fetchImpl(`${root}/${path.replace(/^\//, "")}`, {
        method,
        headers: { Authorization: authorization, ...headers },
        body,
      });
      return readJson(response, `${method} ${path}`);
    },
  };
}

async function loadExisting(client) {
  return client.json(
    "stadt?context=edit&per_page=100&_fields=id,slug,status,title,content,excerpt,featured_media,acf",
  );
}

function rawField(value) {
  return value && typeof value === "object" && "raw" in value ? value.raw : value;
}

function normalizeEmpty(value) {
  return value === false || value === undefined || value === null || value === "" ? null : value;
}

function collectMismatches(actual, expected, path, failed) {
  const normalizedExpected = normalizeEmpty(expected);
  const normalizedActual = normalizeEmpty(actual);
  if (normalizedExpected === null) {
    if (normalizedActual !== null) failed.push(path);
    return;
  }
  if (Array.isArray(normalizedExpected)) {
    if (!Array.isArray(normalizedActual) || normalizedActual.length !== normalizedExpected.length) {
      failed.push(path);
      return;
    }
    normalizedExpected.forEach((value, index) =>
      collectMismatches(normalizedActual[index], value, `${path}[${index}]`, failed));
    return;
  }
  if (typeof normalizedExpected === "object") {
    if (!normalizedActual || typeof normalizedActual !== "object") {
      failed.push(path);
      return;
    }
    for (const [key, value] of Object.entries(normalizedExpected)) {
      collectMismatches(normalizedActual[key], value, `${path}.${key}`, failed);
    }
    return;
  }
  if (String(normalizedActual).trim() !== String(normalizedExpected).trim()) failed.push(path);
}

export function findCityPayloadMismatches(post, payload) {
  const failed = [];
  collectMismatches(post.slug, payload.slug, "slug", failed);
  collectMismatches(post.status, payload.status, "status", failed);
  collectMismatches(rawField(post.title), payload.title, "title", failed);
  collectMismatches(rawField(post.content), payload.content, "content", failed);
  collectMismatches(post.featured_media, payload.featured_media, "featured_media", failed);
  collectMismatches(post.acf, payload.acf, "acf", failed);
  return failed;
}

function verifyReadback(post, record, payload) {
  const failed = findCityPayloadMismatches(post, payload);
  if (failed.length) {
    throw new Error(`Read-back verification failed for ${record.identity}: ${failed.join(", ")}`);
  }
}

function classifyPlan(plan, status) {
  if (!plan.existing) return "create";
  const payload = buildWpPayload(plan.record, {
    status,
    mediaId: Number(plan.existing.featured_media) || null,
  });
  return findCityPayloadMismatches(plan.existing, payload).length ? "update" : "noop";
}

function summarize(records) {
  return {
    total: records.length,
    create: records.filter((record) => record.action === "create").length,
    update: records.filter((record) => record.action === "update").length,
    noop: records.filter((record) => record.action === "noop").length,
  };
}

export async function runCityImport({
  records,
  fetchImpl = fetch,
  baseUrl,
  auth,
  apply = false,
  status = "publish",
  mediaResolver = async () => null,
}) {
  const client = makeClient({ fetchImpl, baseUrl, auth });
  const existing = await loadExisting(client);
  const plans = planUpserts(records, existing);
  const summaryRecords = plans.map((plan) => ({
    identity: plan.record.identity,
    action: classifyPlan(plan, status),
    postId: plan.postId,
  }));

  if (!apply) {
    return {
      mode: "dry-run",
      ...summarize(summaryRecords),
      written: 0,
      verified: 0,
      records: summaryRecords,
    };
  }

  let written = 0;
  let verified = 0;
  for (const [index, plan] of plans.entries()) {
    const mediaId = await mediaResolver(plan.record, client);
    const payload = buildWpPayload(plan.record, { status, mediaId });
    if (plan.existing && findCityPayloadMismatches(plan.existing, payload).length === 0) {
      summaryRecords[index].action = "noop";
      verified += 1;
      continue;
    }

    summaryRecords[index].action = plan.existing ? "update" : "create";
    const endpoint = plan.postId ? `stadt/${plan.postId}` : "stadt";
    const result = await client.json(endpoint, { method: "POST", body: payload });
    const postId = Number(result.id || plan.postId);
    if (!postId) throw new Error(`WordPress did not return an ID for ${plan.record.identity}`);
    written += 1;

    const post = await client.json(
      `stadt/${postId}?context=edit&_fields=id,slug,status,title,content,excerpt,featured_media,acf`,
    );
    verifyReadback(post, plan.record, payload);
    verified += 1;
    summaryRecords[index].postId = postId;
  }

  const after = await loadExisting(client);
  const secondPlan = planUpserts(records, after);
  const idempotent = secondPlan.every((plan) => plan.existing && classifyPlan(plan, status) === "noop");
  if (!idempotent) throw new Error("Post-import idempotency verification failed");

  return {
    mode: "apply",
    ...summarize(summaryRecords),
    written,
    verified,
    idempotent,
    records: summaryRecords,
  };
}
