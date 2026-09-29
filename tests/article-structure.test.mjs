import assert from "node:assert/strict";
import test from "node:test";

const { MAX_PARAGRAPH_WORDS, normalizeHeadingLevels, splitLongParagraphs } = await import("../lib/article-structure.ts");

const sentence = (index) => `Satz ${index} erklärt ruhig und sachlich, worauf du bei deinem nächsten Tattoo achten solltest.`;
const words = (html) => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
const paragraphs = (html) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]);

test("paragraphs over the word limit are split at sentence ends (Semrush: Paragraphs are too long)", () => {
  const long = Array.from({ length: 18 }, (_, index) => sentence(index + 1)).join(" ");
  const result = splitLongParagraphs(`<p>${long}</p>`);
  const parts = paragraphs(result);

  assert.ok(words(long) > MAX_PARAGRAPH_WORDS);
  assert.ok(parts.length >= 2);
  for (const part of parts) {
    assert.ok(words(part) <= MAX_PARAGRAPH_WORDS, part);
    assert.match(part, /^Satz \d+ .*\.$/);
  }
  assert.equal(parts.join(" "), long);
});

test("short paragraphs, links and abbreviations stay intact", () => {
  const short = `<p>${sentence(1)}</p>`;
  assert.equal(splitLongParagraphs(short), short);

  const withLink = Array.from({ length: 16 }, (_, index) =>
    index === 7 ? `Mehr dazu im <a href="/magazin/tattoo-studio/">Studio-Ratgeber. Dort steht alles</a> ausführlich.` : sentence(index + 1),
  ).join(" ");
  const parts = paragraphs(splitLongParagraphs(`<p>${withLink}</p>`));
  assert.ok(parts.some((part) => part.includes(`<a href="/magazin/tattoo-studio/">Studio-Ratgeber. Dort steht alles</a>`)));

  const abbreviations = Array.from({ length: 16 }, (_, index) => `Das kostet ca. 80 Euro, z. B. Studio ${index} bzw. Artist.`).join(" ");
  for (const part of paragraphs(splitLongParagraphs(`<p>${abbreviations}</p>`))) {
    assert.doesNotMatch(part, /^(80|B\.|Artist)/);
  }
});

test("line breaks used as fake paragraphs become real paragraph ends", () => {
  const block = (index) => [1, 2, 3, 4].map((offset) => sentence(index * 4 + offset)).join(" ");
  const parts = paragraphs(splitLongParagraphs(`<p>${block(0)}<br />\n${block(1)}<br />\n${block(2)}</p>`));

  assert.ok(parts.length >= 2);
  for (const part of parts) assert.doesNotMatch(part, /<br\s*\/?>\s*$/);
});

test("article headings start at h2 and never skip a level (Semrush: Poor heading hierarchy)", () => {
  assert.equal(
    normalizeHeadingLevels("<h3>A</h3><p>x</p><h3>B</h3><h2>C</h2><h4>D</h4><h3>E</h3>"),
    "<h2>A</h2><p>x</p><h2>B</h2><h2>C</h2><h3>D</h3><h3>E</h3>",
  );
  assert.equal(normalizeHeadingLevels('<h1 id="x">Titel</h1><h2>A</h2><h3>B</h3>'), '<h2 id="x">Titel</h2><h2>A</h2><h3>B</h3>');
});

test("NextGEN placeholders are removed even when glued to the next word", async () => {
  const { sanitizeMagazineHtml } = await import("../lib/wordpress.ts");
  assert.equal(sanitizeMagazineHtml("<p>ngg_shortcode_0_placeholderEin Mandala ist rund.</p>"), "<p>Ein Mandala ist rund.</p>");
});
