export type MagazineMarketCode = "de" | "at" | "ch";

export const MAGAZINE_SOURCE_LOADER_KEYS = [
  "posts",
  "pages",
  "categories",
  "routeEntries",
  "entryBySlug",
  "categoryBySlug",
  "entriesForCategory",
  "authorProfile",
  "authorPosts",
  "authorSlugs",
  "detailContext",
  "publishedProfileGraph",
] as const;

export function resolveMagazineMarketSource<T extends object>(
  market: MagazineMarketCode,
  sources: Partial<Record<MagazineMarketCode, T>>,
): T | null {
  const source = sources[market];
  if (!source) return null;
  const candidate = source as Record<string, unknown>;
  return MAGAZINE_SOURCE_LOADER_KEYS.every((key) => typeof candidate[key] === "function") ? source : null;
}

const EMPTY_MAGAZINE_MARKET_COPY = {
  at: {
    country: "Österreich",
    title: "Flirtradar Österreich: Magazin im Aufbau",
    description: "Für Österreich sind derzeit noch keine Magazinbeiträge veröffentlicht. Eigene Artikel folgen.",
  },
  ch: {
    country: "die Schweiz",
    title: "Flirtradar Schweiz: Magazin im Aufbau",
    description: "Für die Schweiz sind derzeit noch keine Magazinbeiträge veröffentlicht. Eigene Artikel folgen.",
  },
} as const;

export function emptyMagazineMarketCopy(market: "at" | "ch") {
  return EMPTY_MAGAZINE_MARKET_COPY[market];
}
