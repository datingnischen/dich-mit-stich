import { getAuthorPosts, getAuthorProfile, getKnownAuthorSlugs } from "@/lib/author-profiles";
import { getAnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { getMagazineQuarantineDescription, isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { getMagazineEditorialOverride } from "@/lib/magazine-editorial-overrides";
import { getMagazineFeaturedImage } from "@/lib/magazine-featured-images";
import { getMagazineVideo } from "@/lib/magazine-videos";
import { resolveMagazineMarketSource } from "@/lib/market-magazine-policy";
import type { MarketCode } from "@/lib/markets";
import { buildPublishedAuthorProfileGraph } from "@/lib/published-book";
import {
  getMagazineCategories,
  getMagazineCategoryBySlug,
  getMagazineEntriesForCategory,
  getMagazineEntryBySlug,
  getMagazinePages,
  getMagazinePosts,
  getMagazineRouteEntries,
} from "@/lib/wordpress";

type MarketMagazineSource = {
  posts: typeof getMagazinePosts;
  pages: typeof getMagazinePages;
  categories: typeof getMagazineCategories;
  routeEntries: typeof getMagazineRouteEntries;
  entryBySlug: typeof getMagazineEntryBySlug;
  categoryBySlug: typeof getMagazineCategoryBySlug;
  entriesForCategory: typeof getMagazineEntriesForCategory;
  authorProfile: typeof getAuthorProfile;
  authorPosts: typeof getAuthorPosts;
  authorSlugs: typeof getKnownAuthorSlugs;
  detailContext: typeof getDeMagazineDetailContext;
  publishedProfileGraph: typeof buildPublishedAuthorProfileGraph;
};

function getDeMagazineDetailContext(
  slug: string,
  featuredImageFallback: Parameters<typeof getMagazineFeaturedImage>[1],
) {
  return {
    quarantined: isMagazineArticleQuarantined(slug),
    quarantineDescription: getMagazineQuarantineDescription(),
    editorialOverride: getMagazineEditorialOverride(slug),
    answerEngineEntry: getAnswerEnginePilotEntry(slug),
    featuredImage: getMagazineFeaturedImage(slug, featuredImageFallback),
    video: getMagazineVideo(slug),
  };
}

const DE_MAGAZINE_SOURCE: MarketMagazineSource = {
  posts: getMagazinePosts,
  pages: getMagazinePages,
  categories: getMagazineCategories,
  routeEntries: getMagazineRouteEntries,
  entryBySlug: getMagazineEntryBySlug,
  categoryBySlug: getMagazineCategoryBySlug,
  entriesForCategory: getMagazineEntriesForCategory,
  authorProfile: getAuthorProfile,
  authorPosts: getAuthorPosts,
  authorSlugs: getKnownAuthorSlugs,
  detailContext: getDeMagazineDetailContext,
  publishedProfileGraph: buildPublishedAuthorProfileGraph,
};

const MARKET_MAGAZINE_SOURCES: Partial<Record<MarketCode, MarketMagazineSource>> = {
  de: DE_MAGAZINE_SOURCE,
};

function getMagazineSource(market: MarketCode) {
  return resolveMagazineMarketSource(market, MARKET_MAGAZINE_SOURCES);
}

export function marketHasMagazineContent(market: MarketCode) {
  return getMagazineSource(market) !== null;
}

export async function getMarketMagazineCatalog(market: MarketCode) {
  const source = getMagazineSource(market);
  if (!source) return { posts: [], pages: [], categories: [] };
  const [posts, pages, categories] = await Promise.all([
    source.posts(),
    source.pages(),
    source.categories(),
  ]);
  return { posts, pages, categories };
}

export async function getMarketMagazineRouteEntries(market: MarketCode) {
  return getMagazineSource(market)?.routeEntries() ?? [];
}

export async function getMarketMagazineEntryBySlug(market: MarketCode, slug: string) {
  return getMagazineSource(market)?.entryBySlug(slug) ?? null;
}

export async function getMarketMagazineCategories(market: MarketCode) {
  return getMagazineSource(market)?.categories() ?? [];
}

export async function getMarketMagazineCategoryBySlug(market: MarketCode, slug: string) {
  return getMagazineSource(market)?.categoryBySlug(slug) ?? null;
}

export async function getMarketMagazineEntriesForCategory(market: MarketCode, slug: string) {
  return getMagazineSource(market)?.entriesForCategory(slug) ?? [];
}

export async function getMarketMagazineAuthorProfile(market: MarketCode, slug: string) {
  return getMagazineSource(market)?.authorProfile(slug) ?? null;
}

export async function getMarketMagazineAuthorPosts(market: MarketCode, slug: string) {
  return getMagazineSource(market)?.authorPosts(slug) ?? [];
}

export async function getMarketMagazineAuthorSlugs(market: MarketCode) {
  return getMagazineSource(market)?.authorSlugs() ?? [];
}

export function getMarketMagazineDetailContext(
  market: MarketCode,
  slug: string,
  featuredImageFallback: Parameters<typeof getMagazineFeaturedImage>[1],
) {
  return getMagazineSource(market)?.detailContext(slug, featuredImageFallback) ?? null;
}

export function getMarketMagazinePublishedProfileGraph(
  market: MarketCode,
  input: Parameters<typeof buildPublishedAuthorProfileGraph>[0],
) {
  return getMagazineSource(market)?.publishedProfileGraph(input) ?? null;
}
