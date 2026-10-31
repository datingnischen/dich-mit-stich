/**
 * Redaktionelle Bausteine im Magazin-HTML (Kennzahlen, Balken, Vergleiche, Studienkarten, FAQ).
 * Artikel sollen nicht nur aus Fließtext bestehen; die Bausteine stehen als Klassen `mag-*`
 * direkt im Beitrags-HTML und werden in `app/magazine-blocks.css` gestaltet. Übersicht und
 * Beispiele: `docs/magazin-bausteine.md`.
 */
export const MAGAZINE_BLOCK_CLASS = /^mag-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Tags, die einen Baustein tragen dürfen (nur Klassen, keine weiteren Attribute). */
export const MAGAZINE_BLOCK_TAGS = [
  "section", "div", "aside", "figure", "figcaption", "p", "span", "strong", "small",
  "ul", "ol", "li", "h2", "h3", "h4", "details", "summary", "table",
] as const;

/** Balkenlänge in Prozent – der einzige Inline-Style, den Magazin-HTML behalten darf. */
export const MAGAZINE_BAR_WIDTH = /^(?:100|\d{1,2}(?:\.\d+)?)%$/;

export type MagazineFaqItem = { question: string; answer: string };

const FAQ_ITEM = /<details\b[^>]*\bclass="[^"]*\bmag-faq-item\b[^"]*"[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fragen und Antworten aus `<details class="mag-faq-item">` für das FAQPage-Schema. */
export function extractMagazineFaq(html: string): MagazineFaqItem[] {
  return [...html.matchAll(FAQ_ITEM)]
    .map(([, question, answer]) => ({ question: plainText(question), answer: plainText(answer) }))
    .filter((item) => item.question && item.answer);
}
