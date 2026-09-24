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

test("the inspiration series' article wrapper is dropped so its chapters split too, without losing text", () => {
  const series = `<p></p>
<h2>Artikel kurz anhören</h2><p>Die wichtigsten Punkte kurz und verständlich zusammengefasst.</p>
<article>
<p>Einleitung</p>
<h2>Beispiel</h2><figure><figcaption>Bild</figcaption></figure>
<h2>Was zeichnet es aus?</h2><ul><li>Punkt</li></ul>
</article>`;
  const sections = splitArticleSections(series);
  const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  assert.equal(sections.length, 3);
  assert.match(sections[0], /^<p><\/p>\s*<h2>Artikel kurz anhören/);
  assert.doesNotMatch(sections.join(""), /<\/?article/);
  assert.equal(text(sections.join(" ")), text(series));
});

test("every curated profile is complete, quotes a full sentence and links real tattoo articles", () => {
  const slugs = Object.keys(TATTOO_MOTIF_PROFILES);

  assert.ok(slugs.length >= 55);
  for (const [slug, profile] of Object.entries(TATTOO_MOTIF_PROFILES)) {
    assert.ok(profile.motif && profile.glanceTitle, slug);
    assert.ok(profile.facts.length >= 2 && profile.facts.every((fact) => fact.label && fact.items.length), slug);
    assert.ok(profile.flirtHook.title && profile.flirtHook.text && profile.sceneLine, slug);
    assert.match(profile.hookLinkLabel, / →$/, slug);
    assert.match(profile.pullQuote, /[.!?]$/, slug);
    assert.ok(profile.pullQuote.length >= 50 && profile.pullQuote.length <= 170, slug);
    assert.equal(profile.related.length, 3, slug);
    assert.ok(profile.related.every((related) => related !== slug && slugs.includes(related)), slug);
  }
});

test("the skull profile is curated and quotes the article itself", () => {
  const skull = TATTOO_MOTIF_PROFILES["skull-tattoos"];
  const withQuote = `${SKULL_HTML}<p>${skull.pullQuote}</p>`;

  assert.equal(skull.motif, "Skull");
  assert.ok(skull.facts.some((fact) => fact.items.includes("Memento Mori")));

  const spotlight = buildTattooMotifSpotlight({ slug: "skull-tattoos", title: "Skull Tattoos", content: withQuote });
  assert.equal(spotlight.curated, true);
  assert.equal(spotlight.glanceTitle, "Skull Tattoo in 20 Sekunden");
  assert.equal(spotlight.pullQuote, skull.pullQuote);
  assert.equal(spotlight.readingMinutes, 1);
});

test("a curated quote that no longer stands in the WordPress text is dropped instead of misquoting", () => {
  const spotlight = buildTattooMotifSpotlight({ slug: "skull-tattoos", title: "Skull Tattoos", content: SKULL_HTML });

  assert.equal(spotlight.curated, true);
  assert.equal(spotlight.pullQuote, null);
});

test("uncurated motifs fall back to what the article text itself names", () => {
  const spotlight = buildTattooMotifSpotlight({
    slug: "leuchtturm-tattoos",
    title: "Leuchtturm Tattoos – Bedeutung und Herkunft",
    content: "<p>Der Leuchtturm steht für Treue und Hoffnung. Seeleute trugen ihn auf dem Unterarm oder der Brust.</p>",
  });

  assert.equal(spotlight.curated, false);
  assert.equal(spotlight.motif, "Leuchtturm");
  assert.equal(spotlight.glanceTitle, "Leuchtturm Tattoo in 20 Sekunden");
  assert.deepEqual(spotlight.facts, [
    { label: "Steht für", items: ["Treue", "Hoffnung"] },
    { label: "Beliebt auf", items: ["Unterarm", "Brust"] },
  ]);
  assert.match(spotlight.flirtHook.text, /Geschichte/);
  assert.equal(spotlight.hookLinkLabel, "Leuchtturm-Fans in deiner Nähe entdecken →");
  assert.equal(spotlight.pullQuote, "Der Leuchtturm steht für Treue und Hoffnung.");
});

test("related articles prefer the curated picks and fill up with lexicon neighbours", () => {
  const hub = ["anker-tattoos", "blumen-tattoos", "old-school-tattoos", "skull-tattoos", "wolf-tattoo"];

  assert.deepEqual(pickRelatedSlugs("skull-tattoos", hub, ["old-school-tattoos", "gibt-es-nicht"]), [
    "old-school-tattoos",
    "wolf-tattoo",
    "anker-tattoos",
  ]);
  assert.deepEqual(pickRelatedSlugs("floral-sleeve-tattoo", hub, ["watercolor-sleeve-tattoo"]), [
    "watercolor-sleeve-tattoo",
    "anker-tattoos",
    "blumen-tattoos",
  ]);
  assert.deepEqual(pickRelatedSlugs("unbekannt", ["a", "b"], []), ["a", "b"]);
});

test("the magazine detail renders the motif experience for lexicon and profiled tattoo articles", async () => {
  const detail = await readSource("../components/magazine-detail.tsx");

  assert.match(detail, /hub\?\.slug === TATTOO_HUB\.slug \|\| hasTattooMotifProfile\(entry\.slug\)/);
  assert.match(detail, /motifSpotlight && !answerEngineEntry \? <TattooMotifGlance/);
  assert.match(detail, /<TattooMotifArticle market=\{market\} html=\{renderedContent\} spotlight=\{motifSpotlight\} \/>/);
  assert.match(detail, /<MarketHtmlContent market=\{market\} html=\{renderedContent\} \/>/);
  assert.ok(detail.indexOf("<TattooLexikonMore") < detail.indexOf("<IconyMagazineWidgets"));
});
