import { cache } from "react";
import { fetchWithRetry, getMagazineAuthorPostCount, getMagazinePosts, stripHtml } from "@/lib/wordpress";

const AUTHOR_ARCHIVE_BASE = "https://dich-mit-stich.de/magazin/author";

const AUTHOR_OVERRIDES: Record<string, { sourceUrl?: string; profileUrl?: string; imageUrl?: string; role?: string; fallbackBio?: string; name?: string }> = {
  redaktion: {
    sourceUrl: "https://dich-mit-stich.de/magazin/author/redaktion/",
    profileUrl: "/magazin/unser-datingexperte",
    imageUrl: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/08/Christian-M-Haas.png",
    role: "Datingexperte und Autor für tätowierte Singles",
    fallbackBio:
      "Christian M. Haas teilt Erfahrungen, Einschätzungen und konkrete Tipps rund um Dating, Szene-Fokus und Partnersuche für tätowierte Singles.",
    name: "Christian M. Haas",
  },
  "anne-schweitzer": {
    sourceUrl: "https://dich-mit-stich.de/magazin/author/anne-schweitzer/",
    profileUrl: "/magazin/author/anne-schweitzer",
    imageUrl: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/Anne-Schweitzer-Tattoo-Expertin-300x300.jpg",
    role: "Autorin für Tattoo-Motive, Stilfragen und Szenethemen",
    fallbackBio: "Anne Schweitzer begleitet das Tattoo-Magazin mit redaktionellen Beiträgen zu Motiven, Stilfragen und Inspiration aus der Szene.",
    name: "Anne Schweitzer",
  },
};

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

function cleanImageUrl(url?: string) {
  if (!url) return undefined;

  const shortPixelPrefix = /https:\/\/sp-ao\.shortpixel\.ai\/client\/[^/]+\/(https:\/\/.*)$/i;
  const match = url.match(shortPixelPrefix);
  const raw = match?.[1] || url;
  return decodeURIComponent(raw.replace(/&amp;/g, "&"));
}

export const getAuthorProfile = cache(async (slug: string): Promise<AuthorProfile | null> => {
  const override = AUTHOR_OVERRIDES[slug] || {};
  const url = override.sourceUrl || `${AUTHOR_ARCHIVE_BASE}/${slug}/`;

  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "Amigo dich-mit-stich author profile sync",
    },
    next: { revalidate: 1800, tags: ["wordpress:authors", `wordpress:author:${slug}`] },
  } as RequestInit & { next: { revalidate: number; tags: string[] } });

  if (!response.ok) return null;

  const html = await response.text();
  const name =
    override.name ||
    stripHtml(firstMatch(html, /<h1 class="archive-title">[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/h1>/i)) ||
    stripHtml(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));
  if (!name) return null;

  const bio = stripHtml(firstMatch(html, /<div class="archive-description">([\s\S]*?)<\/div>/i));
  const imageUrl =
    override.imageUrl ||
    cleanImageUrl(firstMatch(html, /<img[^>]+class="[^"]*avatar[^"]*"[^>]+(?:data-src|src)="([^"]+)"/i)) ||
    cleanImageUrl(firstMatch(html, /<img[^>]+(?:data-src|src)="([^"]*Christian-M-Haas[^"]*)"/i)) ||
    cleanImageUrl(firstMatch(html, /<img[^>]+(?:data-src|src)="([^"]*Anne-Schweitzer[^"]*)"/i)) ||
    undefined;

  const authorPostCount = await getMagazineAuthorPostCount(slug);
  const role =
    override.role ||
    (slug === "redaktion"
      ? "Datingexperte und Autor für tätowierte Singles"
      : "Autorin für Tattoo-Motive, Stilfragen und Szenethemen");

  const facts =
    slug === "redaktion"
      ? [
          "Langjährige Erfahrung mit Nischen-Singlebörsen und Online-Dating",
          "Praxisnahe Tipps für tätowierte Singles und Szene-Communities",
          `Bereits ${authorPostCount} veröffentlichte Beiträge im Tattoo-Magazin`,
        ]
      : [
          "Schreibt über Tattoo-Motive, Stilrichtungen und verwandte Themen",
          `Bereits ${authorPostCount} veröffentlichte Beiträge im Tattoo-Magazin`,
          "Führt Leserinnen und Leser direkt zu passenden Magazin-Einstiegen",
        ];

  return {
    slug,
    requestedSlug: slug,
    name,
    role,
    bio:
      bio ||
      override.fallbackBio ||
      (slug === "redaktion"
        ? "Christian M. Haas teilt Erfahrungen, Einschätzungen und konkrete Tipps rund um Dating, Szene-Fokus und Partnersuche für tätowierte Singles."
        : `${name} begleitet das Tattoo-Magazin mit redaktionellen Beiträgen zu Motiven, Stilfragen und Inspiration aus der Szene.`),
    imageUrl,
    profileUrl: override.profileUrl || `/magazin/author/${slug}`,
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
