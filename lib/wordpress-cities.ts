import { cache } from "react";
import sanitizeHtml from "sanitize-html";

import { decodeHtmlEntities, fetchWithRetry, stripHtml, WORDPRESS_FETCH_POLICY } from "./wordpress.ts";

const CITY_API_BASE = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const CITY_SOURCE_REVISION = "image-licenses-v1";
export const CITY_ROUTE_FIELDS = "id,slug,acf.city_id,acf.city_country";
const CITY_LIST_FIELDS = "id,slug,featured_media,acf.city_id,acf.city_name,acf.city_country";
const CITY_DETAIL_FIELDS = "id,slug,title,excerpt,content,featured_media,acf,_links,_embedded";

const CITY_HTML_POLICY: sanitizeHtml.IOptions = {
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

type CityMarket = "de" | "ch" | "at";
type CityCountry = "DE" | "CH" | "AT";

type WpRendered = { rendered?: string };
type WpCitySource = { title?: string; url?: string; publisher?: string; date?: string; note?: string };
type WpCityAcf = {
  city_id?: string;
  city_name?: string;
  city_country?: CityCountry;
  city_region?: string;
  hero_title?: string;
  hero_lead?: string;
  city_hero_claim?: string;
  primary_cta_url?: string;
  sources?: WpCitySource[] | false;
};
type WpCityRestItem = {
  id: number;
  slug: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  featured_media?: number;
  acf?: WpCityAcf;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
  };
};

type WpCityMedia = { id: number; source_url?: string; alt_text?: string };

export type WordPressCityPage = {
  id: number;
  market: CityMarket;
  slug: string;
  cityName: string;
  cityRegion: string;
  title: string;
  metaDescription: string;
  h1: string;
  heroTitle: string;
  imageUrl: string | null;
  imageAlt: string;
  imageAttribution: {
    label: string;
    sourceUrl: string;
    publisher: string;
    licenseLabel: string;
    licenseUrl: string;
  };
  contentHtml: string;
  relatedCities: { slug: string; label: string }[];
  registrationUrl: string;
};

export type WordPressCityOverview = {
  title: string;
  description: string;
  cityLinks: Array<{ slug: string; label: string; imageUrl: string | null }>;
};

function countryForMarket(market: CityMarket): CityCountry {
  return market.toUpperCase() as CityCountry;
}

function publicSlug(item: WpCityRestItem) {
  const identity = item.acf?.city_id || "";
  const separator = identity.indexOf(":");
  return separator >= 0 ? identity.slice(separator + 1).toLowerCase() : item.slug.replace(/^(?:de|ch)-/, "");
}

function marketFromItem(item: WpCityRestItem): CityMarket {
  const country = item.acf?.city_country || item.acf?.city_id?.split(":")[0];
  if (country !== "DE" && country !== "CH" && country !== "AT") throw new Error(`Unsupported WordPress city country for post ${item.id}`);
  return country.toLowerCase() as CityMarket;
}

export function normalizeWordPressCity(item: WpCityRestItem): WordPressCityPage {
  const market = marketFromItem(item);
  const cityName = decodeHtmlEntities(item.acf?.city_name || stripHtml(item.title?.rendered || ""));
  const title = decodeHtmlEntities(stripHtml(item.title?.rendered || ""));
  const metaDescription = decodeHtmlEntities(
    item.acf?.hero_lead || stripHtml(item.excerpt?.rendered || ""),
  );
  const media = item._embedded?.["wp:featuredmedia"]?.[0];
  const sources = Array.isArray(item.acf?.sources) ? item.acf.sources : [];
  const imageSource = sources.find((source) => /bild/i.test(source.note || "")) || sources[1];
  const imageLicense = sources.find((source) => /lizenz/i.test(source.note || ""))
    || sources.find((source) => /license|lizenz/i.test(source.title || ""));

  return {
    id: item.id,
    market,
    slug: publicSlug(item),
    cityName,
    cityRegion: decodeHtmlEntities(item.acf?.city_region || ""),
    title,
    metaDescription,
    h1: decodeHtmlEntities(item.acf?.hero_title || title),
    heroTitle: decodeHtmlEntities(item.acf?.city_hero_claim || metaDescription),
    imageUrl: media?.source_url || null,
    imageAlt: decodeHtmlEntities(media?.alt_text || cityName),
    imageAttribution: {
      label: decodeHtmlEntities(imageSource?.title || "Bildquelle der Stadtseite"),
      sourceUrl: imageSource?.url || "",
      publisher: decodeHtmlEntities(imageSource?.publisher || ""),
      licenseLabel: decodeHtmlEntities(imageLicense?.title || ""),
      licenseUrl: imageLicense?.url || "",
    },
    contentHtml: sanitizeHtml(item.content?.rendered || "", CITY_HTML_POLICY),
    relatedCities: [],
    registrationUrl: item.acf?.primary_cta_url || `https://dich-mit-stich.${market}/registration/`,
  };
}

export function assertCompleteCityResponse(response: Response) {
  const totalPages = Number(response.headers.get("x-wp-totalpages") || "1");
  if (totalPages > 1) {
    throw new Error(`WordPress city CPT exceeds the 100-record loader invariant (${totalPages} pages)`);
  }
}

async function fetchCities(fields: string, params: Record<string, string | number> = {}) {
  const search = new URLSearchParams({
    per_page: "100",
    orderby: "title",
    order: "asc",
    _fields: fields,
    city_source_revision: CITY_SOURCE_REVISION,
    ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
  });
  const response = await fetchWithRetry(`${CITY_API_BASE}/stadt?${search}`, {
    headers: { "User-Agent": "Dich-mit-Stich Next.js city loader" },
    next: { revalidate: WORDPRESS_FETCH_POLICY.detailRevalidate, tags: ["wordpress:cities"] },
  } as RequestInit & { next: { revalidate: number; tags: string[] } });
  if (!response.ok) throw new Error(`WordPress city request failed: ${response.status} ${response.statusText}`);
  assertCompleteCityResponse(response);
  return response.json() as Promise<WpCityRestItem[]>;
}

async function fetchCityMedia(ids: number[]) {
  if (!ids.length) return [];
  const search = new URLSearchParams({
    include: ids.join(","),
    per_page: "100",
    _fields: "id,source_url,alt_text",
  });
  const response = await fetchWithRetry(`${CITY_API_BASE}/media?${search}`, {
    headers: { "User-Agent": "Dich-mit-Stich Next.js city media loader" },
    next: { revalidate: WORDPRESS_FETCH_POLICY.listRevalidate, tags: ["wordpress:city-media"] },
  } as RequestInit & { next: { revalidate: number; tags: string[] } });
  if (!response.ok) throw new Error(`WordPress city media request failed: ${response.status} ${response.statusText}`);
  return response.json() as Promise<WpCityMedia[]>;
}

export const getWordPressCitySlugs = cache(async (market: CityMarket): Promise<string[]> => {
  const country = countryForMarket(market);
  const items = await fetchCities(CITY_ROUTE_FIELDS);
  return items
    .filter((item) => item.acf?.city_country === country)
    .map(publicSlug);
});

export const getWordPressCityOverview = cache(async (market: CityMarket): Promise<WordPressCityOverview> => {
  const country = countryForMarket(market);
  const items = await fetchCities(CITY_LIST_FIELDS);
  const media = await fetchCityMedia(items.map((item) => item.featured_media || 0).filter(Boolean));
  const mediaById = new Map(media.map((item) => [item.id, item]));
  const cities = items
    .filter((item) => item.acf?.city_country === country)
    .map((item) => ({
      ...item,
      _embedded: { "wp:featuredmedia": [mediaById.get(item.featured_media || 0) || {}] },
    }))
    .map(normalizeWordPressCity);

  return {
    title: market === "ch" ? "Tattoo Singles Schweiz" : "Tattoo-Singles in Deutschland",
    description: market === "ch"
      ? "Finde dein Perfect Tattoo Match in der Schweiz. Wir verbinden tätowierte Singles."
      : "Finde tätowierte und gepiercte Singles in deiner Stadt und entdecke lokale Szene-Guides.",
    cityLinks: cities.map((city) => ({ slug: city.slug, label: city.cityName, imageUrl: city.imageUrl })),
  };
});

export const getWordPressCityPage = cache(async (market: CityMarket, slug: string): Promise<WordPressCityPage | null> => {
  const items = await fetchCities(CITY_DETAIL_FIELDS, {
    slug: `${market}-${slug}`,
    _embed: "wp:featuredmedia",
  });
  const item = items[0];
  if (!item || item.acf?.city_country !== countryForMarket(market)) return null;
  return normalizeWordPressCity(item);
});
