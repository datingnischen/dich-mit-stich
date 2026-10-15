import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

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

const BLOCK_START = /<details class="magazine-appendix magazine-sources">\s*<summary>Quellen &amp; Transparenz<\/summary>\s*<div class="magazine-sources__body">/;

test("the sources and transparency run becomes a closed details block at the end", () => {
  const html = marketizeSanitizedHtml(SOURCES_SECTION, "de");

  assert.match(html, BLOCK_START);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.doesNotMatch(html, /<h2>Stand, Quellen/);
  assert.match(html, /<p>Stand der Informationen: Juni 2026\.<\/p>\s*<p class="magazine-sources__label">Genutzte Quellen<\/p>\s*<ul><li>britannica\.com[^<]*<\/li><\/ul>\s*<\/div>\s*<\/details>/);
  assert.match(html, /<h2>Kurz zusammengefasst<\/h2>\s*<p>Borneo Tribal Tattoos leben von klaren Mustern\.<\/p>\s*<details/);
});

test("an open attribute in the content cannot unfold the block", () => {
  const html = marketizeSanitizedHtml('<p>Text</p><details class="magazine-sources" open><summary>Quellen</summary><p>x</p></details>', "de");
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
});

test("the reference block lands behind the related reading the editors put after it", () => {
  const html = marketizeSanitizedHtml(
    `${SOURCES_SECTION}\n<h2>Weitere Tribal Tattoo Inspirationen</h2>\n<ul><li><a href="/magazin/maori-tribal-tattoo/">Maori Tribal Tattoo</a></li></ul>`,
    "de",
  );

  assert.match(html, /<h2>Weitere Tribal Tattoo Inspirationen<\/h2>[\s\S]*<details class="magazine-appendix magazine-sources">/);
  assert.equal(html.match(/<details/g).length, 1);
});

test("the Pinterest call-to-action keeps its own card and stays above the reference block", () => {
  const html = marketizeSanitizedHtml(
    `${SOURCES_SECTION}\n<p>\u{1F449} Folge uns auf <a href="https://de.pinterest.com/dichmitstich/" rel="nofollow noopener">Pinterest</a>.</p>`,
    "de",
  );

  assert.match(html, /<aside class="magazine-pin-follow">[\s\S]*<\/aside>\s*<details class="magazine-appendix magazine-sources">/);
});

test("the reference block goes inside the wrapper the editors opened around the article", () => {
  const html = marketizeSanitizedHtml(
    '<article class="tattoo-inspiration"><p>Text</p><h2>Transparenz</h2><p>Anne Schweitzer schreibt als freie Autorin.</p></article>',
    "de",
  );

  assert.match(html, /<details class="magazine-appendix magazine-sources">\s*<summary>Transparenz<\/summary>\s*<div class="magazine-sources__body">\s*<p>Anne Schweitzer[^<]*<\/p>\s*<\/div>\s*<\/details><\/article>/);
  assert.doesNotMatch(html, /<\/article>\s*<details/);
});

test("an image credit quote at the top of an article joins the collapsed block at the end", () => {
  const html = marketizeSanitizedHtml(
    '<blockquote>\n<p><small><br />\nBildquelle: <a href="https://de.wikipedia.org/wiki/X">Wikipedia</a><br />\n</small></p>\n</blockquote>\n<p>Erster Absatz.</p>\n<h2>Weiter</h2>\n<p>Schluss.</p>',
    "de",
  );

  assert.doesNotMatch(html, /<blockquote/);
  assert.ok(html.indexOf("Schluss.") < html.indexOf("<details"), "credit sits at the end");
  assert.match(html, /<details class="magazine-appendix magazine-sources">[\s\S]*Bildquelle: <a href="https:\/\/de\.wikipedia\.org\/wiki\/X"/);
  assert.match(html, /<p>Erster Absatz\.<\/p>\s*<h2>Weiter<\/h2>\s*<p>Schluss\.<\/p>\s*<details/);
});

test("headings that only look like sources keep their place in the article", () => {
  const html = marketizeSanitizedHtml(
    "<h2>Typische Fehler und Reizquellen</h2><p>Zu den häufigsten Fehlern gehört es, den Schmuck zu bewegen.</p><h2>Welche Quellen sind verlässlich?</h2><p>Text</p>",
    "de",
  );

  assert.doesNotMatch(html, /magazine-appendix|<details/);
});

test("every magazine text with sources renders them collapsed at the end", async () => {
  let withSources = 0;
  for (const folder of ["beitraege", "seiten"]) {
    const dir = new URL(`../content/magazin/${folder}/`, import.meta.url);
    for (const name of (await readdir(dir)).filter((file) => file.endsWith(".md"))) {
      const source = await readFile(new URL(name, dir), "utf8");
      const body = source.replace(/^---[\s\S]*?\n---\r?\n/, "");
      if (!/<h[2-6][^>]*>[^<]*(?:Quellen|Transparenz)[^<?]*<\/h[2-6]>|Bildquelle:/.test(body)) continue;
      withSources += 1;
      const html = marketizeSanitizedHtml(body, "de");
      assert.match(html, /<details class="magazine-appendix magazine-sources">\s*<summary>/, name);
      assert.doesNotMatch(html, /<details[^>]*\bopen\b/, name);
      assert.doesNotMatch(html, /<h[2-6][^>]*>[^<]*(?:Quellen|Transparenz)[^<?]*<\/h[2-6]>/, name);
      assert.equal(html.match(/<details/g).length, 1, name);
    }
  }
  assert.ok(withSources >= 5, `only ${withSources} texts with sources found`);
});

test("the reference block is small, muted and keyboard accessible", async () => {
  const css = await readSource("../app/globals.css");

  assert.match(css, /\.magazine-appendix \{[^}]*font-size: 13px;/);
  assert.match(css, /\.magazine-appendix > summary \{[^}]*font-size: 13px;[^}]*cursor: pointer;/);
  assert.match(css, /\.magazine-appendix > summary:focus-visible \{[^}]*outline:/);
  assert.match(
    css,
    /\.magazine-appendix p,\s*\.magazine-appendix ul,\s*\.magazine-appendix ol,\s*\.magazine-appendix li \{[^}]*font-size: 13px;/,
  );
});

test("the hand-built piercing source card uses the same collapsed block", async () => {
  const [component, css] = await Promise.all([
    readSource("../components/anti-eyebrow-editorial.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(component, /<details className="magazine-appendix magazine-sources">\s*<summary>Quellen und medizinischer Hinweis<\/summary>/);
  assert.doesNotMatch(component, /<details[^>]*\bopen\b/);
  assert.doesNotMatch(component, /magazine-source-list/);
  assert.doesNotMatch(css, /magazine-source-list/);
});
