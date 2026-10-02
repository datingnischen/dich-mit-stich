import assert from "node:assert/strict";
import test from "node:test";

const { normalizeLegacyUrls, UPLOADS_PATH } = await import("../lib/magazine-urls.ts");
const { withAssetHost } = await import("../lib/magazine-content.ts");
const { sanitizeMagazineHtml } = await import("../lib/magazine.ts");

test("upload URLs from the former WordPress addresses point to the repo path", () => {
  for (const input of [
    "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/borneo.jpeg",
    "https://dich-mit-stich.de/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
    "https://www.dich-mit-stich.de.de/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
    "https://www.dich-mit-stich.de/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
    "/magazin/wp-content/uploads/2025/09/borneo.jpeg",
    "/cms-mag/wp-content/uploads/2025/09/borneo.jpeg",
  ]) {
    assert.equal(normalizeLegacyUrls(input), `${UPLOADS_PATH}2025/09/borneo.jpeg`, input);
  }
});

test("article links from the old CMS are published under /magazin/", () => {
  assert.equal(
    normalizeLegacyUrls("https://www.dich-mit-stich.de.de/cms-mag/helix-piercing/"),
    "https://dich-mit-stich.de/magazin/helix-piercing/",
  );
  assert.equal(normalizeLegacyUrls("https://dich-mit-stich.de/magazin/helix-piercing/"), "https://dich-mit-stich.de/magazin/helix-piercing/");
  assert.equal(normalizeLegacyUrls("/magazin/helix-piercing/"), "/magazin/helix-piercing/");
  assert.equal(normalizeLegacyUrls("https://example.org/magazin/wp-content/uploads/x.jpg"), "https://example.org/magazin/wp-content/uploads/x.jpg");
});

test("srcset in imported HTML is rewritten and the asset host is applied when content is loaded", () => {
  const html = sanitizeMagazineHtml(
    '<img src="https://dich-mit-stich.de/magazin/wp-content/uploads/a-300x200.jpg" srcset="https://www.dich-mit-stich.de.de/cms-mag/wp-content/uploads/a-300x200.jpg 300w, /magazin/wp-content/uploads/a.jpg 900w" alt="A">',
  );
  assert.match(html, /src="\/magazin\/wp-content\/uploads\/a-300x200\.jpg"/);
  assert.match(html, /srcset="\/magazin\/wp-content\/uploads\/a-300x200\.jpg 300w, \/magazin\/wp-content\/uploads\/a\.jpg 900w"/);

  const served = withAssetHost(html);
  assert.match(served, /src="https:\/\/dich-mit-stich\.vercel\.app\/app-assets\/magazin\/wp-content\/uploads\/a-300x200\.jpg"/);
  assert.doesNotMatch(served, /cms-mag/);
});
