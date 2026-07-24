import { cache } from "react";
import { getMagazinePosts, stripHtml } from "@/lib/wordpress";

const AUTHOR_ARCHIVE_BASE = "https://dich-mit-stich.de/magazin/author";

export type AuthorProfile = {
  slug: string;
  requestedSlug: string;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
  profileUrl: string;
  facts: string[];
};

function firstMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1]?.trim() || "";
}

export const getAuthorProfile = cache(async (slug: string): Promise<AuthorProfile | null> => {
  const url = `${AUTHOR_ARCHIVE_BASE}/${slug}/`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Amigo dich-mit-stich author profile sync",
    },
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) return null;

  const html = await response.text();
  const name = stripHtml(firstMatch(html, /<h1 class="archive-title">[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/h1>/i));
  if (!name) return null;

  const bio = stripHtml(firstMatch(html, /<div class="archive-description">([\s\S]*?)<\/div>/i));
  const imageUrl = firstMatch(html, /<img[^>]+class="[^"]*avatar[^"]*"[^>]+(?:data-src|src)="([^"]+)"/i) || undefined;

  const posts = await getMagazinePosts();
  const authorPosts = posts.filter((post) => post.authorSlug === slug);
  const role =
    slug === "redaktion"
      ? "Datingexperte und Autor für tätowierte Singles"
      : "Autorin für Tattoo-Motive, Stilfragen und Szenethemen";

  const facts =
    slug === "redaktion"
      ? [
          "Langjährige Erfahrung mit Nischen-Singlebörsen und Online-Dating",
          "Praxisnahe Tipps für tätowierte Singles und Szene-Communities",
          `Bereits ${authorPosts.length} veröffentlichte Beiträge im Tattoo-Magazin`,
        ]
      : [
          "Schreibt über Tattoo-Motive, Stilrichtungen und verwandte Themen",
          `Bereits ${authorPosts.length} veröffentlichte Beiträge im Tattoo-Magazin`,
          "Führt Leserinnen und Leser direkt zu passenden Magazin-Einstiegen",
        ];

  return {
    slug,
    requestedSlug: slug,
    name,
    role,
    bio:
      bio ||
      (slug === "redaktion"
        ? "Christian M. Haas teilt Erfahrungen, Einschätzungen und konkrete Tipps rund um Dating, Szene-Fokus und Partnersuche für tätowierte Singles."
        : `${name} begleitet das Tattoo-Magazin mit redaktionellen Beiträgen zu Motiven, Stilfragen und Inspiration aus der Szene.`),
    imageUrl,
    profileUrl: `/magazin/author/${slug}`,
    facts,
  };
});

export const getKnownAuthorSlugs = cache(async (): Promise<string[]> => {
  const posts = await getMagazinePosts();
  const slugs = new Set(posts.map((post) => post.authorSlug).filter(Boolean) as string[]);
  return [...slugs];
});

export const getAuthorPosts = cache(async (slug: string) => {
  const posts = await getMagazinePosts();
  return posts.filter((post) => post.authorSlug === slug);
});
