import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const wordpressModule = await import("../lib/wordpress.ts");
const wordpressSource = await readFile(new URL("../lib/wordpress.ts", import.meta.url), "utf8");
const authorProfileSource = await readFile(new URL("../lib/author-profiles.ts", import.meta.url), "utf8");

const {
  WORDPRESS_FETCH_POLICY,
  collectPaginated,
  fetchWithRetry,
} = wordpressModule;

test("WordPress route, list, and detail requests use distinct payload budgets", () => {
  assert.equal(WORDPRESS_FETCH_POLICY.routePageSize, 100);
  assert.equal(WORDPRESS_FETCH_POLICY.listPageSize, 25);
  assert.match(WORDPRESS_FETCH_POLICY.routeFields, /slug/);
  assert.doesNotMatch(WORDPRESS_FETCH_POLICY.routeFields, /content|_embed|_embedded/);
  assert.match(WORDPRESS_FETCH_POLICY.listFields, /excerpt/);
  assert.match(WORDPRESS_FETCH_POLICY.listFields, /_links/);
  assert.match(WORDPRESS_FETCH_POLICY.listFields, /_embedded/);
  assert.doesNotMatch(WORDPRESS_FETCH_POLICY.listFields, /content/);
  assert.equal(WORDPRESS_FETCH_POLICY.maxAttempts, 3);
  assert.ok(WORDPRESS_FETCH_POLICY.timeoutMs > 0);
});

test("paginated WordPress requests return every record exactly once", async () => {
  const requestedPages = [];
  const batches = new Map([
    [1, { items: [{ id: 1 }, { id: 2 }], totalPages: 3 }],
    [2, { items: [{ id: 3 }, { id: 4 }], totalPages: 3 }],
    [3, { items: [{ id: 5 }], totalPages: 3 }],
  ]);

  const result = await collectPaginated(async (page) => {
    requestedPages.push(page);
    return batches.get(page);
  });

  assert.deepEqual(requestedPages, [1, 2, 3]);
  assert.deepEqual(result.map((item) => item.id), [1, 2, 3, 4, 5]);
  assert.equal(new Set(result.map((item) => item.id)).size, result.length);
});

test("pagination stops safely when WordPress returns an empty batch", async () => {
  const requestedPages = [];

  const result = await collectPaginated(async (page) => {
    requestedPages.push(page);
    return page === 1
      ? { items: [{ id: 1 }], totalPages: 4 }
      : { items: [], totalPages: 4 };
  });

  assert.deepEqual(requestedPages, [1, 2]);
  assert.deepEqual(result, [{ id: 1 }]);
});

test("transient WordPress failures retry with a strict attempt limit", async () => {
  const statuses = [503, 502, 200];
  let calls = 0;

  const response = await fetchWithRetry("https://example.test/wp-json/wp/v2/posts", {}, {
    fetchImpl: async () => new Response("response", { status: statuses[calls++] }),
    maxAttempts: 3,
    delayMs: 0,
    timeoutMs: 100,
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
});

test("permanent WordPress client errors are not retried", async () => {
  let calls = 0;

  const response = await fetchWithRetry("https://example.test/wp-json/wp/v2/posts", {}, {
    fetchImpl: async () => {
      calls += 1;
      return new Response("not found", { status: 404 });
    },
    maxAttempts: 3,
    delayMs: 0,
    timeoutMs: 100,
  });

  assert.equal(response.status, 404);
  assert.equal(calls, 1);
});

test("route generation no longer loads complete magazine entries", () => {
  assert.match(wordpressSource, /getMagazineRouteEntries/);
  assert.doesNotMatch(wordpressSource, /per_page:\s*100[\s\S]{0,120}_embed/);
});

test("author profiles use targeted resilient requests instead of loading all posts", () => {
  const profileLoader = authorProfileSource.match(/getAuthorProfile[\s\S]*?getKnownAuthorSlugs/)?.[0] || "";
  assert.match(profileLoader, /getMagazineAuthorPostCount/);
  assert.match(profileLoader, /fetchWithRetry\(/);
  assert.doesNotMatch(profileLoader, /getMagazinePosts\(/);
});
