import { cache } from "react";

import { firstPartyInternalPath } from "./market-html.ts";
import { getMagazineEntryBySlug, type MagazineEntry } from "./wordpress.ts";

export const PIERCING_HUB_SLUG = "piercingarten";
export const PIERCING_HUB_PATH = `/magazin/${PIERCING_HUB_SLUG}`;
export const PIERCING_HUB_LABEL = "Piercingarten";

const MAGAZINE_ARTICLE_PATH = /^\/magazin\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\/?$/;
const LINK_HREF = /<a\b[^>]*?\bhref\s*=\s*"([^"]*)"/gi;

type PiercingTopicEntry = Pick<MagazineEntry, "title" | "slug" | "categories">;

export function isPiercingTopic(entry: PiercingTopicEntry) {
  return [entry.title, entry.slug, ...entry.categories.flatMap((category) => [category.name, category.slug])]
    .join(" ")
    .toLocaleLowerCase("de")
    .includes("piercing");
}

/**
 * The Piercingarten hub links every piercing detail article, so its own link list is the
 * source of truth for which articles sit one level below it.
 */
export function extractPiercingHubChildSlugs(html = "") {
  const slugs = new Set<string>();

  for (const [, href] of html.matchAll(LINK_HREF)) {
    const internalPath = firstPartyInternalPath(href.trim());
    if (!internalPath) continue;

    const slug = internalPath.split(/[?#]/, 1)[0].toLowerCase().match(MAGAZINE_ARTICLE_PATH)?.[1];
    if (!slug || slug === PIERCING_HUB_SLUG) continue;

    slugs.add(slug);
  }

  return slugs;
}

const loadPiercingHubChildSlugs = cache(async (): Promise<Set<string>> => {
  try {
    const hub = await getMagazineEntryBySlug(PIERCING_HUB_SLUG);
    return extractPiercingHubChildSlugs(hub?.content);
  } catch {
    return new Set<string>();
  }
});

export async function isPiercingHubChild(entry: PiercingTopicEntry) {
  if (entry.slug === PIERCING_HUB_SLUG || !isPiercingTopic(entry)) return false;
  return (await loadPiercingHubChildSlugs()).has(entry.slug.toLowerCase());
}

export type BreadcrumbTrailItem = { name: string; pathname: string };

export function buildMagazineBreadcrumbTrail(
  entry: { slug: string; title: string },
  { belowPiercingHub = false } = {},
): BreadcrumbTrailItem[] {
  const trail: BreadcrumbTrailItem[] = [
    { name: "Startseite", pathname: "/" },
    { name: "Magazin", pathname: "/magazin" },
  ];

  if (entry.slug === PIERCING_HUB_SLUG) {
    return [...trail, { name: PIERCING_HUB_LABEL, pathname: PIERCING_HUB_PATH }];
  }

  if (belowPiercingHub) {
    trail.push({ name: PIERCING_HUB_LABEL, pathname: PIERCING_HUB_PATH });
  }

  return [...trail, { name: entry.title, pathname: `/magazin/${entry.slug}` }];
}
