import { decodeHtmlEntities } from "./wordpress.ts";

/**
 * Curated extras for a Tattoo-Lexikon motif. Everything here is editorial copy that sits around
 * the WordPress article; motifs without a profile fall back to what their own text names.
 */
export type TattooMotifProfile = {
  motif: string;
  meanings: readonly string[];
  placements: readonly string[];
  pairings: readonly string[];
  flirtHook: { title: string; text: string };
  sceneLine: string;
  /** A sentence from the article itself, so the highlighted quote never says more than the text. */
  pullQuote: string;
  related: readonly string[];
};

export const TATTOO_MOTIF_PROFILES: Record<string, TattooMotifProfile> = {
  "skull-tattoos": {
    motif: "Skull",
    meanings: ["Vergänglichkeit", "Memento Mori", "Erinnerung", "Glücksbringer", "Leben & Tod als Einheit"],
    placements: ["Hand", "Oberarm", "Unterarm", "Brust"],
    pairings: ["Rosen", "Schlangen", "Schriftzüge", "Sugar-Skull-Ornamente"],
    flirtHook: {
      title: "Eisbrecher mit Tiefgang",
      text:
        "Ein Totenkopf ist selten nur Deko. Frag nach der Geschichte dahinter – Memento Mori, Erinnerung an jemanden oder pure Liebe zum Old School? Die Antwort verrät mehr als jedes Profilbild.",
    },
    sceneLine:
      "Wer einen Schädel trägt, hat genug von „Ist das nicht ein bisschen düster?“. Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – hier versteht man dein Motiv.",
    pullQuote:
      "Im 21. Jahrhundert ist er längst in der Popkultur angekommen und wird oft nur unter ästhetischen Aspekten betrachtet.",
    related: ["old-school-tattoos", "blumen-tattoos", "wolf-tattoo"],
  },
};

export type TattooMotifSpotlight = Omit<TattooMotifProfile, "related" | "pullQuote"> & {
  curated: boolean;
  pullQuote: string | null;
  readingMinutes: number;
  related: readonly string[];
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

const WORDS_PER_MINUTE = 200;

function plainText(html = "") {
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
 * Splits the article before every top-level h2/h3. When a heading sits inside a wrapper the
 * pieces would cut through open tags, so the article then stays in one piece.
 */
export function splitArticleSections(html = "") {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const sections = trimmed.split(/(?=<h[23][\s>])/i).filter((section) => section.trim());
  return sections.every(isBalanced) ? sections : [trimmed];
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

export function buildTattooMotifSpotlight(entry: { slug: string; title: string; content: string }): TattooMotifSpotlight {
  const minutes = readingMinutes(entry.content);
  const profile = TATTOO_MOTIF_PROFILES[entry.slug.toLowerCase()];
  if (profile) return { ...profile, curated: true, readingMinutes: minutes };

  const text = plainText(entry.content);
  const motif = motifFromTitle(plainText(entry.title));
  return {
    motif,
    meanings: wordsInOrder(text, MEANING_WORDS, 5),
    placements: wordsInOrder(text, PLACEMENT_WORDS, 4),
    pairings: [],
    flirtHook: {
      title: "Der beste Eisbrecher",
      text: `Hinter fast jedem ${motif}-Tattoo steckt eine Geschichte. Frag danach – das sagt mehr als jedes Profilbild und ist der ehrlichste Einstieg ins Gespräch.`,
    },
    sceneLine: "Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – hier musst du dein Motiv niemandem erklären.",
    pullQuote: fallbackPullQuote(text),
    related: [],
    curated: false,
    readingMinutes: minutes,
  };
}

/** Curated picks first, then the articles following this one in the lexicon, wrapping around. */
export function pickRelatedSlugs(slug: string, hubSlugs: readonly string[], preferred: readonly string[], count = 3) {
  const own = slug.toLowerCase();
  const available = hubSlugs.filter((candidate) => candidate !== own);
  const position = hubSlugs.indexOf(own);
  const neighbours = position < 0
    ? available
    : [...hubSlugs.slice(position + 1), ...hubSlugs.slice(0, position)];

  const picks = [...preferred.filter((candidate) => available.includes(candidate)), ...neighbours];
  return [...new Set(picks)].slice(0, count);
}
