import sanitizeHtml from "sanitize-html";

import berlinManifest from "../data/tattoo-studio-guide-berlin.json" with { type: "json" };
import hannoverManifest from "../data/tattoo-studio-guide-hannover.json" with { type: "json" };
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
  fineline: "Fineline",
  linework: "Linework",
  mandala: "Mandala",
  maori: "Maori",
  "neo-traditional": "Neo Traditional",
  ornamental: "Ornamental",
  realistic: "Realistic",
  traditional: "Traditional",
};

type SourceGuide = {
  identity: string;
  country: string;
  market: string;
  citySlug: string;
  cityName: string;
  title: string;
  sourceUrl: string;
  contentHtml: string;
  editorialHtml?: string;
  selectionMethodHtml: string;
  lastVerified: string;
  acf: Record<string, unknown>;
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
  acf: {
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
    styles: (studio.acf.tattoo_styles || []).map((slug) => ({ slug, label: STYLE_LABELS[slug] || slug })),
    lastVerified: studio.acf.last_verified || "",
    verificationStatus: studio.acf.verification_status || "needs_review",
    paidPlacement: Boolean(studio.acf.paid_placement),
    claimedByStudio: Boolean(studio.acf.claimed_by_studio),
  };
}

export function normalizeTattooStudioManifest(source: SourceManifest): { guide: TattooStudioCityGuide } {
  const image = (cityImages as Record<string, {
    imageUrl: string;
    imageAttribution: { title: string; creator: string; license: string; sourceUrl: string };
  }>)[source.guide.citySlug];
  const market = source.guide.market as MarketCode;
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
      imageUrl: image?.imageUrl || null,
      imageAttribution: image?.imageAttribution || { title: "", creator: "", license: "", sourceUrl: "" },
      studios: source.studios.map(normalizeStudio),
    },
  };
}

const guides = [berlinManifest, hannoverManifest]
  .map((manifest) => normalizeTattooStudioManifest(manifest as SourceManifest).guide)
  .sort((left, right) => left.cityName.localeCompare(right.cityName, "de"));

export function getTattooStudioCities(market: MarketCode): TattooStudioCityGuide[] {
  return guides.filter((guide) => guide.market === market);
}

export function getTattooStudioCityGuide(market: MarketCode, slug: string): TattooStudioCityGuide | null {
  return guides.find((guide) => guide.market === market && guide.slug === slug) || null;
}

export function getTattooStudio(market: MarketCode, slug: string): TattooStudio | null {
  return getTattooStudioCities(market)
    .flatMap((guide) => guide.studios)
    .find((studio) => studio.slug === slug) || null;
}

export function getTattooStudioSlugs(market: MarketCode): string[] {
  return getTattooStudioCities(market).flatMap((city) => city.studios.map((studio) => studio.slug));
}
