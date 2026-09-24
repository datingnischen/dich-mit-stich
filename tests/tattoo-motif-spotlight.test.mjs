import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const {
  TATTOO_MOTIF_PROFILES,
  buildTattooMotifSpotlight,
  pickRelatedSlugs,
  planArticleSlots,
  readingMinutes,
  splitArticleSections,
} = await import("../lib/tattoo-motifs.ts");

const SKULL_HTML = `
<h2>Totenschädelromantik und Vergänglichkeit</h2><p>Totenschädel und andere Knochenteile haben eine lange kultische Tradition.</p>
<h3>Ursprung</h3><p>Die Herkunft reicht bis in die Antike.</p>
<h3>Bedeutung</h3><p>Ein Symbol der Vergänglichkeit.</p>
<h3>Das Totenkopftattoo</h3><p>Gerne auf Hand, Oberarm und Unterarm getragen.</p>
`;

test("articles split into one section per h2/h3 so inserts land between chapters", () => {
  const sections = splitArticleSections(SKULL_HTML);

  assert.equal(sections.length, 4);
  assert.match(sections[0], /^<h2>Totenschädelromantik/);
  assert.match(sections[2], /^<h3>Bedeutung<\/h3>/);
  assert.equal(sections.join(""), SKULL_HTML.trim());
});

test("headings nested in wrappers keep the article in one piece instead of breaking the markup", () => {
  const nested = `<div class="wp-block-group"><h2>Eins</h2><p>a</p><h2>Zwei</h2><p>b</p></div>`;

  assert.deepEqual(splitArticleSections(nested), [nested]);
  assert.deepEqual(splitArticleSections(""), []);
  assert.deepEqual(splitArticleSections("<p>Nur Text</p>"), ["<p>Nur Text</p>"]);
});

test("the flirt hook sits after the second chapter and the quote further down", () => {
  assert.deepEqual(planArticleSlots(4), { hookAfter: 2, quoteAfter: 3 });
  assert.deepEqual(planArticleSlots(10), { hookAfter: 2, quoteAfter: 6 });
  assert.deepEqual(planArticleSlots(3), { hookAfter: 2, quoteAfter: null });
  assert.deepEqual(planArticleSlots(2), { hookAfter: 1, quoteAfter: null });
  assert.deepEqual(planArticleSlots(1), { hookAfter: 1, quoteAfter: null });
});

test("reading time counts words of the visible text and never drops below a minute", () => {
  assert.equal(readingMinutes("<p>kurz</p>"), 1);
  assert.equal(readingMinutes(`<p>${"wort ".repeat(1000)}</p>`), 5);
});

test("the skull profile is curated and quotes the article itself", () => {
  const skull = TATTOO_MOTIF_PROFILES["skull-tattoos"];

  assert.equal(skull.motif, "Skull");
  assert.ok(skull.meanings.includes("Memento Mori"));
  assert.ok(skull.pairings.includes("Rosen"));
  assert.ok(skull.related.every((slug) => slug !== "skull-tattoos"));

  const spotlight = buildTattooMotifSpotlight({ slug: "skull-tattoos", title: "Skull Tattoos", content: SKULL_HTML });
  assert.equal(spotlight.curated, true);
  assert.equal(spotlight.motif, "Skull");
  assert.equal(spotlight.pullQuote, skull.pullQuote);
  assert.equal(spotlight.readingMinutes, 1);
});

test("uncurated motifs fall back to what the article text itself names", () => {
  const spotlight = buildTattooMotifSpotlight({
    slug: "anker-tattoos",
    title: "Anker Tattoos – Bedeutung und Herkunft",
    content: "<p>Der Anker steht für Treue und Hoffnung. Seeleute trugen ihn auf dem Unterarm oder der Brust.</p>",
  });

  assert.equal(spotlight.curated, false);
  assert.equal(spotlight.motif, "Anker");
  assert.deepEqual(spotlight.meanings, ["Treue", "Hoffnung"]);
  assert.deepEqual(spotlight.placements, ["Unterarm", "Brust"]);
  assert.match(spotlight.flirtHook.text, /Geschichte/);
  assert.equal(spotlight.pullQuote, "Der Anker steht für Treue und Hoffnung.");
});

test("related articles prefer the curated picks and fill up with lexicon neighbours", () => {
  const hub = ["anker-tattoos", "blumen-tattoos", "old-school-tattoos", "skull-tattoos", "wolf-tattoo"];

  assert.deepEqual(pickRelatedSlugs("skull-tattoos", hub, ["old-school-tattoos", "gibt-es-nicht"]), [
    "old-school-tattoos",
    "wolf-tattoo",
    "anker-tattoos",
  ]);
  assert.deepEqual(pickRelatedSlugs("unbekannt", ["a", "b"], []), ["a", "b"]);
});

test("the magazine detail renders the motif experience only for Tattoo-Lexikon articles", async () => {
  const detail = await readSource("../components/magazine-detail.tsx");

  assert.match(detail, /const isTattooLexikonArticle = hub\?\.slug === TATTOO_HUB\.slug/);
  assert.match(detail, /<TattooMotifArticle market=\{market\} html=\{renderedContent\} spotlight=\{motifSpotlight\} \/>/);
  assert.match(detail, /<MarketHtmlContent market=\{market\} html=\{renderedContent\} \/>/);
  assert.ok(detail.indexOf("<TattooLexikonMore") < detail.indexOf("<IconyMagazineWidgets"));
});
