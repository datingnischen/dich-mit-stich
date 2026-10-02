import {
  loadMagazineCategories,
  loadMagazinePages,
  loadMagazinePosts,
} from "./magazine-content.ts";
import type { MagazineCategory, MagazineEntry, MagazineRouteEntry } from "./magazine-text.ts";

export * from "./magazine-text.ts";

/**
 * Abfrage-API für das Magazin (liest Dateien im Repo, nur serverseitig importieren). Reine Textwerkzeuge und
 * Typen liegen in lib/magazine-text.ts.
 */

/** Listen tragen nur Titel, Auszug und Beitragsbild – Volltext und SEO-Felder gibt es im Detailabruf. */
function toListEntry(entry: MagazineEntry): MagazineEntry {
  return { ...entry, content: "", seoTitle: undefined, seoDescription: undefined };
}

export async function getMagazineCategories(): Promise<MagazineCategory[]> {
  return loadMagazineCategories();
}

export async function getMagazinePosts(): Promise<MagazineEntry[]> {
  return loadMagazinePosts().map(toListEntry);
}

export async function getMagazinePages(): Promise<MagazineEntry[]> {
  return loadMagazinePages().map(toListEntry);
}

export async function getMagazineRouteEntries(): Promise<MagazineRouteEntry[]> {
  return [...loadMagazinePosts(), ...loadMagazinePages()].map(({ id, slug, type, date, modified }) => ({
    id,
    slug,
    type,
    date,
    modified,
  }));
}

export const getAllMagazineEntries = getMagazineRouteEntries;

function extractFirstImageFromHtml(html = "") {
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
}

export async function getMagazineEntryBySlug(slug: string): Promise<MagazineEntry | null> {
  const entry = loadMagazinePosts().find((item) => item.slug === slug) ?? loadMagazinePages().find((item) => item.slug === slug);
  if (!entry) return null;
  return { ...entry, featuredImage: entry.featuredImage || extractFirstImageFromHtml(entry.content) };
}

export async function getMagazineCategoryBySlug(slug: string): Promise<MagazineCategory | null> {
  return loadMagazineCategories().find((category) => category.slug === slug) ?? null;
}

export async function getMagazineAuthorPostCount(slug: string): Promise<number> {
  return loadMagazinePosts().filter((post) => post.authorSlug === slug).length;
}

export async function getMagazineEntriesForCategory(slug: string): Promise<MagazineEntry[]> {
  return loadMagazinePosts()
    .filter((post) => post.categories.some((category) => category.slug === slug))
    .map(toListEntry);
}
