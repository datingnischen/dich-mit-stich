// Seitensuche unter „Über uns“. nginx reicht auf den Live-Domains nur bestimmte Pfade an Next.js durch,
// /ueber-uns/ gehört dazu. /suche/ gehört der ICONY-Plattform und darf hier nie entstehen.
export const ABOUT_SEARCH_PATH = "/ueber-uns/suche";
export const SEARCH_RESULT_LIMIT = 50;
export const SEARCH_QUERY_MAX_LENGTH = 100;

export type SearchArea =
  | "Magazin"
  | "Lexikon"
  | "Themenwelt"
  | "Ratgeber"
  | "Stadt"
  | "Studio-Guide"
  | "Tattoo-Studio"
  | "Über uns"
  | "FAQ";

export type SearchDocument = {
  area: SearchArea;
  title: string;
  excerpt: string;
  /** Zusätzlicher Suchtext, der nicht angezeigt wird (Region, Stile, Kategorien …). */
  keywords?: string;
  /** Präfixfreier Seitenpfad, Links baut MarketLink. */
  pathname: string;
};

export type SearchResult = SearchDocument & { score: number };

/** Kleinschreibung, ä/ö/ü/ß ≙ ae/oe/ue/ss, Diakritika weg, Satzzeichen zu Leerzeichen. */
export function normalizeSearchText(value = ""): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Zweite Schreibweise ohne Umlaut-Auflösung, damit auch „Zurich“ oder „Koln“ „Zürich“ und „Köln“ finden. */
function foldDiacritics(value = ""): string {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchable(value: string) {
  const normalized = normalizeSearchText(value);
  const folded = foldDiacritics(value);
  return folded === normalized ? normalized : `${normalized} ${folded}`;
}

export function cleanSearchQuery(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, SEARCH_QUERY_MAX_LENGTH) : "";
}

export function searchTerms(query: string): string[] {
  return [...new Set(normalizeSearchText(query).split(" ").filter((term) => term.length > 0))];
}

function containsWordStart(haystack: string, term: string) {
  return ` ${haystack}`.includes(` ${term}`);
}

/**
 * Jeder Suchbegriff muss irgendwo vorkommen. Titeltreffer zählen deutlich mehr als Auszug oder Stichwörter,
 * ein Treffer am Wortanfang mehr als mitten im Wort.
 */
export function scoreSearchDocument(document: SearchDocument, terms: string[]): number {
  if (terms.length === 0) return 0;
  const title = normalizeSearchText(document.title);
  const titleVariants = searchable(document.title);
  const body = searchable(`${document.excerpt} ${document.keywords ?? ""} ${document.area}`);
  let score = 0;

  for (const term of terms) {
    if (titleVariants.includes(term)) {
      score += containsWordStart(titleVariants, term) ? 100 : 60;
    } else if (body.includes(term)) {
      score += containsWordStart(body, term) ? 20 : 10;
    } else {
      return 0;
    }
  }

  const phrase = terms.join(" ");
  if (terms.length > 1 && title.includes(phrase)) score += 50;
  if (title === phrase) score += 80;
  else if (title.startsWith(phrase)) score += 30;
  return score;
}

export function searchDocuments(documents: SearchDocument[], query: string, limit = SEARCH_RESULT_LIMIT): SearchResult[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const seen = new Set<string>();

  return documents
    .map((document) => ({ ...document, score: scoreSearchDocument(document, terms) }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "de"))
    .filter((result) => {
      const key = `${result.pathname.replace(/\/+$/, "")}|${normalizeSearchText(result.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function shortenExcerpt(text: string, maxLength = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > maxLength * 0.6 ? lastSpace : maxLength).replace(/[\s,.;:–-]+$/, "")} …`;
}
