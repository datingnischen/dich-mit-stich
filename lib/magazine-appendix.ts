const HEADING = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
/** Blocks this module never pulls into an appendix — they carry their own card design. */
const OWN_CARD = /<(?:aside|figure)\b/i;
const TRAILING_CLOSERS = /(?:\s*<\/(?:article|section|div|main|aside|figure)>)+\s*$/i;

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
 * Moves the closing "Stand, Quellen & Transparenz" run of an article into its own block so it
 * reads as reference material instead of competing with the body copy for attention.
 */
export function normalizeMagazineAppendix(html: string) {
  const headings = [...html.matchAll(HEADING)].map((match) => {
    const start = match.index ?? 0;
    return {
      start,
      end: start + match[0].length,
      level: Number(match[1]),
      isAppendix: isAppendixHeading(plainText(match[2])),
    };
  });
  if (!headings.some((heading) => heading.isAppendix)) return html;

  const sections: { start: number; end: number; html: string }[] = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!heading.isAppendix) continue;

    const next = headings.slice(index + 1).find((candidate) => !candidate.isAppendix);
    let end = next ? next.start : html.length;

    // A motif card or a Pinterest call-to-action below the sources stays outside the appendix.
    const ownCard = html.slice(heading.end, end).search(OWN_CARD);
    if (ownCard >= 0) end = heading.end + ownCard;

    // Never swallow the wrapper the editors opened around the whole article.
    const body = html.slice(heading.start, end).replace(TRAILING_CLOSERS, "");
    end = heading.start + body.length;

    sections.push({ start: heading.start, end, html: `<aside class="magazine-appendix">${body}</aside>` });
    while (index + 1 < headings.length && headings[index + 1].start < end) index += 1;
  }

  let result = "";
  let cursor = 0;
  for (const section of sections) {
    if (section.start < cursor) continue;
    result += html.slice(cursor, section.start) + section.html;
    cursor = section.end;
  }
  return result + html.slice(cursor);
}
