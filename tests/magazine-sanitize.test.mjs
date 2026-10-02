import assert from "node:assert/strict";
import test from "node:test";

const { sanitizeMagazineHtml } = await import("../lib/magazine.ts");
const { firstPartyInternalPath } = await import("../lib/market-html.ts");

test("magazine HTML is sanitized without breaking editorial structure", () => {
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
  assert.match(html, /<img src="\/magazin\/wp-content\/uploads\/2025\/09\/example\.jpg" alt="Beispiel" decoding="async" loading="lazy" \/>/);
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

test("the NextGEN gallery marker an old export left behind is not shown as text", () => {
  const html = sanitizeMagazineHtml("<p>Vorher</p><p>ngg_shortcode_0_placeholder</p><p>Nachher</p>");

  assert.doesNotMatch(html, /ngg_shortcode/);
  assert.match(html, /Vorher[\s\S]*Nachher/);
});
