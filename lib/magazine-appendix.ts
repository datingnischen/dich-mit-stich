const HEADING = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const TAG = /<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi;
const CLOSING_TAG = /<\/([a-z][a-z0-9]*)>$/i;
const EMPTY_WRAPPER = /<(blockquote|p|div|section|figure)\b[^>]*>\s*<\/\1>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
/** Blocks this module never pulls into an appendix — they carry their own card design. */
const OWN_CARD = /<(?:aside|figure)\b/i;

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Headings that end an article rather than continue it: the transparency note, the source
 * list, image credits. They are reference material, not part of the read.
 */
const APPENDIX_HEADINGS = [
  /^stand,?\s+quellen/i,
  /^stand der informationen/i,
  /^(?:genutzte|verwendete|weiterführende)?\s*quellen\b/i,
  /^transparenz/i,
  /^bildquelle/i,
  /^bildnachweis/i,
  /^redaktioneller hinweis/i,
  /^rechtlicher hinweis/i,
  /^medizinischer hinweis/i,
  /^disclaimer/i,
];

export const MAGAZINE_APPENDIX_CLASS_TOKENS = new Set(["magazine-appendix"]);

function plainText(html: string) {
  return html
    .replace(HTML_COMMENT, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#0*160;/gi, " ")
    .replace(/&amp;|&#0*38;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isAppendixHeading(text: string) {
  return APPENDIX_HEADINGS.some((pattern) => pattern.test(text));
}

/**
 * Walks forward from an appendix heading and stops at the first tag that closes an element
 * opened before it. The editors sometimes put an image credit inside a blockquote at the very
 * top of an article; without this the block would drag the article body along behind it.
 */
function sectionEnd(html: string, from: number, limit: number) {
  const stack: string[] = [];
  TAG.lastIndex = from;
  for (let match = TAG.exec(html); match && match.index < limit; match = TAG.exec(html)) {
    const tag = match[2].toLowerCase();
    if (match[3] === "/" || VOID_TAGS.has(tag)) continue;
    if (match[1] !== "/") {
      stack.push(tag);
      continue;
    }
    const opened = stack.lastIndexOf(tag);
    if (opened < 0) return match.index;
    stack.length = opened;
  }
  return limit;
}

/**
 * Finds where the article's own content ends, stepping over the closing tags of a wrapper the
 * editors opened around everything. A `</aside>` belonging to a card inside the article stops
 * the search; only a wrapper that opens the whole content is stepped over.
 */
function contentEnd(html: string) {
  let index = html.length;
  for (;;) {
    const head = html.slice(0, index).trimEnd();
    const closer = head.match(CLOSING_TAG);
    if (!closer) return index;
    const inner = head.slice(0, head.length - closer[0].length);
    const opening = `<${closer[1].toLowerCase()}`;
    const start = inner.trimStart().toLowerCase();
    if (!start.startsWith(`${opening} `) && !start.startsWith(`${opening}>`)) return index;
    index = inner.length;
  }
}

/**
 * Moves the closing "Stand, Quellen & Transparenz" run of an article into its own block at the
 * very end, so it reads as reference material instead of competing with the body copy. The
 * editors place it inconsistently — sometimes before the related reading, sometimes after, and
 * image credits sit at the top.
 */
export function normalizeMagazineAppendix(html: string) {
  const headings = [...html.matchAll(HEADING)].map((match) => {
    const start = match.index ?? 0;
    return {
      start,
      end: start + match[0].length,
      isAppendix: isAppendixHeading(plainText(match[2])),
    };
  });
  if (!headings.some((heading) => heading.isAppendix)) return html;

  const sections: { start: number; end: number; body: string }[] = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!heading.isAppendix) continue;

    const next = headings.slice(index + 1).find((candidate) => !candidate.isAppendix);
    let end = next ? next.start : html.length;

    // A motif card or a Pinterest call-to-action below the sources stays outside the appendix.
    const ownCard = html.slice(heading.end, end).search(OWN_CARD);
    if (ownCard >= 0) end = heading.end + ownCard;
    end = sectionEnd(html, heading.start, end);

    sections.push({ start: heading.start, end, body: html.slice(heading.start, end).trim() });
    while (index + 1 < headings.length && headings[index + 1].start < end) index += 1;
  }
  if (sections.length === 0) return html;

  let stripped = "";
  let cursor = 0;
  for (const section of sections) {
    if (section.start < cursor) continue;
    stripped += html.slice(cursor, section.start);
    cursor = section.end;
  }
  stripped = (stripped + html.slice(cursor)).replace(EMPTY_WRAPPER, "");

  const block = `<aside class="magazine-appendix">${sections.map((section) => section.body).join("\n")}</aside>`;
  const end = contentEnd(stripped);
  return `${stripped.slice(0, end).trimEnd()}\n${block}${stripped.slice(end)}`;
}
