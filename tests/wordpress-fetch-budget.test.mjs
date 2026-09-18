import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const wordpressModule = await import("../lib/wordpress.ts");
const wordpressSource = await readFile(new URL("../lib/wordpress.ts", import.meta.url), "utf8");
const authorProfileSource = await readFile(new URL("../lib/author-profiles.ts", import.meta.url), "utf8");
const payloadBudgetSource = await readFile(new URL("../scripts/check-wordpress-payload-budget.mjs", import.meta.url), "utf8");
const { firstPartyInternalPath } = await import("../lib/market-html.ts");

const {
  WORDPRESS_FETCH_POLICY,
  collectPaginated,
  fetchWithRetry,
  sanitizeMagazineHtml,
} = wordpressModule;

test("magazine HTML is sanitized at the WordPress boundary without breaking editorial structure", () => {
  const html = sanitizeMagazineHtml(`
    <h2 id="unsafe">Pflege</h2>
    <p class="intro" style="position:fixed" onclick="alert(1)">Sicherer Text <strong>bleibt</strong>.</p>
    <script src="//www.instagram.com/embed.js"></script>
    <iframe src="https://evil.example/embed"></iframe>
    <img src="/magazin/wp-content/uploads/2025/09/example.jpg" alt="Beispiel" onerror="alert(2)" decoding="async">
    <a href="javascript:alert(3)">Unsicher</a>
    <a href="https://example.org/source" target="_blank">Quelle</a>
    <ul><li>Ein Punkt</li></ul>
  `);

  assert.match(html, /<h2>Pflege<\/h2>/);
  assert.match(html, /<p>Sicherer Text <strong>bleibt<\/strong>\.<\/p>/);
  assert.match(html, /<img src="https:\/\/dich-mit-stich\.de\/magazin\/wp-content\/uploads\/2025\/09\/example\.jpg" alt="Beispiel" decoding="async" loading="lazy" \/>/);
  assert.match(html, /<a href="https:\/\/example\.org\/source" target="_blank" rel="noopener noreferrer nofollow">Quelle<\/a>/);
  assert.match(html, /<ul><li>Ein Punkt<\/li><\/ul>/);
  assert.doesNotMatch(html, /script|iframe|onclick|onerror|style=|javascript:|id=|class=/i);
});

test("magazine link sanitization canonicalizes external URLs and removes arbitrary targets", () => {
  const html = sanitizeMagazineHtml(`
    <a href="//evil.example/x" target="named-window">Protokollrelativ</a>
    <a href=" https://evil.example/space " target="_blank">Leerzeichen</a>
    <a href="http:evil.example/noncanonical" target="other-window">Nichtkanonisch</a>
    <a href="/magazin/intern" target="named-window">Intern</a>
  `);

  assert.match(html, /<a href="https:\/\/evil\.example\/x" rel="noopener noreferrer nofollow">Protokollrelativ<\/a>/);
  assert.match(html, /<a href="https:\/\/evil\.example\/space" target="_blank" rel="noopener noreferrer nofollow">Leerzeichen<\/a>/);
  assert.match(html, /<a href="http:\/\/evil\.example\/noncanonical" rel="noopener noreferrer nofollow">Nichtkanonisch<\/a>/);
  assert.match(html, /<a href="\/magazin\/intern">Intern<\/a>/);
  assert.doesNotMatch(html, /named-window|other-window/);
});

test("magazine link sanitization repairs the exact duplicated-scheme first-party legacy URL", () => {
  const sanitized = sanitizeMagazineHtml(`
    <a href="https://https://dich-mit-stich.de/magazin/intimpiercing/">Intern</a>
    <a href="https://https://evil.example/magazin/intimpiercing/">Extern</a>
  `);

  assert.match(sanitized, /href="https:\/\/dich-mit-stich\.de\/magazin\/intimpiercing\/"/);
  assert.match(sanitized, /href="https:\/\/https\/\/evil\.example\/magazin\/intimpiercing\/"/);
  assert.equal(
    firstPartyInternalPath("https://dich-mit-stich.de/magazin/intimpiercing/"),
    "/magazin/intimpiercing/",
  );
  assert.equal(firstPartyInternalPath("https://https//evil.example/magazin/intimpiercing/"), null);
});

test("sanitized foreign anchors preserve their href and external-link attribution", () => {
  const sanitized = sanitizeMagazineHtml(
    `<a title="note href='https://dich-mit-stich.de/magazin/x'" href="https://evil.example/y">Fremdlink</a>`,
  );

  assert.match(sanitized, /href="https:\/\/evil\.example\/y"/);
  assert.match(sanitized, /rel="noopener noreferrer nofollow"/);
  assert.match(sanitized, /title="note href='https:\/\/dich-mit-stich\.de\/magazin\/x'"/);
  assert.equal(firstPartyInternalPath("https://evil.example/y"), null);
});

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

test("payload budgets cover WordPress city route, list, and detail responses", () => {
  assert.match(payloadBudgetSource, /name: "city routes"/);
  assert.match(payloadBudgetSource, /name: "city list"/);
  assert.match(payloadBudgetSource, /name: "city detail"/);
  assert.match(payloadBudgetSource, /\/stadt\?/);
  assert.match(payloadBudgetSource, /_fields=id,slug,acf/);
  assert.doesNotMatch(
    payloadBudgetSource.match(/name: "city routes"[\s\S]*?maxBytes/)?.[0] || "",
    /content|_embed|_embedded/,
  );
});
