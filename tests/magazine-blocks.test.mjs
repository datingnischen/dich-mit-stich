import assert from "node:assert/strict";
import test from "node:test";

const { marketizeSanitizedHtml } = await import("../lib/market-html.ts");
const { extractMagazineFaq } = await import("../lib/magazine-blocks.ts");
const { getMagazineEntryBySlug } = await import("../lib/magazine.ts");

test("mag-* Bausteine behalten ihre Klassen, fremde Klassen fallen weg", () => {
  const html = marketizeSanitizedHtml(
    '<div class="mag-stats wp-block-columns"><p class="mag-stat"><strong class="mag-stat-value">35 %</strong></p></div><ol class="mag-steps"><li class="mag-step">a</li></ol>',
    "de",
  );
  assert.match(html, /<div class="mag-stats">/);
  assert.match(html, /<strong class="mag-stat-value">/);
  assert.match(html, /<ol class="mag-steps"><li class="mag-step">/);
  assert.doesNotMatch(html, /wp-block/);
});

test("Balkenbreite nur als Prozentwert und nur an mag-bar", () => {
  const html = marketizeSanitizedHtml(
    '<span class="mag-bar" style="width:44%;color:red"></span><span class="mag-bar" style="width:140%"></span><span class="x" style="width:10%"></span>',
    "de",
  );
  assert.match(html, /<span class="mag-bar" style="width:44%"><\/span>/);
  assert.doesNotMatch(html, /140%|color:red|width:10%/);
});

test("FAQ-Bausteine werden zu FAQPage-Fragen", () => {
  const faq = extractMagazineFaq(
    '<section class="mag-faq"><details class="mag-faq-item"><summary>Frage?</summary><div class="mag-faq-answer"><p>Antwort &amp; mehr</p></div></details></section>',
  );
  assert.deepEqual(faq, [{ question: "Frage?", answer: "Antwort & mehr" }]);
});

test("Studienartikel nutzt Bausteine und FAQ-Fragen", async () => {
  const entry = await getMagazineEntryBySlug("tattoos-attraktivitaet-studien");
  for (const block of ["mag-stats", "mag-chart", "mag-studies", "mag-steps", "mag-verdict", "mag-faq"]) {
    assert.match(entry.content, new RegExp(`class="${block}"`), block);
  }
  assert.ok(extractMagazineFaq(entry.content).length >= 4);
});
