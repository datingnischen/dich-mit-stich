import { publicUrl, type MarketCode } from "./markets.ts";

/** Official brand channels of Dich mit Stich, used as `sameAs` on the brand entity. */
export const BRAND_SAME_AS = [
  "https://www.facebook.com/dichmitstich/",
  "https://www.instagram.com/dichmitstich/",
  "https://www.youtube.com/@Dich-mit-Stich",
  "https://de.pinterest.com/dichmitstich/",
] as const;

export const OPERATOR_NAME = "Icony GmbH";

export function editorialEntityIds(market: MarketCode) {
  const siteUrl = publicUrl(market);
  return {
    website: `${siteUrl}#website`,
    brand: `${siteUrl}#brand`,
    operator: `${siteUrl}#operator`,
  };
}
