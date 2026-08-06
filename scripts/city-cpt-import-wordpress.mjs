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
  return client.json("stadt?context=edit&per_page=100&_fields=id,slug,status,title,acf");
}

function rawField(value) {
  return value && typeof value === "object" && "raw" in value ? value.raw : value;
}

function verifyReadback(post, record, payload, mediaId) {
  const checks = {
    slug: post.slug === payload.slug,
    status: post.status === payload.status,
    title: rawField(post.title) === payload.title,
    content: String(rawField(post.content) || "").trim() === String(payload.content).trim(),
    city_id: post.acf?.city_id === record.identity,
    template_variant: post.acf?.template_variant === "city",
    city_name: post.acf?.city_name === record.cityName,
    city_country: post.acf?.city_country === record.country,
    featured_media: !mediaId || Number(post.featured_media) === Number(mediaId),
  };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) {
    throw new Error(`Read-back verification failed for ${record.identity}: ${failed.join(", ")}`);
  }
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
    action: plan.action,
    postId: plan.postId,
  }));
  const counts = {
    total: plans.length,
    create: plans.filter((plan) => plan.action === "create").length,
    update: plans.filter((plan) => plan.action === "update").length,
  };

  if (!apply) {
    return {
      mode: "dry-run",
      ...counts,
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
    const endpoint = plan.postId ? `stadt/${plan.postId}` : "stadt";
    const result = await client.json(endpoint, { method: "POST", body: payload });
    const postId = Number(result.id || plan.postId);
    if (!postId) throw new Error(`WordPress did not return an ID for ${plan.record.identity}`);
    written += 1;

    const post = await client.json(
      `stadt/${postId}?context=edit&_fields=id,slug,status,title,content,featured_media,acf`,
    );
    verifyReadback(post, plan.record, payload, mediaId);
    verified += 1;
    summaryRecords[index].postId = postId;
  }

  const after = await loadExisting(client);
  const secondPlan = planUpserts(records, after);
  const idempotent = secondPlan.every((plan) => plan.action === "update");
  if (!idempotent) throw new Error("Post-import idempotency verification failed");

  return {
    mode: "apply",
    ...counts,
    written,
    verified,
    idempotent,
    records: summaryRecords,
  };
}
