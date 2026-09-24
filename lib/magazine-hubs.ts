import { cache } from "react";

import { firstPartyInternalPath } from "./market-html.ts";
import { decodeHtmlEntities, getMagazineEntryBySlug, type MagazineEntry } from "./wordpress.ts";

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
const LINK_WITH_TEXT = /<a\b[^>]*?\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

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
    const slug = hubChildSlug(hub, href);
    if (slug) slugs.add(slug);
  }

  return slugs;
}

function hubChildSlug(hub: MagazineHub, href: string) {
  const internalPath = firstPartyInternalPath(href.trim());
  if (!internalPath) return null;

  const slug = internalPath.split(/[?#]/, 1)[0].toLowerCase().match(MAGAZINE_ARTICLE_PATH)?.[1];
  return slug && slug !== hub.slug ? slug : null;
}

export type HubChildLink = { slug: string; label: string };

/** Link text as the editors wrote it, minus hedges like "im Allgemeinen" that only make sense in the hub's prose. */
function hubChildLabel(html: string) {
  const text = decodeHtmlEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text
    .replace(/\s+im Allgemeinen$/i, "")
    .replace(/(\s|-)piercing$/, "$1Piercing");
}

/** Every article the hub links, labelled with its link text and sorted A–Z. */
export function extractHubChildLinks(hub: MagazineHub, html = ""): HubChildLink[] {
  const links = new Map<string, string>();

  for (const [, href, inner] of html.matchAll(LINK_WITH_TEXT)) {
    const slug = hubChildSlug(hub, href);
    if (!slug || links.get(slug)) continue;
    links.set(slug, hubChildLabel(inner));
  }

  return [...links]
    .filter(([, label]) => label)
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
}

export type HubChildGroup = { heading: string; imageUrl?: string; links: HubChildLink[] };

const LIST_BLOCK = /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi;
const SUBHEADING = /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
const IMAGE_TAG = /<img\b[^>]*>/i;

/**
 * The hub's link lists in the order the editors wrote them, each under the heading it follows.
 * A list without a heading of its own (the body piercings sit below the ear list) gets the
 * fallback label, and the illustration placed above a list becomes that group's picture.
 */
export function extractHubChildGroups(hub: MagazineHub, html = "", fallbackHeading = "Weitere"): HubChildGroup[] {
  const groups: HubChildGroup[] = [];
  let cursor = 0;

  for (const match of html.matchAll(LIST_BLOCK)) {
    const between = html.slice(cursor, match.index);
    cursor = match.index + match[0].length;

    const links = extractHubChildLinks(hub, match[1]);
    if (!links.length) continue;

    const headings = [...between.matchAll(SUBHEADING)];
    const heading = headings.length ? hubChildLabel(headings[headings.length - 1][1]) : fallbackHeading;
    groups.push({ heading, imageUrl: hubGroupImage(between), links });
  }

  return groups;
}

/** The hub embeds 300px thumbnails; the 768px candidate from srcset stays sharp in a card. */
function hubGroupImage(html: string) {
  const tag = html.match(IMAGE_TAG)?.[0];
  if (!tag) return undefined;

  const srcset = tag.match(/\bsrcset\s*=\s*"([^"]*)"/i)?.[1] ?? "";
  const candidates = srcset.split(",").map((candidate) => {
    const [url, width] = candidate.trim().split(/\s+/);
    return { url, width: Number.parseInt(width, 10) || 0 };
  }).filter((candidate) => candidate.url && candidate.width && candidate.width <= 1024);
  const best = candidates.sort((a, b) => b.width - a.width)[0]?.url ?? tag.match(/\bsrc\s*=\s*"([^"]*)"/i)?.[1];
  if (!best) return undefined;

  return best.startsWith("/magazin/") ? `https://dich-mit-stich.de${best}` : best;
}

const loadHubContent = cache(async (hubSlug: string): Promise<string> => {
  try {
    return (await getMagazineEntryBySlug(hubSlug))?.content ?? "";
  } catch {
    return "";
  }
});

const loadHubChildSlugs = cache(async (hubSlug: string): Promise<Set<string>> => {
  const hub = MAGAZINE_HUBS.find((candidate) => candidate.slug === hubSlug);
  if (!hub) return new Set<string>();

  return extractHubChildSlugs(hub, await loadHubContent(hub.slug));
});

/** Every article the hub links, A–Z by link text. */
export async function getHubChildLinks(hub: MagazineHub) {
  return extractHubChildLinks(hub, await loadHubContent(hub.slug));
}

/**
 * Overview articles that point readers to a hub's full directory. /magazin/piercing only links a
 * handful of piercings in its prose, so it lists every type the Piercingarten hub knows about.
 */
const HUB_DIRECTORY_PAGES: Record<string, MagazineHub> = {
  piercing: PIERCING_HUB,
};

export async function getHubDirectoryForPage(slug: string) {
  const hub = HUB_DIRECTORY_PAGES[slug.toLowerCase()];
  if (!hub) return null;

  const html = await loadHubContent(hub.slug);
  const belongsToHub = (link: HubChildLink) => isHubTopic(hub, { title: link.label, slug: link.slug, categories: [] });
  const links = extractHubChildLinks(hub, html).filter(belongsToHub);
  const groups = extractHubChildGroups(hub, html, "Körperpiercings")
    .map((group) => ({ ...group, links: group.links.filter(belongsToHub) }))
    .filter((group) => group.links.length);
  return links.length ? { hub, links, groups } : null;
}

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
