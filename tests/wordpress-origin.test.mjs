import assert from "node:assert/strict";
import test from "node:test";

const { normalizeWordPressPayload, normalizeWordPressUrls, wordpressAuthorArchiveUrl, wordpressRestUrl } = await import(
  "../lib/wordpress-origin.ts"
);
const { joinRestUrl, wpRestUrl } = await import("../scripts/wordpress-rest-url.mjs");
const { sanitizeMagazineHtml } = await import("../lib/wordpress.ts");

const UPLOADS = "https://dich-mit-stich.de/cms-mag/wp-content/uploads/";

test("WordPress REST requests go to /cms-mag/ via rest_route", () => {
  assert.equal(
    wordpressRestUrl("/posts", new URLSearchParams({ slug: "helix-piercing", _embed: "1" })),
    "https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2/posts&slug=helix-piercing&_embed=1",
  );
  assert.equal(wordpressRestUrl("/stadt"), "https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2/stadt");
  assert.equal(wordpressAuthorArchiveUrl("anne-schweitzer"), "https://dich-mit-stich.de/cms-mag/?author_name=anne-schweitzer");
  assert.equal(wpRestUrl("/pages/12?_fields=id"), "https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2/pages/12&_fields=id");
  assert.equal(joinRestUrl("https://cms.example/wp-json/wp/v2/", "/stadt?x=1"), "https://cms.example/wp-json/wp/v2/stadt?x=1");
});

test("upload URLs from old /magazin/ paths and the misconfigured site URL point to /cms-mag/", () => {
  for (const input of [
    "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/borneo.jpeg",
    "https://www.dich-mit-stich.de.de/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
    "https://www.dich-mit-stich.de/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
    "/magazin/wp-content/uploads/2025/09/borneo.jpeg",
  ]) {
    assert.equal(normalizeWordPressUrls(input), `${UPLOADS}2025/09/borneo.jpeg`, input);
  }
});

test("article links from the CMS are published under /magazin/", () => {
  assert.equal(
    normalizeWordPressUrls("https://www.dich-mit-stich.de.de/cms-mag/helix-piercing/"),
    "https://dich-mit-stich.de/magazin/helix-piercing/",
  );
  assert.equal(normalizeWordPressUrls("https://dich-mit-stich.de/magazin/helix-piercing/"), "https://dich-mit-stich.de/magazin/helix-piercing/");
  assert.equal(normalizeWordPressUrls("/magazin/helix-piercing/"), "/magazin/helix-piercing/");
  assert.equal(normalizeWordPressUrls("https://example.org/magazin/wp-content/uploads/x.jpg"), "https://example.org/magazin/wp-content/uploads/x.jpg");
});

test("REST payloads are normalized deeply, including srcset in rendered HTML", () => {
  const payload = normalizeWordPressPayload({
    link: "https://www.dich-mit-stich.de.de/cms-mag/tribal-tattoo/",
    content: {
      rendered:
        '<img src="https://dich-mit-stich.de/magazin/wp-content/uploads/a-300x200.jpg" srcset="https://www.dich-mit-stich.de.de/cms-mag/wp-content/uploads/a-300x200.jpg 300w, /magazin/wp-content/uploads/a.jpg 900w">',
    },
    _embedded: { "wp:featuredmedia": [{ source_url: "https://www.dich-mit-stich.de.de/cms-mag/wp-content/uploads/a.jpg" }] },
    id: 7,
  });
  assert.equal(payload.id, 7);
  assert.equal(payload.link, "https://dich-mit-stich.de/magazin/tribal-tattoo/");
  assert.equal(payload._embedded["wp:featuredmedia"][0].source_url, `${UPLOADS}a.jpg`);
  assert.equal(
    payload.content.rendered,
    `<img src="${UPLOADS}a-300x200.jpg" srcset="${UPLOADS}a-300x200.jpg 300w, ${UPLOADS}a.jpg 900w">`,
  );
});

test("sanitized magazine images point to /cms-mag/ uploads", () => {
  const html = sanitizeMagazineHtml('<img src="/magazin/wp-content/uploads/x.jpg" srcset="/magazin/wp-content/uploads/x-300.jpg 300w">');
  assert.match(html, /src="https:\/\/dich-mit-stich\.de\/cms-mag\/wp-content\/uploads\/x\.jpg"/);
  assert.match(html, /srcset="https:\/\/dich-mit-stich\.de\/cms-mag\/wp-content\/uploads\/x-300\.jpg 300w"/);
});
