import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { marketizeSanitizedHtml } from "../lib/market-html.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const EMOJI_IMAGE =
  '<img decoding="async" class="emoji" role="img" draggable="false" src="https://s.w.org/images/core/emoji/16.0.1/svg/1f449.svg" alt="\u{1F449}">';
const MOTIF_IMAGE =
  '<img loading="lazy" decoding="async" class="alignnone wp-image-1465 size-large" src="https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/borneo.jpeg" alt="Borneo Tribal Tattoo" width="683" height="1024" />';

test("the WordPress emoji image never reaches the page as a full-width graphic", () => {
  const html = marketizeSanitizedHtml(`<p>Mehr dazu ${EMOJI_IMAGE}&nbsp;hier.</p>`, "de");

  assert.doesNotMatch(html, /s\.w\.org\/images\/core\/emoji/);
  assert.match(html, /Mehr dazu \u{1F449}\s*hier\./u);
});

test("a caption-only figure is reunited with the image paragraph above it", () => {
  const html = marketizeSanitizedHtml(
    [
      `<p>${MOTIF_IMAGE}</p>`,
      "<figure><figcaption>Borneo Tribal Tattoo mit Dayak-Mustern<br />",
      `Symbol für Schutz und Stärke.${EMOJI_IMAGE}&nbsp;<a href="https://de.pinterest.com/pin/998391811151541782/" target="_blank" rel="nofollow noopener">Dieses Motiv auf Pinterest ansehen</a></figcaption></figure>`,
    ].join("\n"),
    "de",
  );

  assert.match(html, /<figure class="magazine-motif"><img[^>]*borneo\.jpeg[^>]*\/><figcaption>/);
  assert.match(html, /<figcaption>Borneo Tribal Tattoo mit Dayak-Mustern<br \/>\s*Symbol für Schutz und Stärke\.<\/figcaption>/);
  assert.doesNotMatch(html, /\u{1F449}/u);
  assert.equal(html.match(/<figure/g).length, 1);
});

test("a loose caption and Pinterest paragraph collapse into one motif card", () => {
  const html = marketizeSanitizedHtml(
    [
      `<p>${MOTIF_IMAGE}</p>`,
      "<p>Dieses Sleeve kombiniert Tiger, Eule und Schiff.&nbsp;</p>",
      '<p>\u{1F449} <a href="https://pin.it/5k6G2Mi5O/" target="_blank" rel="nofollow noopener">Dieses Motiv auf Pinterest ansehen</a></p>',
    ].join("\n"),
    "de",
  );

  assert.match(
    html,
    /<figure class="magazine-motif"><img[^>]*\/><figcaption>Dieses Sleeve kombiniert Tiger, Eule und Schiff\.\s*<\/figcaption><a class="pin-cta" href="https:\/\/pin\.it\/5k6G2Mi5O\/"[^>]*>Dieses Motiv auf Pinterest ansehen<\/a><\/figure>/,
  );
  assert.match(html, /rel="nofollow noopener noreferrer"/);
});

test("the follow-us line becomes a Pinterest call-to-action instead of an emoji sentence", () => {
  const html = marketizeSanitizedHtml(
    '<p>\u{1F449} Folge uns auch auf <a href="https://de.pinterest.com/dichmitstich/" target="_blank" rel="nofollow noopener">Pinterest</a> für noch mehr Inspirationen!</p>',
    "de",
  );

  assert.match(html, /<aside class="magazine-pin-follow"><p>Noch mehr Motive/);
  assert.match(html, /<a class="pin-cta pin-cta-follow" href="https:\/\/de\.pinterest\.com\/dichmitstich\/"[^>]*>Folge uns auf Pinterest<\/a><\/aside>/);
  assert.doesNotMatch(html, /\u{1F449}/u);
});

test("an orphaned Pinterest paragraph still renders as a call-to-action", () => {
  const html = marketizeSanitizedHtml(
    [
      "<p>Dieses Sleeve zeigt ein <img src=\"https://dich-mit-stich.de/x.jpg\" alt=\"Sleeve\" /> – klassisch.</p>",
      '<p>\u{1F449} <a href="https://pin.it/6PO85VkAG/" target="_blank" rel="nofollow noopener">Dieses Motiv auf Pinterest ansehen</a></p>',
    ].join("\n"),
    "de",
  );

  assert.match(html, /<p class="magazine-pin-link"><a class="pin-cta" href="https:\/\/pin\.it\/6PO85VkAG\/"/);
  assert.doesNotMatch(html, /\u{1F449}/u);
});

test("editorial prose around an inline image is never rewritten into a caption", () => {
  const source = '<p><img src="https://dich-mit-stich.de/portrait.png" alt="Datingexperte" width="200" height="300" /><br />\nChristian M. Haas ist seit 2008 aktiv.</p>';
  const html = marketizeSanitizedHtml(source, "de");

  assert.doesNotMatch(html, /magazine-motif/);
  assert.doesNotMatch(html, /<figcaption>/);
});

test("WordPress classes stay out of the markup while the app's own classes survive", () => {
  const html = marketizeSanitizedHtml(
    '<p class="wp-block-paragraph has-huge-font-size">Text</p><figure class="wp-block-image size-large"><img src="https://dich-mit-stich.de/a.png" alt="a" /></figure>',
    "de",
  );

  assert.doesNotMatch(html, /wp-block/);
  assert.doesNotMatch(html, /has-huge-font-size/);
});

test("the motif card and Pinterest buttons are styled instead of inheriting full-width image rules", async () => {
  const css = await readSource("../app/globals.css");

  assert.match(css, /\.magazine-motif \{[^}]*width: min\(460px, 100%\);/);
  assert.match(css, /\.magazine-motif img \{[^}]*width: 100%;\s+height: auto;/);
  assert.match(css, /a\.pin-cta \{[^}]*border-radius: 999px;/);
  assert.match(css, /a\.pin-cta::before \{[^}]*mask: var\(--pin-glyph\)/);
  assert.match(css, /\.magazine-pin-follow \{/);
});
