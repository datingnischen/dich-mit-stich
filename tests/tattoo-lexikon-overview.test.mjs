import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const { TATTOO_LEXIKON_SERIES, lexikonAnchor, parseLexikonBlocks, seriesLabel } = await import(
  "../lib/tattoo-lexikon-overview.ts"
);
const { TATTOO_MOTIF_PROFILES } = await import("../lib/tattoo-motifs.ts");

const LEXIKON_HTML = `<p>Diese Übersicht sammelt Tattoo-Themen.</p>
<h2>Tattoo-Ratgeber</h2>
<ul>
<li><a href="/magazin/erste-tattoo-stechen-lassen/">Ein erstes Tattoo stechen lassen</a></li>
<li><a href="https://dich-mit-stich.de/magazin/vegane-tattoos/">Vegane Tattoos</a></li>
</ul>
<h3>Worauf du achten kannst</h3>
<ul><li>Ein Punkt ohne Link</li></ul>
<ul><li><a href="https://evil.example/magazin/fake/">Fremd</a></li></ul>
<p><strong>Wo fange ich an?</strong><br />Am besten mit den Ratgebern.</p>`;

const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

test("only pure article link lists become card groups; all other text stays HTML", () => {
  const blocks = parseLexikonBlocks(LEXIKON_HTML);

  assert.deepEqual(blocks.map((block) => block.kind), ["html", "links", "html"]);
  assert.equal(blocks[1].heading, "Tattoo-Ratgeber");
  assert.deepEqual(blocks[1].links, [
    { slug: "erste-tattoo-stechen-lassen", label: "Ein erstes Tattoo stechen lassen" },
    { slug: "vegane-tattoos", label: "Vegane Tattoos" },
  ]);
  assert.match(blocks[2].html, /Ein Punkt ohne Link/);
  assert.match(blocks[2].html, /evil\.example/);

  const rebuilt = blocks.map((block) => (block.kind === "html" ? text(block.html) : block.links.map((link) => link.label).join(" "))).join(" ");
  assert.equal(rebuilt, text(LEXIKON_HTML));
});

test("jump anchors are stable ASCII ids", () => {
  assert.equal(lexikonAnchor("Tattoos und ihre Symboliken", 3), "lexikon-tattoos-und-ihre-symboliken");
  assert.equal(lexikonAnchor("Größe & Stil", 0), "lexikon-groesse-stil");
  assert.equal(lexikonAnchor("", 4), "lexikon-5");
});

test("the series groups list profiled articles and shorten their titles for cards", () => {
  for (const series of TATTOO_LEXIKON_SERIES) {
    assert.ok(series.slugs.every((slug) => TATTOO_MOTIF_PROFILES[slug]), series.heading);
  }
  assert.equal(seriesLabel("Floral Sleeve Tattoo &#8211; Rosen und Blätter"), "Floral Sleeve Tattoo");
});

test("the lexicon page renders the overview instead of its plain link lists", async () => {
  const detail = await readSource("../components/magazine-detail.tsx");

  assert.match(detail, /entry\.slug === TATTOO_HUB\.slug \? \(\s*<TattooLexikonOverview market=\{market\} html=\{renderedContent\} \/>/);
});
