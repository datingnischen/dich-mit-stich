import sanitizeHtml from "sanitize-html";

import berlinManifest from "../data/tattoo-studio-guide-berlin.json" with { type: "json" };
import grazManifest from "../data/tattoo-studio-guide-graz.json" with { type: "json" };
import hannoverManifest from "../data/tattoo-studio-guide-hannover.json" with { type: "json" };
import innsbruckManifest from "../data/tattoo-studio-guide-innsbruck.json" with { type: "json" };
import linzManifest from "../data/tattoo-studio-guide-linz.json" with { type: "json" };
import salzburgManifest from "../data/tattoo-studio-guide-salzburg.json" with { type: "json" };
import wienManifest from "../data/tattoo-studio-guide-wien.json" with { type: "json" };
import zuerichManifest from "../data/tattoo-studio-guide-zuerich.json" with { type: "json" };
import atGuideCatalog from "../data/tattoo-studio-guides-at.json" with { type: "json" };
import chGuideCatalog from "../data/tattoo-studio-guides-ch.json" with { type: "json" };
import deGuideCatalog from "../data/tattoo-studio-guides-de.json" with { type: "json" };
import atTattooCities from "../data/tattoo-cities-at.json" with { type: "json" };
import chTattooCities from "../data/tattoo-cities-ch.json" with { type: "json" };
import cityImages from "../data/tattoo-city-images.json" with { type: "json" };
import type { MarketCode } from "./markets.ts";

const EDITORIAL_HTML_POLICY: sanitizeHtml.IOptions = {
  allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "a", "blockquote", "br"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attributes) => ({
      tagName: "a",
      attribs: {
        ...attributes,
        ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
      },
    }),
  },
};

const STYLE_LABELS: Record<string, string> = {
  anime: "Anime",
  "black-and-grey": "Black & Grey",
  blackwork: "Blackwork",
  "cover-up": "Cover-up",
  color: "Color",
  "concept-tattoo": "Concept Tattoo",
  custom: "Custom",
  dotwork: "Dotwork",
  engraving: "Engraving",
  fineline: "Fineline",
  floral: "Floral",
  geometric: "Geometric",
  lettering: "Lettering",
  linework: "Linework",
  mandala: "Mandala",
  maori: "Maori",
  japanese: "Japanese",
  microrealism: "Microrealism",
  "neo-traditional": "Neo Traditional",
  ornamental: "Ornamental",
  realistic: "Realistic",
  traditional: "Traditional",
  watercolor: "Watercolor",
};

type SourceGuide = {
  identity: string;
  country: string;
  market: string;
  citySlug: string;
  cityName: string;
  title: string;
  sourceUrl: string;
  /** Legacy mirror of the editorial body. The WordPress importer rebuilds it, so new manifests omit it. */
  contentHtml?: string;
  editorialHtml?: string;
  selectionMethodHtml: string;
  lastVerified: string;
  imageUrl?: string;
  imageAttribution?: {
    title: string;
    creator: string;
    license: string;
    sourceUrl: string;
  };
  acf: Record<string, unknown>;
  publicationStatus?: "verified" | "rollout";
};

type SourceStudio = {
  identity: string;
  market: string;
  country: string;
  citySlug: string;
  cityName: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  address: string;
  contact: string;
  sourceUrl: string;
  acf?: {
    tattoo_styles?: string[];
    verification_status?: string;
    paid_placement?: boolean;
    claimed_by_studio?: boolean;
    last_verified?: string;
  } & Record<string, unknown>;
};

type SourceManifest = {
  schemaVersion: number;
  guide: SourceGuide;
  studios: SourceStudio[];
};

type GuideCatalog = {
  schemaVersion: number;
  manifests: SourceManifest[];
};

export const TATTOO_STUDIO_MARKETS = ["at", "ch"] as const;
export type TattooStudioMarket = (typeof TATTOO_STUDIO_MARKETS)[number];

type DirectoryImageAttribution = {
  title: string;
  creator: string;
  license: string;
  sourceUrl: string;
  licenseUrl?: string;
  modifications?: string;
};
type RawDirectoryImageAttribution = Omit<DirectoryImageAttribution, "title"> & { title?: string; label?: string };
type LargestCityDefinition = { slug: string; label: string; imageUrl: string; imageAttribution: DirectoryImageAttribution };
type CityImageRecord = { imageUrl: string; imageAttribution: RawDirectoryImageAttribution };

const deCityImageCatalog = cityImages as Record<string, CityImageRecord>;
const atCityImageCatalog = atTattooCities.cities as Record<string, CityImageRecord>;
const chCityImageCatalog = chTattooCities.cities as Record<string, CityImageRecord>;
const innsbruckGuide = (innsbruckManifest as SourceManifest).guide;
const innsbruckImage: CityImageRecord = {
  imageUrl: innsbruckGuide.imageUrl ?? "/cities/at/innsbruck.jpg",
  imageAttribution: innsbruckGuide.imageAttribution ?? {
    title: "Stadtbild von Innsbruck",
    creator: "realluca009",
    license: "Pixabay Content License",
    sourceUrl: "https://pixabay.com/de/photos/stadtbild-stadt-innsbruck-7361396/",
  },
};

function getDirectoryImageAttribution(record: CityImageRecord): DirectoryImageAttribution {
  return {
    ...record.imageAttribution,
    title: record.imageAttribution.title ?? record.imageAttribution.label ?? "Stadtmotiv",
  };
}

const LARGEST_TATTOO_STUDIO_CITIES: Record<MarketCode, LargestCityDefinition[]> = {
  de: [
    ["berlin", "Berlin"], ["hamburg", "Hamburg"], ["muenchen", "München"], ["koeln", "Köln"],
    ["frankfurt-am-main", "Frankfurt am Main"], ["duesseldorf", "Düsseldorf"], ["stuttgart", "Stuttgart"],
    ["leipzig", "Leipzig"], ["dortmund", "Dortmund"], ["essen", "Essen"],
  ].map(([slug, label]) => ({ slug, label, imageUrl: `/city-previews/${slug}.jpg`, imageAttribution: getDirectoryImageAttribution(deCityImageCatalog[slug]) })),
  at: [
    ["wien", "Wien"], ["graz", "Graz"], ["linz", "Linz"], ["salzburg", "Salzburg"],
    ["innsbruck", "Innsbruck"], ["klagenfurt", "Klagenfurt"], ["villach", "Villach"], ["wels", "Wels"],
    ["sankt-poelten", "Sankt Pölten"], ["dornbirn", "Dornbirn"],
  ].map(([slug, label]) => ({
    slug,
    label,
    imageUrl: `/cities/at/${slug}.jpg`,
    imageAttribution: getDirectoryImageAttribution(slug === "innsbruck" ? innsbruckImage : atCityImageCatalog[slug]),
  })),
  ch: [
    ["zuerich", "Zürich"], ["genf", "Genf"], ["basel", "Basel"], ["lausanne", "Lausanne"], ["bern", "Bern"],
    ["winterthur", "Winterthur"], ["luzern", "Luzern"], ["st-gallen", "St. Gallen"], ["lugano", "Lugano"],
    ["biel-bienne", "Biel/Bienne"],
  ].map(([slug, label]) => ({ slug, label, imageUrl: `/cities/ch/${slug}.jpg`, imageAttribution: getDirectoryImageAttribution(chCityImageCatalog[slug]) })),
};

export const TATTOO_STUDIO_CITY_POPULATION_SOURCES: Record<MarketCode, { label: string; url: string; referenceDate: string }> = {
  de: {
    label: "Statistisches Bundesamt: Städte nach Bevölkerung",
    url: "https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/05-staedte.html",
    referenceDate: "31.12.2024",
  },
  at: {
    label: "STATISTIK AUSTRIA: Bevölkerung zu Jahresbeginn",
    url: "https://www.statistik.at/statistiken/bevoelkerung-und-soziales/bevoelkerung/bevoelkerungsstand/bevoelkerung-zu-jahres-/-quartalsanfang",
    referenceDate: "01.01.2026",
  },
  ch: {
    label: "Bundesamt für Statistik: Bevölkerung nach Gemeinden",
    url: "https://www.pxweb.bfs.admin.ch/pxweb/en/px-x-0102010000_101/-/px-x-0102010000_101.px/",
    referenceDate: "31.12.2025",
  },
};

export function isTattooStudioMarket(value: string): value is TattooStudioMarket {
  return TATTOO_STUDIO_MARKETS.includes(value as TattooStudioMarket);
}

export function hasCompleteStreetAddress(value: string): boolean {
  const [streetSegment] = value.split(",", 1);
  return /^(?:\d+\.\s*)?[\p{L}][\p{L}\s.'’\-]*\s+\d+[a-zA-Z]?(?:\/(?:\d+[a-zA-Z]?|Top\s+\d+))*$/iu.test(streetSegment.trim())
    && /\b\d{4,5}\s+[\p{L}]/u.test(value);
}

export type TattooStyle = { slug: string; label: string };

export type TattooStudio = {
  identity: string;
  market: MarketCode;
  country: string;
  citySlug: string;
  cityName: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  address: string;
  contact: string;
  sourceUrl: string;
  styles: TattooStyle[];
  lastVerified: string;
  verificationStatus: string;
  paidPlacement: boolean;
  claimedByStudio: boolean;
};

export type TattooStudioCityGuide = {
  identity: string;
  market: MarketCode;
  country: string;
  slug: string;
  cityName: string;
  region: string;
  title: string;
  sourceUrl: string;
  editorialHtml: string;
  selectionMethodHtml: string;
  lastVerified: string;
  imageUrl: string | null;
  imageAttribution: {
    title: string;
    creator: string;
    license: string;
    sourceUrl: string;
  };
  legacyImageUrl: string | null;
  legacyImageAlt: string;
  legacyImageWidth: number;
  legacyImageHeight: number;
  publicationStatus: "verified" | "rollout";
  studios: TattooStudio[];
};

function normalizeStudio(studio: SourceStudio): TattooStudio {
  return {
    identity: studio.identity,
    market: studio.market as MarketCode,
    country: studio.country,
    citySlug: studio.citySlug,
    cityName: studio.cityName,
    slug: studio.slug,
    name: studio.name,
    description: studio.description.trim(),
    websiteUrl: studio.websiteUrl,
    address: studio.address.trim(),
    contact: studio.contact.trim(),
    sourceUrl: studio.sourceUrl,
    styles: (studio.acf?.tattoo_styles || []).map((slug) => ({ slug, label: STYLE_LABELS[slug] || slug })),
    lastVerified: studio.acf?.last_verified || "",
    verificationStatus: studio.acf?.verification_status || "needs_review",
    paidPlacement: Boolean(studio.acf?.paid_placement),
    claimedByStudio: Boolean(studio.acf?.claimed_by_studio),
  };
}

const LOCAL_GUIDE_IMAGES: Partial<Record<string, string>> = {
  berlin: "/studio-guides/berlin.jpg",
  hannover: "/studio-guides/hannover.jpg",
};

const DE_LEGACY_TATTOO_IMAGE_SLUGS = new Set([
  "berlin", "bochum", "bonn", "bremen", "dortmund", "dresden", "duisburg", "duesseldorf", "essen",
  "frankfurt-am-main", "hamburg", "hannover", "karlsruhe", "koeln", "leipzig", "muenchen", "muenster",
  "nuernberg", "stuttgart", "wuppertal",
]);
const DE_WIDE_LEGACY_TATTOO_IMAGES = new Set(["bonn", "dresden", "karlsruhe", "koeln", "muenchen"]);

function getLegacyTattooImage(market: MarketCode, slug: string, cityName: string) {
  if (market !== "de" || !DE_LEGACY_TATTOO_IMAGE_SLUGS.has(slug)) {
    return { url: null, alt: "", width: 0, height: 0 };
  }
  const width = DE_WIDE_LEGACY_TATTOO_IMAGES.has(slug) ? 1360 : 1024;
  return {
    url: `/tattoo-studios/cities/${slug}.webp`,
    alt: `Tattoo-Illustration zum Stadtguide für ${cityName}`,
    width,
    height: 765,
  };
}

export function normalizeTattooStudioManifest(source: SourceManifest): { guide: TattooStudioCityGuide } {
  const image = (cityImages as Record<string, {
    imageUrl: string;
    imageAttribution: { title: string; creator: string; license: string; sourceUrl: string };
  }>)[source.guide.citySlug];
  const market = source.guide.market as MarketCode;
  // AT and CH cities keep their imagery in their own catalogue, so fall back to it
  // when a city is not present in the DE image list.
  const marketImageCatalog = market === "at" ? atCityImageCatalog : market === "ch" ? chCityImageCatalog : undefined;
  const cityImage = image ?? marketImageCatalog?.[source.guide.citySlug];
  const publicationStatus = source.guide.publicationStatus === "verified" ? "verified" : "rollout";
  const legacyImage = getLegacyTattooImage(market, source.guide.citySlug, source.guide.cityName);
  return {
    guide: {
      identity: source.guide.identity,
      market,
      country: source.guide.country,
      slug: source.guide.citySlug,
      cityName: source.guide.cityName,
      region: String(source.guide.acf.guide_region || ""),
      title: source.guide.title,
      sourceUrl: source.guide.sourceUrl,
      editorialHtml: sanitizeHtml(source.guide.editorialHtml || source.guide.contentHtml || "", EDITORIAL_HTML_POLICY),
      selectionMethodHtml: sanitizeHtml(source.guide.selectionMethodHtml || "", EDITORIAL_HTML_POLICY),
      lastVerified: source.guide.lastVerified,
      imageUrl: source.guide.imageUrl || (market === "de"
        ? LOCAL_GUIDE_IMAGES[source.guide.citySlug] || `/cities/${source.guide.citySlug}.jpg`
        : cityImage?.imageUrl || null),
      imageAttribution: source.guide.imageAttribution
        || (cityImage ? getDirectoryImageAttribution(cityImage) : undefined)
        || { title: "", creator: "", license: "", sourceUrl: "" },
      legacyImageUrl: legacyImage.url,
      legacyImageAlt: legacyImage.alt,
      legacyImageWidth: legacyImage.width,
      legacyImageHeight: legacyImage.height,
      publicationStatus,
      studios: publicationStatus === "verified" ? source.studios.map(normalizeStudio) : [],
    },
  };
}

const guides = [
  berlinManifest, grazManifest, hannoverManifest, innsbruckManifest, linzManifest, salzburgManifest, wienManifest, zuerichManifest,
  ...(atGuideCatalog as GuideCatalog).manifests,
  ...(chGuideCatalog as GuideCatalog).manifests,
  ...(deGuideCatalog as GuideCatalog).manifests,
]
  .map((manifest) => normalizeTattooStudioManifest(manifest as SourceManifest).guide)
  .sort((left, right) => left.cityName.localeCompare(right.cityName, "de"));

export function getLargestTattooStudioCities(market: MarketCode) {
  const marketGuides = guides.filter((guide) => guide.market === market);
  const guideSlugs = new Set(marketGuides.map((guide) => guide.slug));
  const verifiedStudioSlugs = new Set(marketGuides.filter((guide) => guide.publicationStatus === "verified" && guide.studios.length > 0).map((guide) => guide.slug));
  return LARGEST_TATTOO_STUDIO_CITIES[market].map((city, index) => {
    const hasCityGuide = guideSlugs.has(city.slug);
    return {
      ...city,
      rank: index + 1,
      hasCityGuide,
      hasVerifiedStudios: verifiedStudioSlugs.has(city.slug),
      href: `/${hasCityGuide ? "tattoo-studios" : "tattoo-singles"}/${city.slug}`,
    };
  });
}

export function getTattooStudioCities(market: MarketCode): TattooStudioCityGuide[] {
  return guides.filter((guide) => guide.market === market);
}

export function getIndexableTattooStudioCities(market: MarketCode): TattooStudioCityGuide[] {
  return getTattooStudioCities(market).filter((guide) => guide.publicationStatus === "verified" && guide.studios.length > 0);
}

export function getTattooStudioCityGuide(market: MarketCode, slug: string): TattooStudioCityGuide | null {
  return guides.find((guide) => guide.market === market && guide.slug === slug) || null;
}

export function isIndexableTattooStudioCity(market: MarketCode, slug: string): boolean {
  const guide = getTattooStudioCityGuide(market, slug);
  return guide !== null && guide.publicationStatus === "verified" && guide.studios.length > 0;
}

export function getTattooStudio(market: MarketCode, slug: string): TattooStudio | null {
  return getTattooStudioCities(market)
    .flatMap((guide) => guide.studios)
    .find((studio) => studio.slug === slug) || null;
}

export function getTattooStudioSlugs(market: MarketCode): string[] {
  return getTattooStudioCities(market).flatMap((city) => city.studios.map((studio) => studio.slug));
}
