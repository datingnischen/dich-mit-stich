import { cache } from "react";
import tattooCityPreviewImages from "../data/tattoo-city-preview-images.json" with { type: "json" };
import tattooCityImages from "../data/tattoo-city-images.json" with { type: "json" };
import { atTattooCitySlugs, chTattooCitySlugs, type MarketCode } from "./markets.ts";
import { decodeHtmlEntities } from "./magazine-text.ts";
import { staticAsset } from "./static-asset.ts";

export const TATTOO_SINGLES_OVERVIEW_PATH = "/tattoo-singles";

export const tattooCitySlugs = [
  "berlin",
  "bochum",
  "bremen",
  "dortmund",
  "dresden",
  "duesseldorf",
  "essen",
  "frankfurt-am-main",
  "hamburg",
  "hannover",
  "koeln",
  "leipzig",
  "mannheim",
  "muenchen",
  "nuernberg",
  "stuttgart",
] as const;

export type TattooCitySlug = (typeof tattooCitySlugs)[number];

type CityImageAttribution = {
  title: string;
  creator: string;
  license: string;
  sourceUrl: string;
};

type CityImage = {
  imageUrl: string;
  imageAttribution: CityImageAttribution;
};

export type CityPreviewImage = {
  imageUrl: string;
  title: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  modifications: string;
};

const cityImageInventory: Record<TattooCitySlug, CityImage> = tattooCityImages;
const cityPreviewImageInventory: Record<TattooCitySlug, CityPreviewImage> = tattooCityPreviewImages;

const cityDisplayNames: Record<string, string> = {
  berlin: "Berlin",
  bochum: "Bochum",
  bremen: "Bremen",
  dortmund: "Dortmund",
  dresden: "Dresden",
  duesseldorf: "Düsseldorf",
  essen: "Essen",
  "frankfurt-am-main": "Frankfurt am Main",
  hamburg: "Hamburg",
  hannover: "Hannover",
  koeln: "Köln",
  leipzig: "Leipzig",
  mannheim: "Mannheim",
  muenchen: "München",
  nuernberg: "Nürnberg",
  stuttgart: "Stuttgart",
};

export function getTattooCityDirectory() {
  return tattooCitySlugs.map((slug) => ({
    slug,
    label: cityDisplayNames[slug],
    imageUrl: cityPreviewImageInventory[slug].imageUrl,
    imageAttribution: cityPreviewImageInventory[slug],
  }));
}

export type TattooSinglesOverview = {
  title: string;
  description: string;
  cityLinks: { slug: string; label: string; imageUrl?: string }[];
};

const OVERVIEW_TITLE = "Tattoo-Singles in Deutschland – Singles nach Stadt";
const OVERVIEW_DESCRIPTION =
  "Finde tätowierte und gepiercte Singles in deiner Stadt: Stadtseiten von Berlin bis München, Flirtradar mit Umkreissuche und kostenloser Einstieg.";

function cityLabelFromSlug(slug: string) {
  return cityDisplayNames[slug] || decodeHtmlEntities(slug.replace(/-/g, " "));
}

/** Übersicht /tattoo-singles/ (Deutschland) für die Startseite; früher von der Live-Seite gelesen, jetzt direkt aus dem Repo. */
export const getTattooSinglesOverview = cache(async (): Promise<TattooSinglesOverview> => ({
  title: OVERVIEW_TITLE,
  description: OVERVIEW_DESCRIPTION,
  cityLinks: tattooCitySlugs.map((slug) => ({
    slug,
    label: cityLabelFromSlug(slug),
    imageUrl: staticAsset(cityImageInventory[slug].imageUrl),
  })),
}));

const SINGLES_CITY_SLUGS: Record<MarketCode, readonly string[]> = {
  de: tattooCitySlugs,
  at: atTattooCitySlugs,
  ch: chTattooCitySlugs,
};

/**
 * Where a studio city page should send visitors who want the dating side.
 * Not every studio city has its own singles page, so those fall back to the
 * overview rather than linking somewhere that does not exist.
 */
export function tattooSinglesPath(market: MarketCode, citySlug: string): string {
  return SINGLES_CITY_SLUGS[market]?.includes(citySlug)
    ? `${TATTOO_SINGLES_OVERVIEW_PATH}/${citySlug}`
    : TATTOO_SINGLES_OVERVIEW_PATH;
}
