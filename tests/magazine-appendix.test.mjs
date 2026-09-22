import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { marketizeSanitizedHtml } from "../lib/market-html.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const SOURCES_SECTION = [
  "<h2>Kurz zusammengefasst</h2>",
  "<p>Borneo Tribal Tattoos leben von klaren Mustern.</p>",
  "<h2>Stand, Quellen &amp; Transparenz</h2>",
  "<p>Stand der Informationen: Juni 2026.</p>",
  "<h3>Genutzte Quellen</h3>",
  "<ul><li>britannica.com/topic/Dayak – Einordnung des Begriffs Dayak</li></ul>",
].join("\n");

test("the sources and transparency run moves into its own reference block", () => {
  const html = marketizeSanitizedHtml(SOURCES_SECTION, "de");

  assert.match(html, /<aside class="magazine-appendix"><h2>Stand, Quellen &amp; Transparenz<\/h2>/);
  assert.match(html, /<h3>Genutzte Quellen<\/h3>\s*<ul><li>britannica\.com[^<]*<\/li><\/ul>\s*<\/aside>/);
  assert.match(html, /<h2>Kurz zusammengefasst<\/h2>\s*<p>Borneo Tribal Tattoos leben von klaren Mustern\.<\/p>\s*<aside/);
});

test("the reference block lands behind the related reading the editors put after it", () => {
  const html = marketizeSanitizedHtml(
    `${SOURCES_SECTION}\n<h2>Weitere Tribal Tattoo Inspirationen</h2>\n<ul><li><a href="/magazin/maori-tribal-tattoo/">Maori Tribal Tattoo</a></li></ul>`,
    "de",
  );

  assert.match(html, /<h2>Weitere Tribal Tattoo Inspirationen<\/h2>[\s\S]*<aside class="magazine-appendix">/);
  assert.equal(html.match(/magazine-appendix/g).length, 1);
});

test("the Pinterest call-to-action keeps its own card and stays above the reference block", () => {
  const html = marketizeSanitizedHtml(
    `${SOURCES_SECTION}\n<p>\u{1F449} Folge uns auf <a href="https://de.pinterest.com/dichmitstich/" rel="nofollow noopener">Pinterest</a>.</p>`,
    "de",
  );

  assert.match(html, /<aside class="magazine-pin-follow">[\s\S]*<\/aside>\s*<aside class="magazine-appendix">/);
});

test("the reference block goes inside the wrapper the editors opened around the article", () => {
  const html = marketizeSanitizedHtml(
    '<article class="tattoo-inspiration"><p>Text</p><h2>Transparenz</h2><p>Anne Schweitzer schreibt als freie Autorin.</p></article>',
    "de",
  );

  assert.match(html, /<aside class="magazine-appendix"><h2>Transparenz<\/h2><p>Anne Schweitzer[^<]*<\/p><\/aside>\s*<\/article>/);
  assert.doesNotMatch(html, /<\/article>\s*<aside/);
});

test("headings that only look like sources keep their place in the article", () => {
  const html = marketizeSanitizedHtml(
    "<h2>Typische Fehler und Reizquellen</h2><p>Zu den häufigsten Fehlern gehört es, den Schmuck zu bewegen.</p>",
    "de",
  );

  assert.doesNotMatch(html, /magazine-appendix/);
});

test("the reference block is styled smaller and set apart from the body copy", async () => {
  const css = await readSource("../app/globals.css");

  assert.match(css, /\.magazine-appendix \{[^}]*background: var\(--surface-soft\);/);
  assert.match(css, /\.magazine-appendix h2 \{[^}]*font-size: 0\.8rem;/);
  assert.match(
    css,
    /\.magazine-appendix p,\s*\.magazine-appendix ul,\s*\.magazine-appendix ol,\s*\.magazine-appendix li \{[^}]*font-size: 0\.86rem;/,
  );
});

test("the hand-built piercing source card uses the same reference block", async () => {
  const [component, css] = await Promise.all([
    readSource("../components/anti-eyebrow-editorial.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(component, /<aside className="magazine-appendix" aria-labelledby="anti-eyebrow-quellen">/);
  assert.doesNotMatch(component, /magazine-source-list/);
  assert.doesNotMatch(css, /magazine-source-list/);
  assert.match(css, /\.magazine-appendix \.eyebrow \{[^}]*font-size: 0\.66rem;/);
});
