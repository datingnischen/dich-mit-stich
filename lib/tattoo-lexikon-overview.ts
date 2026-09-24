import { firstPartyInternalPath } from "./market-html.ts";
import { decodeHtmlEntities } from "./wordpress.ts";

/**
 * The Tattoo-Lexikon page as WordPress writes it, cut into prose and link lists. Every list whose
 * items are nothing but a link to a magazine article becomes a card group; everything else stays
 * HTML exactly as written, so the page keeps all of its text.
 */
export type LexikonLink = { slug: string; label: string };

export type LexikonBlock =
  | { kind: "html"; html: string }
  | { kind: "links"; heading: string; links: LexikonLink[] };

const LIST = /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi;
const LIST_ITEM = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
const SOLE_LINK = /^\s*<a\b[^>]*?\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*$/i;
const HEADING = /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
const MAGAZINE_ARTICLE_PATH = /^\/magazin\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\/?$/;

function plainText(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function articleSlug(href: string) {
  const path = firstPartyInternalPath(href.trim());
  return path?.split(/[?#]/, 1)[0].toLowerCase().match(MAGAZINE_ARTICLE_PATH)?.[1] ?? null;
}

function linkList(listHtml: string): LexikonLink[] | null {
  const items = [...listHtml.matchAll(LIST_ITEM)];
  const rest = listHtml.replace(LIST_ITEM, "").trim();
  if (!items.length || rest) return null;

  const links: LexikonLink[] = [];
  for (const [, inner] of items) {
    const match = inner.match(SOLE_LINK);
    const slug = match ? articleSlug(match[1]) : null;
    const label = match ? plainText(match[2]) : "";
    if (!slug || !label) return null;
    links.push({ slug, label });
  }
  return links;
}

function lastHeading(html: string) {
  const headings = [...html.matchAll(HEADING)];
  return headings.length ? plainText(headings[headings.length - 1][1]) : "";
}

export function parseLexikonBlocks(html = ""): LexikonBlock[] {
  const blocks: LexikonBlock[] = [];
  let cursor = 0;
  let prose = "";

  for (const match of html.matchAll(LIST)) {
    const links = linkList(match[1]);
    if (!links) continue;

    prose += html.slice(cursor, match.index);
    const heading = lastHeading(prose);
    if (prose.trim()) blocks.push({ kind: "html", html: prose });
    blocks.push({ kind: "links", heading, links });
    prose = "";
    cursor = match.index + match[0].length;
  }

  prose += html.slice(cursor);
  if (prose.trim()) blocks.push({ kind: "html", html: prose });
  return blocks;
}

export function lexikonAnchor(heading: string, index: number) {
  const slug = heading
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `lexikon-${slug || index + 1}`;
}

/** Article series the lexicon page does not list itself; they sit after its last card group. */
export const TATTOO_LEXIKON_SERIES = [
  {
    heading: "Inspirationen: Tribal Tattoos",
    intro: "Von Polynesien bis Borneo – sechs Tribal-Stile mit Herkunft, Symbolik und Beispielmotiv.",
    slugs: [
      "polynesische-tribal-tattoo",
      "maori-tribal-tattoo",
      "hawaiianische-tribal-tattoo",
      "borneo-tribal-tattoo",
      "afrikanische-tribal-tattoo",
      "aztekische-maya-tribal-tattoo",
    ],
  },
  {
    heading: "Inspirationen: Sleeve Tattoos",
    intro: "Ein ganzer Arm, ein Konzept: fünfzehn Sleeve-Stile mit Beispielmotiv und Planungstipps.",
    slugs: [
      "sleeve-tattoo-japanese",
      "black-grey-sleeve-tattoo",
      "floral-sleeve-tattoo",
      "animal-sleeve-tattoo",
      "skull-fire-sleeve-tattoo",
      "neo-traditional-sleeve-tattoo",
      "watercolor-sleeve-tattoo",
      "geometric-sleeve-tattoo",
      "tribal-maori-sleeve-tattoo",
      "trash-polka-sleeve-tattoo",
      "portrait-realism-sleeve-tattoo",
      "biomechanical-sleeve-tattoo",
      "mythology-sleeve-tattoo",
      "religious-sleeve-tattoo",
      "space-galaxy-sleeve-tattoo",
    ],
  },
] as const;

/** Card title for a series article: the part of its WordPress title before the first dash. */
export function seriesLabel(title: string) {
  return plainText(title).split(/\s[–-]\s/)[0].trim();
}
