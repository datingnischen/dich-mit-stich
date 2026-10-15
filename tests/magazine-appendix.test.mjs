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

  assert.match(component, /<details className="magazine-appendix magazine-sources">\s*<summary>Quellen<\/summary>/);
  const notice = component.indexOf('<div className="magazine-notice">');
  const details = component.indexOf("<details");
  assert.ok(notice >= 0 && notice < details, "medical notice sits visibly above the collapsed sources");
  assert.match(component.slice(notice, details), /ersetzt keine persönliche Beratung, Diagnose oder Behandlung/);
  assert.doesNotMatch(component.slice(details), /ersetzt keine/);
  assert.match(component.slice(details), /safepiercing\.org\/aftercare/);
  assert.doesNotMatch(component, /<details[^>]*\bopen\b/);
  assert.doesNotMatch(component, /magazine-source-list/);
  assert.doesNotMatch(css, /magazine-source-list/);
});

test("chapter-split articles and hub overviews render the reference block once, at the end", async () => {
  const { splitMagazineAppendix } = await import("../lib/market-html.ts");
  const { parseLexikonBlocks } = await import("../lib/tattoo-lexikon-overview.ts");
  const { splitArticleSections } = await import("../lib/tattoo-motifs.ts");
  const source = await readSource("../content/magazin/beitraege/borneo-tribal-tattoo.md");
  const { body, appendix } = splitMagazineAppendix(source.replace(/^---[\s\S]*?\n---\r?\n/, ""));

  assert.match(appendix, /^<details class="magazine-appendix magazine-sources">/);
  assert.match(appendix, /<p class="magazine-sources__label">Genutzte Quellen<\/p>\s*<ul>/);
  assert.doesNotMatch(body, /magazine-appendix|Genutzte Quellen|Stand, Quellen/);
  const pieces = parseLexikonBlocks(body).filter((block) => block.kind === "html").map((block) => block.html).join("");
  assert.doesNotMatch(pieces, /<details/);
  assert.doesNotMatch(splitArticleSections(body).join(""), /<details|Genutzte Quellen/);

  const motifArticle = await readSource("../components/tattoo-motif-article.tsx");
  assert.match(motifArticle, /splitArticleSections\(body\)/);
  assert.match(motifArticle, /\{appendix \? <MarketHtmlContent market=\{market\} html=\{appendix\} \/> : null\}/);

  const overview = await readSource("../components/magazine-hub-overview.tsx");
  assert.match(overview, /splitMagazineAppendix\(html\)/);
  assert.match(overview, /\{appendix \? <MarketHtmlContent market=\{market\} html=\{appendix\} \/> : null\}/);
});

const NOTICE = /<div class="magazine-notice">([\s\S]*?)<\/div>\s*(?=<details|$)/;
const DETAILS = /<details class="magazine-appendix magazine-sources">([\s\S]*?)<\/details>/;
const stripFrontmatter = (source) => source.replace(/^---[\s\S]*?\n---\r?\n/, "");

test("a medical notice inside the sources stays visible above the collapsed block", () => {
  const html = marketizeSanitizedHtml(
    [
      "<p>Text.</p>",
      "<h2>Quellen und medizinischer Hinweis</h2>",
      "<p>Dieser Überblick ersetzt keine ärztliche Beratung, Diagnose oder Behandlung.</p>",
      "<ul><li>NHS: Infected piercings – medizinische Hinweise</li></ul>",
      "<p>Bildquelle: Medizinisches Archiv</p>",
    ].join("\n"),
    "de",
  );

  const notice = html.match(NOTICE);
  const details = html.match(DETAILS);
  assert.ok(notice && details, html);
  assert.ok(html.indexOf("magazine-notice") < html.indexOf("<details"));
  assert.match(notice[1], /ersetzt keine ärztliche Beratung/);
  assert.doesNotMatch(notice[1], /NHS|Bildquelle/);
  assert.match(details[1], /<summary>Quellen<\/summary>/);
  assert.match(details[1], /NHS: Infected piercings/);
  assert.match(details[1], /Bildquelle: Medizinisches Archiv/);
  assert.doesNotMatch(details[1], /ersetzt keine/);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.equal(html.match(/<details/g).length, 1);
});

test("a section under a medical or legal notice heading is shown in full, the sources stay collapsed", () => {
  const html = marketizeSanitizedHtml(
    [
      "<p>Text.</p>",
      "<h2>Quellen</h2>",
      "<ul><li>safepiercing.org – Aftercare</li></ul>",
      "<h2>Rechtlicher Hinweis</h2>",
      "<p>Die Angaben dienen der allgemeinen Information.</p>",
    ].join("\n"),
    "de",
  );

  const notice = html.match(NOTICE);
  assert.ok(notice, html);
  assert.match(notice[1], /<p class="magazine-notice__label">Rechtlicher Hinweis<\/p>\s*<p>Die Angaben dienen der allgemeinen Information\.<\/p>/);
  assert.match(html.match(DETAILS)[1], /safepiercing\.org/);
  assert.doesNotMatch(html.match(DETAILS)[1], /Rechtlicher Hinweis|allgemeinen Information/);
});

test("a transparency note without a notice keeps the existing collapsed block", () => {
  const html = marketizeSanitizedHtml(SOURCES_SECTION, "de");
  assert.doesNotMatch(html, /magazine-notice/);
  assert.match(html, BLOCK_START);
});

test("chapter-split texts move the visible notice together with the collapsed sources", async () => {
  const { splitMagazineAppendix } = await import("../lib/market-html.ts");
  const source = await readSource("../content/magazin/beitraege/maori-tribal-tattoo.md");
  const { body, appendix } = splitMagazineAppendix(stripFrontmatter(source));

  assert.match(appendix, /^<div class="magazine-notice">[\s\S]*ersetzt der Beitrag keine persönliche Beratung[\s\S]*<\/div>\s*<details class="magazine-appendix magazine-sources">[\s\S]*<\/details>$/);
  assert.doesNotMatch(body, /magazine-notice|<details|Genutzte Quellen/);
});

test("in every magazine text notices render visibly outside and sources inside the collapsed block", async () => {
  let withNotice = 0;
  for (const folder of ["beitraege", "seiten"]) {
    const dir = new URL(`../content/magazin/${folder}/`, import.meta.url);
    for (const name of (await readdir(dir)).filter((file) => file.endsWith(".md"))) {
      const html = marketizeSanitizedHtml(stripFrontmatter(await readFile(new URL(name, dir), "utf8")), "de");
      const details = html.match(DETAILS);
      if (details) {
        assert.doesNotMatch(details[1], /ersetz\w*\s+(?:[^\s.]+\s+){0,3}?(?:keine|nicht)\b[^.]*\b(?:Beratung|Diagnose|Behandlung)/i, name);
        assert.doesNotMatch(details[1], /<p class="magazine-sources__label">[^<]*Hinweis/i, name);
      }
      const notice = html.match(NOTICE);
      if (!notice) continue;
      withNotice += 1;
      assert.equal(html.match(/class="magazine-notice"/g).length, 1, name);
      assert.doesNotMatch(notice[1], /<li>|Bildquelle|Genutzte Quellen/, name);
      if (details) assert.ok(html.indexOf('class="magazine-notice"') < html.indexOf("<details"), name);
    }
  }
  assert.ok(withNotice >= 2, `only ${withNotice} texts with a notice found`);
});

test("the notice is styled as a visible, muted box", async () => {
  const css = await readSource("../app/globals.css");
  assert.match(css, /\.magazine-notice \{[^}]*border-left:[^}]*font-size: 14px;/);
  assert.doesNotMatch(css, /\.magazine-notice[^{]*\{[^}]*display: none/);
});
