import { decodeHtmlEntities, stripHtml } from "./wordpress.ts";

import { PIERCING_MOTIF_PROFILES } from "./piercing-motif-profiles.ts";
import { TATTOO_MOTIF_PROFILES, type TattooMotifProfile } from "./tattoo-motif-profiles.ts";

export { PIERCING_MOTIF_PROFILES, TATTOO_MOTIF_PROFILES, type TattooMotifProfile };

export type MotifTopic = "tattoo" | "piercing";

const PROFILES_BY_TOPIC: Record<MotifTopic, Record<string, TattooMotifProfile>> = {
  tattoo: TATTOO_MOTIF_PROFILES,
  piercing: PIERCING_MOTIF_PROFILES,
};

/** The topic whose profiles cover this article, or null when neither does. */
export function motifTopicForSlug(slug: string): MotifTopic | null {
  const key = slug.toLowerCase();
  if (Object.hasOwn(TATTOO_MOTIF_PROFILES, key)) return "tattoo";
  if (Object.hasOwn(PIERCING_MOTIF_PROFILES, key)) return "piercing";
  return null;
}

export function motifProfile(topic: MotifTopic, slug: string): TattooMotifProfile | undefined {
  const profiles = PROFILES_BY_TOPIC[topic];
  const key = slug.toLowerCase();
  return Object.hasOwn(profiles, key) ? profiles[key] : undefined;
}

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

const MEANING_WORDS = [
  "Liebe", "Treue", "Hoffnung", "Freiheit", "Stärke", "Kraft", "Mut", "Schutz", "Erinnerung",
  "Vergänglichkeit", "Glück", "Familie", "Freundschaft", "Loyalität", "Neuanfang", "Weisheit",
  "Spiritualität", "Frieden",
];

const PLACEMENT_WORDS = [
  "Handgelenk", "Hand", "Finger", "Oberarm", "Unterarm", "Schulter", "Brust", "Rücken", "Nacken",
  "Rippen", "Bauch", "Oberschenkel", "Wade", "Knöchel", "Fuß", "Hals",
];

const PIERCING_PLACEMENT_WORDS = [
  "Ohrläppchen", "Ohrmuschel", "Knorpel", "Nase", "Nasenflügel", "Nasenscheidewand", "Augenbraue",
  "Lippe", "Unterlippe", "Oberlippe", "Zunge", "Wange", "Kinn", "Bauchnabel", "Brustwarze", "Brust",
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

function titleBase(title: string) {
  return title
    .split(/\s[–-]\s|:/)[0]
    .replace(/\b(?:Das|Der|Die)\s+/g, "")
    .trim() || title;
}

function motifFromTitle(title: string, topic: MotifTopic) {
  const base = titleBase(title);
  const noun = topic === "tattoo" ? /[\s-]*Tattoos?\b/gi : /[\s-]+Piercings?\b/gi;
  return base.replace(noun, "").trim() || base;
}

/** Copy for articles without a profile; the motif name comes from the article title. */
function fallbackCopy(topic: MotifTopic, title: string, text: string) {
  const motif = motifFromTitle(title, topic);

  if (topic === "piercing") {
    return {
      motif,
      glanceTitle: `${titleBase(title)} in 20 Sekunden`,
      facts: [{ label: "Sitzt an", items: wordsInOrder(text, PIERCING_PLACEMENT_WORDS, 4) }],
      flirtHook: {
        title: "Der beste Eisbrecher",
        text: "Ein Piercing ist fast immer eine bewusste Entscheidung. Frag, wann und warum es dazukam – das ist ein ehrlicher Einstieg ins Gespräch und sagt mehr als jedes Profilbild.",
      },
      hookLinkLabel: "Gepiercte Singles in deiner Nähe entdecken →",
      sceneLine: "Bei Dich mit Stich zeigen Singles ihre Piercings und Tattoos im Profil – hier fällt dein Schmuck auf, ohne dass du ihn erklären musst.",
    };
  }

  return {
    motif,
    glanceTitle: `${motif} Tattoo in 20 Sekunden`,
    facts: [
      { label: "Steht für", items: wordsInOrder(text, MEANING_WORDS, 5) },
      { label: "Beliebt auf", items: wordsInOrder(text, PLACEMENT_WORDS, 4) },
    ],
    flirtHook: {
      title: "Der beste Eisbrecher",
      text: `Hinter fast jedem ${motif}-Tattoo steckt eine Geschichte. Frag danach – das sagt mehr als jedes Profilbild und ist der ehrlichste Einstieg ins Gespräch.`,
    },
    hookLinkLabel: `${motif}-Fans in deiner Nähe entdecken →`,
    sceneLine: "Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – hier musst du dein Motiv niemandem erklären.",
  };
}

function fallbackPullQuote(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]/g) ?? [];
  return sentences
    .map((sentence) => sentence.trim())
    .find((sentence) => sentence.length >= 30 && sentence.length <= 170 && /steht für|symbol|bedeut/i.test(sentence)) ?? null;
}

function normalizeQuoteText(text: string) {
  // Stripping inline tags leaves a space before punctuation that followed them ("<strong>x</strong>.").
  return text.replace(/[„“”"]/g, '"').replace(/\s+/g, " ").replace(/ ([.,;:!?])/g, "$1").trim();
}

export function buildTattooMotifSpotlight(
  entry: { slug: string; title: string; content: string },
  topic: MotifTopic = "tattoo",
): TattooMotifSpotlight {
  const minutes = readingMinutes(entry.content);
  const text = plainText(entry.content);
  const profile = motifProfile(topic, entry.slug);

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

  const copy = fallbackCopy(topic, plainTitle(entry.title), text);
  return {
    ...copy,
    facts: copy.facts.filter((fact) => fact.items.length),
    pullQuote: fallbackPullQuote(text),
    related: [],
    curated: false,
    readingMinutes: minutes,
  };
}

/** Curated picks (hub or profiled articles) first, then the hub neighbours, wrapping around. */
export function pickRelatedSlugs(slug: string, hubSlugs: readonly string[], preferred: readonly string[], count = 3) {
  const own = slug.toLowerCase();
  const available = hubSlugs.filter((candidate) => candidate !== own);
  const position = hubSlugs.indexOf(own);
  const neighbours = position < 0
    ? available
    : [...hubSlugs.slice(position + 1), ...hubSlugs.slice(0, position)];

  const known = (candidate: string) => available.includes(candidate) || (candidate !== own && motifTopicForSlug(candidate) !== null);
  const picks = [...preferred.filter(known), ...neighbours];
  return [...new Set(picks)].slice(0, count);
}
