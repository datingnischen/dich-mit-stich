import { decodeHtmlEntities, stripHtml } from "./wordpress.ts";

import { TATTOO_MOTIF_PROFILES, type TattooMotifProfile } from "./tattoo-motif-profiles.ts";

export { TATTOO_MOTIF_PROFILES, type TattooMotifProfile };

export type TattooMotifFact = { label: string; items: readonly string[] };

export type TattooMotifSpotlight = {
  motif: string;
  glanceTitle: string;
  facts: readonly TattooMotifFact[];
  flirtHook: { title: string; text: string };
  hookLinkLabel: string;
  sceneLine: string;
  pullQuote: string | null;
  related: readonly string[];
  curated: boolean;
  readingMinutes: number;
};

export function hasTattooMotifProfile(slug: string) {
  return Object.hasOwn(TATTOO_MOTIF_PROFILES, slug.toLowerCase());
}

const MEANING_WORDS = [
  "Liebe", "Treue", "Hoffnung", "Freiheit", "Stärke", "Kraft", "Mut", "Schutz", "Erinnerung",
  "Vergänglichkeit", "Glück", "Familie", "Freundschaft", "Loyalität", "Neuanfang", "Weisheit",
  "Spiritualität", "Frieden",
];

const PLACEMENT_WORDS = [
  "Handgelenk", "Hand", "Finger", "Oberarm", "Unterarm", "Schulter", "Brust", "Rücken", "Nacken",
  "Rippen", "Bauch", "Oberschenkel", "Wade", "Knöchel", "Fuß", "Hals",
];

const WORDS_PER_MINUTE = 200;

function plainText(html = "") {
  return stripHtml(html);
}

function plainTitle(html = "") {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function readingMinutes(html = "") {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const WRAPPER_TAGS = ["div", "section", "article", "blockquote", "figure", "ul", "ol", "table"];

function isBalanced(html: string) {
  return WRAPPER_TAGS.every((tag) => {
    const opened = html.match(new RegExp(`<${tag}\\b`, "gi"))?.length ?? 0;
    const closed = html.match(new RegExp(`</${tag}>`, "gi"))?.length ?? 0;
    return opened === closed;
  });
}

/**
 * Splits the article before every top-level h2/h3. The inspiration series wraps its whole text in
 * one <article>, which only groups and carries no content, so that wrapper is dropped first. When
 * a heading still sits inside another wrapper, the pieces would cut through open tags, so the
 * article then stays in one piece. Leading pieces without visible text join the next one.
 */
export function splitArticleSections(html = "") {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const unwrapped = trimmed.replace(/<\/?article\b[^>]*>/gi, "").trim();
  const pieces = unwrapped.split(/(?=<h[23][\s>])/i).filter((section) => section.trim());
  if (!pieces.every(isBalanced)) return [trimmed];

  const sections: string[] = [];
  let carry = "";
  for (const piece of pieces) {
    if (!sections.length && !stripHtml(carry + piece)) {
      carry += piece;
      continue;
    }
    sections.push(carry + piece);
    carry = "";
  }
  if (carry) sections.push(carry);
  return sections;
}

/** Section counts after which the flirt hook and the pull quote are inserted. */
export function planArticleSlots(sectionCount: number) {
  const hookAfter = sectionCount >= 3 ? 2 : 1;
  const quoteAfter = sectionCount >= 4
    ? Math.min(sectionCount - 1, hookAfter + Math.max(1, Math.round((sectionCount - hookAfter) / 2)))
    : null;
  return { hookAfter, quoteAfter };
}

function wordsInOrder(text: string, vocabulary: readonly string[], limit: number) {
  return vocabulary
    .map((word) => ({ word, index: text.search(new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, "u")) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map(({ word }) => word);
}

function motifFromTitle(title: string) {
  return title
    .split(/\s[–-]\s|:/)[0]
    .replace(/\b(?:Das|Der|Die)\s+/g, "")
    .replace(/[\s-]*Tattoos?\b/gi, "")
    .trim() || title;
}

function fallbackPullQuote(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]/g) ?? [];
  return sentences
    .map((sentence) => sentence.trim())
    .find((sentence) => sentence.length >= 30 && sentence.length <= 170 && /steht für|symbol|bedeut/i.test(sentence)) ?? null;
}

function normalizeQuoteText(text: string) {
  return text.replace(/[„“”"]/g, '"').replace(/\s+/g, " ").trim();
}

export function buildTattooMotifSpotlight(entry: { slug: string; title: string; content: string }): TattooMotifSpotlight {
  const minutes = readingMinutes(entry.content);
  const text = plainText(entry.content);
  const profile = TATTOO_MOTIF_PROFILES[entry.slug.toLowerCase()];

  if (profile) {
    // The quote must still stand in the article; an edited WordPress text drops it instead of misquoting.
    const quoteStillInText = normalizeQuoteText(text).includes(normalizeQuoteText(profile.pullQuote));
    return {
      motif: profile.motif,
      glanceTitle: profile.glanceTitle,
      facts: profile.facts,
      flirtHook: profile.flirtHook,
      hookLinkLabel: profile.hookLinkLabel,
      sceneLine: profile.sceneLine,
      pullQuote: quoteStillInText ? profile.pullQuote : null,
      related: profile.related,
      curated: true,
      readingMinutes: minutes,
    };
  }

  const motif = motifFromTitle(plainTitle(entry.title));
  const facts: TattooMotifFact[] = [
    { label: "Steht für", items: wordsInOrder(text, MEANING_WORDS, 5) },
    { label: "Beliebt auf", items: wordsInOrder(text, PLACEMENT_WORDS, 4) },
  ];
  return {
    motif,
    glanceTitle: `${motif} Tattoo in 20 Sekunden`,
    facts: facts.filter((fact) => fact.items.length),
    flirtHook: {
      title: "Der beste Eisbrecher",
      text: `Hinter fast jedem ${motif}-Tattoo steckt eine Geschichte. Frag danach – das sagt mehr als jedes Profilbild und ist der ehrlichste Einstieg ins Gespräch.`,
    },
    hookLinkLabel: `${motif}-Fans in deiner Nähe entdecken →`,
    sceneLine: "Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – hier musst du dein Motiv niemandem erklären.",
    pullQuote: fallbackPullQuote(text),
    related: [],
    curated: false,
    readingMinutes: minutes,
  };
}

/** Curated picks (lexicon or profiled articles) first, then the lexicon neighbours, wrapping around. */
export function pickRelatedSlugs(slug: string, hubSlugs: readonly string[], preferred: readonly string[], count = 3) {
  const own = slug.toLowerCase();
  const available = hubSlugs.filter((candidate) => candidate !== own);
  const position = hubSlugs.indexOf(own);
  const neighbours = position < 0
    ? available
    : [...hubSlugs.slice(position + 1), ...hubSlugs.slice(0, position)];

  const known = (candidate: string) => available.includes(candidate) || (candidate !== own && hasTattooMotifProfile(candidate));
  const picks = [...preferred.filter(known), ...neighbours];
  return [...new Set(picks)].slice(0, count);
}
