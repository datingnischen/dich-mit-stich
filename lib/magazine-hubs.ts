import { cache } from "react";

import { firstPartyInternalPath } from "./market-html.ts";
import { getMagazineEntryBySlug, type MagazineEntry } from "./wordpress.ts";

/**
 * A magazine hub is an overview page whose own link list names the articles one level below
 * it. That list is editorial, which keeps the hub page the single source of truth for the
 * hierarchy — for the visible breadcrumb and for the BreadcrumbList in the markup alike.
 */
export type MagazineHub = {
  slug: string;
  path: string;
  label: string;
  /** Lowercase markers that keep the hub lookup off the network for unrelated articles. */
  topicMarkers: readonly string[];
};

function magazineHub(slug: string, label: string, topicMarkers: readonly string[]): MagazineHub {
  return { slug, path: `/magazin/${slug}`, label, topicMarkers };
}

export const PIERCING_HUB = magazineHub("piercingarten", "Piercingarten", ["piercing"]);
export const TATTOO_HUB = magazineHub("tattoo-lexikon", "Tattoo-Lexikon", ["tattoo", "tätowier", "taetowier"]);

/** Consulted in order, so an article both hubs link to hangs below the first one listed. */
export const MAGAZINE_HUBS = [PIERCING_HUB, TATTOO_HUB] as const;

const MAGAZINE_ARTICLE_PATH = /^\/magazin\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\/?$/;
const LINK_HREF = /<a\b[^>]*?\bhref\s*=\s*"([^"]*)"/gi;

type HubTopicEntry = Pick<MagazineEntry, "title" | "slug" | "categories">;

export function isHubTopic(hub: MagazineHub, entry: HubTopicEntry) {
  const haystack = [entry.title, entry.slug, ...entry.categories.flatMap((category) => [category.name, category.slug])]
    .join(" ")
    .toLocaleLowerCase("de");

  return hub.topicMarkers.some((marker) => haystack.includes(marker));
}

export function isPiercingTopic(entry: HubTopicEntry) {
  return isHubTopic(PIERCING_HUB, entry);
}

/**
 * The hub links every detail article it owns, so its own link list is the source of truth for
 * which articles sit one level below it.
 */
export function extractHubChildSlugs(hub: MagazineHub, html = "") {
  const slugs = new Set<string>();

  for (const [, href] of html.matchAll(LINK_HREF)) {
    const internalPath = firstPartyInternalPath(href.trim());
    if (!internalPath) continue;

    const slug = internalPath.split(/[?#]/, 1)[0].toLowerCase().match(MAGAZINE_ARTICLE_PATH)?.[1];
    if (!slug || slug === hub.slug) continue;

    slugs.add(slug);
  }

  return slugs;
}

const loadHubChildSlugs = cache(async (hubSlug: string): Promise<Set<string>> => {
  const hub = MAGAZINE_HUBS.find((candidate) => candidate.slug === hubSlug);
  if (!hub) return new Set<string>();

  try {
    const page = await getMagazineEntryBySlug(hub.slug);
    return extractHubChildSlugs(hub, page?.content);
  } catch {
    return new Set<string>();
  }
});

/** The hub an entry hangs below, or null when it sits directly under the magazine. */
export async function resolveMagazineHub(entry: HubTopicEntry): Promise<MagazineHub | null> {
  const candidates = MAGAZINE_HUBS.filter((hub) => hub.slug !== entry.slug && isHubTopic(hub, entry));

  for (const hub of candidates) {
    if ((await loadHubChildSlugs(hub.slug)).has(entry.slug.toLowerCase())) return hub;
  }

  return null;
}

export type BreadcrumbTrailItem = { name: string; pathname: string };

export function buildMagazineBreadcrumbTrail(
  entry: { slug: string; title: string },
  { hub = null }: { hub?: MagazineHub | null } = {},
): BreadcrumbTrailItem[] {
  const trail: BreadcrumbTrailItem[] = [
    { name: "Startseite", pathname: "/" },
    { name: "Magazin", pathname: "/magazin" },
  ];

  const ownHub = MAGAZINE_HUBS.find((candidate) => candidate.slug === entry.slug);
  if (ownHub) return [...trail, { name: ownHub.label, pathname: ownHub.path }];

  if (hub) trail.push({ name: hub.label, pathname: hub.path });

  return [...trail, { name: entry.title, pathname: `/magazin/${entry.slug}` }];
}
