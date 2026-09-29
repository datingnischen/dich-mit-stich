// Structure fixes for legacy WordPress article HTML (Semrush: "Paragraphs are too long", "Poor heading hierarchy").
// The WordPress text itself stays untouched; only the rendered markup is split and re-levelled.

export const MAX_PARAGRAPH_WORDS = 120;
const TARGET_PARAGRAPH_WORDS = 90;
const MIN_PARAGRAPH_WORDS = 25;

// Abbreviations whose full stop does not end a sentence.
const ABBREVIATIONS = new Set([
  "bzw", "ca", "dr", "etc", "evtl", "ggf", "inkl", "jh", "mio", "mrd", "nr", "prof", "sog", "st", "str", "tel", "usw", "vgl", "z.b", "u.a", "d.h",
]);

const SENTENCE_END = /[.!?][“”"»)]?$/;
const SENTENCE_START = /^[„"»(]?[A-ZÄÖÜ0-9]/;

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ");
}

function endsSentence(textBefore: string) {
  const lastWord = textBefore.trimEnd().split(/\s+/).at(-1) ?? "";
  if (!SENTENCE_END.test(lastWord)) return false;
  const bare = lastWord.replace(/[“”"»)]+$/, "").slice(0, -1).toLowerCase();
  // Single letters/digits ("z.", "1.") and known abbreviations are no sentence end.
  return bare.length > 1 && !/^\d+$/.test(bare) && !ABBREVIATIONS.has(bare);
}

/** Offsets in `inner` where a new sentence starts at top level (outside links and inline tags). */
function sentenceBoundaries(inner: string) {
  const boundaries: number[] = [];
  let depth = 0;
  const token = /<\/?([a-z0-9]+)[^>]*>|\s+/gi;
  let match: RegExpExecArray | null;
  while ((match = token.exec(inner))) {
    if (match[1]) {
      // Legacy texts fake paragraphs with <br />; a top-level line break is a natural split point.
      if (depth === 0 && /^br$/i.test(match[1])) boundaries.push(match.index + match[0].length);
      const selfClosing = /^(br|img|wbr)$/i.test(match[1]) || match[0].endsWith("/>");
      if (!selfClosing) depth += match[0].startsWith("</") ? -1 : 1;
      continue;
    }
    const next = match.index + match[0].length;
    if (depth === 0 && endsSentence(inner.slice(0, match.index)) && SENTENCE_START.test(inner.slice(next))) {
      boundaries.push(next);
    }
  }
  return boundaries;
}

const TRAILING_BREAKS = /(?:\s*<br\s*\/?>)+\s*$/i;

function splitParagraph(inner: string) {
  const total = countWords(plainText(inner));
  if (total <= MAX_PARAGRAPH_WORDS) return null;

  const perChunk = total / Math.ceil(total / TARGET_PARAGRAPH_WORDS);
  const chunks: string[] = [];
  let start = 0;
  for (const boundary of sentenceBoundaries(inner)) {
    const current = countWords(plainText(inner.slice(start, boundary)));
    const rest = countWords(plainText(inner.slice(boundary)));
    if (current >= perChunk - MIN_PARAGRAPH_WORDS / 2 && rest >= MIN_PARAGRAPH_WORDS) {
      chunks.push(inner.slice(start, boundary).replace(TRAILING_BREAKS, "").trim());
      start = boundary;
    }
  }
  if (!chunks.length) return null;
  chunks.push(inner.slice(start).trim());
  return chunks;
}

/** Splits plain <p> paragraphs longer than MAX_PARAGRAPH_WORDS at sentence ends into chunks of about 90 words. */
export function splitLongParagraphs(html: string) {
  return html.replace(/<p>((?:(?!<\/?(?:p|div|ul|ol|table|blockquote|h[1-6])\b)[\s\S])*?)<\/p>/gi, (paragraph, inner: string) => {
    const chunks = splitParagraph(inner);
    return chunks ? chunks.map((chunk) => `<p>${chunk}</p>`).join("\n") : paragraph;
  });
}

/** Article bodies sit below the page's h1: the first heading becomes at most h2 and no level is skipped. */
export function normalizeHeadingLevels(html: string) {
  // Open sections as [original level, rendered level]; a heading becomes one level below its parent section.
  const sections: Array<[number, number]> = [];
  let lastOpened = 0;
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (tag, closing: string, levelText: string, rest: string) => {
    if (closing) return `</h${lastOpened || levelText}>`;
    // A stray h1 in the body counts as a section heading; the page already has its own h1.
    const level = Math.max(2, Number(levelText));
    while (sections.length && sections[sections.length - 1][0] >= level) sections.pop();
    lastOpened = (sections.at(-1)?.[1] ?? 1) + 1;
    sections.push([level, lastOpened]);
    return `<h${lastOpened}${rest}>`;
  });
}
