import type { Metadata } from "next";
import type { MarketCode } from "@/lib/markets";

export function marketEditorialRobots(market: MarketCode, safetyOverride = false): Metadata["robots"] {
  if (safetyOverride) return { index: false, follow: false };
  if (market !== "de") return { index: false, follow: true };
  return undefined;
}

// A topic page with a single article only competes with that article for the same keywords
// (Seobility: Keyword-Kannibalisierung), so it stays out of the index and the sitemap.
export const MIN_INDEXABLE_CATEGORY_ARTICLES = 2;

export function isThinMagazineCategory(category: { count: number }) {
  return category.count < MIN_INDEXABLE_CATEGORY_ARTICLES;
}
