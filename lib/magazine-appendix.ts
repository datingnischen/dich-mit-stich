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
  /^gesundheitlicher hinweis/i,
  /^(?:gesundheits|rechts)hinweis/i,
  /^hinweis\s*$/i,
  /^haftungsausschluss/i,
  /^disclaimer/i,
];

/**
 * Medical and legal notices stay visible: they sit right above the collapsed block instead of
 * inside it. A heading of their own, or a paragraph in the appendix that reads like one.
 * "Redaktioneller Hinweis" is a transparency note and stays collapsed with the sources.
 */
const NOTICE_HEADING =
  /^(?:(?:medizinisch|rechtlich|gesundheitlich|wichtig)e[rn]?\s+hinweis|(?:gesundheits|rechts)hinweis|hinweis\s*$|haftungsausschluss|disclaimer)/i;
const NOTICE_TEXT = [
  /\bersetz\w*\s+(?:[^\s.]+\s+){0,3}?(?:keine|nicht)\b[^.]{0,160}?\b(?:beratung|diagnose|behandlung|untersuchung)/i,
  /\b(?:medizinisch|ärztlich|rechtlich)\w*\s+(?:hinweis|beratung|rat\b|abklärung)/i,
  /^(?:medizinischer|rechtlicher|gesundheitlicher|wichtiger)?\s*hinweis\s*:/i,
];
/** Paragraphs that are source lines however medical they sound. */
const SOURCE_LINE = /^(?:bildquellen?|bildnachweise?|quellen?|stand\b|genutzte quellen|verwendete quellen)/i;
const BLOCK_TAGS = new Set(["p", "ul", "ol", "div", "blockquote", "table", "figure", "section", "dl", "pre", "hr"]);
const BLOCK_START = /<(?:p|ul|ol|div|blockquote|table|figure|section|dl|pre|hr|h[1-6])\b/i;

export const MAGAZINE_APPENDIX_CLASS_TOKENS = new Set([
  "magazine-appendix",
  "magazine-sources",
  "magazine-sources__body",
  "magazine-sources__label",
  "magazine-notice",
  "magazine-notice__label",
]);

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
    // "<p>Intro</p> … <p>Schluss</p>" starts and ends with the same tag without one wrapping the other.
    if (firstElementEnd(html, head.length - head.trimStart().length) !== inner.length) return index;
    index = inner.length;
  }
}

/** Position of the closing tag that belongs to the element opened at `from`. */
function firstElementEnd(html: string, from: number) {
  const stack: string[] = [];
  TAG.lastIndex = from;
  for (let match = TAG.exec(html); match; match = TAG.exec(html)) {
    const tag = match[2].toLowerCase();
    if (match[3] === "/" || VOID_TAGS.has(tag)) continue;
    if (match[1] !== "/") {
      stack.push(tag);
      continue;
    }
    const opened = stack.lastIndexOf(tag);
    if (opened < 0) return -1;
    stack.length = opened;
    if (stack.length === 0) return match.index;
  }
  return -1;
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
  if (!headings.some((heading) => heading.isAppendix)) return collapseCredits(html);

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
  if (sections.length === 0) return collapseCredits(html);

  let stripped = "";
  let cursor = 0;
  for (const section of sections) {
    if (section.start < cursor) continue;
    stripped += html.slice(cursor, section.start);
    cursor = section.end;
  }
  stripped = (stripped + html.slice(cursor)).replace(EMPTY_WRAPPER, "");

  const extracted = extractCredits(stripped);
  return appendBlock(extracted.html, [...sections.map((section) => section.body), ...extracted.credits]);
}

/**
 * Image credits the editors put into a quote or paragraph of their own ("Bildquelle: …",
 * "Quellen: …") join the reference block as well, without a heading of their own.
 */
const CREDIT_QUOTE = /<blockquote\b[^>]*>((?:(?!<\/?blockquote\b)[\s\S])*?)<\/blockquote>/gi;
const CREDIT_PARAGRAPH = /<p\b[^>]*>(?:(?!<\/?p\b)[\s\S])*?<\/p>/gi;
const CREDIT_TEXT = /^(?:bildquellen?|bildnachweise?|quellen)\s*:/i;

function extractCredits(html: string) {
  const credits: string[] = [];
  const take = (block: string, inner: string) => {
    if (!CREDIT_TEXT.test(plainText(inner))) return block;
    credits.push(inner.trim());
    return "";
  };
  const withoutQuotes = html.replace(CREDIT_QUOTE, (block, inner: string) => take(block, inner));
  const withoutParagraphs = withoutQuotes.replace(CREDIT_PARAGRAPH, (block) => take(block, block));
  return { html: withoutParagraphs.replace(EMPTY_WRAPPER, ""), credits };
}

function collapseCredits(html: string) {
  const extracted = extractCredits(html);
  return extracted.credits.length > 0 ? appendBlock(extracted.html, extracted.credits) : html;
}

function escapeText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The reference block is a native, closed `details` element: small, at the very end and only
 * taking up room once a reader opens it. The leading heading becomes the summary; further
 * headings turn into small labels so they neither break the outline nor look like chapters.
 */
function appendBlock(html: string, bodies: string[]) {
  const { notice, sources } = separateNotice(bodies.join("\n"));
  let body = sources;
  const first = body.match(/^<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  const headingTexts = [...body.matchAll(HEADING)].map((match) => plainText(match[2]));
  const label = headingTexts.some((text) => /quell/i.test(text))
    ? notice ? "Quellen" : "Quellen & Transparenz"
    : headingTexts[0] || (notice ? "Quellen" : "Quellen & Transparenz");
  const firstText = first ? plainText(first[1]) : "";
  if (first && (firstText === label || /quell|transparenz/i.test(firstText))) body = body.slice(first[0].length).trimStart();
  body = body.replace(HEADING, (_match, _level, inner: string) => `<p class="magazine-sources__label">${inner.trim()}</p>`);

  const parts: string[] = [];
  if (notice) parts.push(['<div class="magazine-notice">', notice, "</div>"].join("\n"));
  if (plainText(body)) {
    parts.push(
      [
        '<details class="magazine-appendix magazine-sources">',
        `<summary>${escapeText(label)}</summary>`,
        '<div class="magazine-sources__body">',
        body,
        "</div>",
        "</details>",
      ].join("\n"),
    );
  }
  if (parts.length === 0) return html;
  const end = contentEnd(html);
  return `${html.slice(0, end).trimEnd()}\n${parts.join("\n")}${html.slice(end)}`;
}

/** Splits an appendix body into its top-level blocks: elements, or runs of loose inline content. */
function topLevelBlocks(body: string) {
  const blocks: string[] = [];
  let cursor = 0;
  while (cursor < body.length) {
    const rest = body.slice(cursor);
    const lead = rest.length - rest.trimStart().length;
    cursor += lead;
    if (cursor >= body.length) break;
    const opening = body.slice(cursor).match(/^<([a-z][a-z0-9]*)\b[^>]*?(\/?)>/i);
    const tag = opening?.[1].toLowerCase() ?? "";
    if (opening && (BLOCK_TAGS.has(tag) || /^h[1-6]$/.test(tag))) {
      if (opening[2] === "/" || VOID_TAGS.has(tag)) {
        blocks.push(opening[0]);
        cursor += opening[0].length;
        continue;
      }
      const close = firstElementEnd(body, cursor);
      if (close >= 0) {
        const closing = body.slice(close).match(/^<\/[a-z0-9]+\s*>/i);
        const end = close + (closing ? closing[0].length : 0);
        blocks.push(body.slice(cursor, end));
        cursor = end;
        continue;
      }
    }
    // Loose inline content (an image credit taken out of its quote) runs up to the next block.
    const next = body.slice(cursor + 1).search(BLOCK_START);
    const end = next < 0 ? body.length : cursor + 1 + next;
    blocks.push(body.slice(cursor, end).trimEnd());
    cursor = end;
  }
  return blocks;
}

function isNoticeParagraph(block: string) {
  if (!/^<p\b/i.test(block)) return false;
  const text = plainText(block);
  if (SOURCE_LINE.test(text)) return false;
  return NOTICE_TEXT.some((pattern) => pattern.test(text));
}

/**
 * Takes medical and legal notices out of the appendix: sections under a notice heading, and
 * paragraphs that say the text does not replace professional advice. Lists, credits and
 * source lines stay with the sources.
 */
function separateNotice(body: string) {
  const notice: string[] = [];
  const sources: string[] = [];
  let inNotice = false;
  for (const block of topLevelBlocks(body)) {
    const heading = block.match(/^<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>$/i);
    if (heading) {
      const text = plainText(heading[1]);
      inNotice = NOTICE_HEADING.test(text);
      if (inNotice) notice.push(`<p class="magazine-notice__label">${heading[1].trim()}</p>`);
      else sources.push(block);
      continue;
    }
    if (inNotice || isNoticeParagraph(block)) notice.push(block);
    else sources.push(block);
  }
  // A notice heading with nothing below it is not worth a box of its own.
  const hasNotice = notice.some((block) => !block.startsWith('<p class="magazine-notice__label">'));
  return { notice: hasNotice ? notice.join("\n") : "", sources: hasNotice ? sources.join("\n") : body };
}

/**
 * Location of the closing reference run — the visible notice, if any, and the collapsed
 * sources — so texts rendered in several pieces can move it to the very end as one unit.
 */
export function findMagazineAppendix(html: string) {
  const notice = html.indexOf('<div class="magazine-notice">');
  const details = html.indexOf('<details class="magazine-appendix');
  const start = notice >= 0 && (details < 0 || notice < details) ? notice : details;
  if (start < 0) return null;
  let end = firstElementEnd(html, start);
  if (end < 0) return null;
  end = html.indexOf(">", end) + 1;
  if (start === notice && details >= 0) {
    const between = html.slice(end, details);
    if (!between.trim()) {
      const close = firstElementEnd(html, details);
      if (close >= 0) end = html.indexOf(">", close) + 1;
    }
  }
  return { start, end };
}
