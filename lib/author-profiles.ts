import { cache } from "react";
import { fetchWithRetry, getMagazineAuthorPostCount, getMagazinePosts, stripHtml } from "@/lib/wordpress";

const AUTHOR_ARCHIVE_BASE = "https://dich-mit-stich.de/magazin/author";

export type AuthorSocialPlatform = "instagram" | "facebook" | "youtube" | "linkedin" | "xing" | "pinterest";

export type AuthorSocialLink = {
  platform: AuthorSocialPlatform;
  label: string;
  href: string;
};

type AuthorOverride = {
  sourceUrl?: string;
  extraSameAs?: string[];
  profileUrl?: string;
  imageUrl?: string;
  role?: string;
  jobTitle?: string;
  bio?: string;
  fallbackBio?: string;
  name?: string;
  expertise?: string[];
  socials?: AuthorSocialLink[];
  facts?: string[];
};

const AUTHOR_OVERRIDES: Record<string, AuthorOverride> = {
  redaktion: {
    sourceUrl: "https://dich-mit-stich.de/magazin/author/redaktion/",
    profileUrl: "/magazin/unser-datingexperte",
    imageUrl: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/08/Christian-M-Haas.png",
    role: "Datingexperte und Autor für tätowierte Singles",
    jobTitle: "Datingexperte",
    bio:
      "Christian M. Haas beschäftigt sich seit über 10 Jahren mit Nischen-Singlebörsen und Online-Dating. Auf dich-mit-stich.de teilt er praxisnahe Tipps rund um die Partnersuche für alle, die stolz auf ihre Tattoos sind und jemanden mit derselben Leidenschaft kennenlernen möchten.",
    fallbackBio:
      "Christian M. Haas teilt Erfahrungen, Einschätzungen und konkrete Tipps rund um Dating, Szene-Fokus und Partnersuche für tätowierte Singles.",
    name: "Christian M. Haas",
    expertise: ["Tattoo Singles", "Online Dating", "Singlebörsen", "Partnersuche"],
    socials: [
      { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/datingnischen/" },
      { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/christian-m-haas-457323379" },
      { platform: "xing", label: "XING", href: "https://www.xing.com/profile/ChristianM_Haas/web_profiles" },
    ],
    extraSameAs: ["https://datingnischen.de/christian/"],
  },
  "anne-schweitzer": {
    sourceUrl: "https://dich-mit-stich.de/magazin/author/anne-schweitzer/",
    profileUrl: "/magazin/anne-schweitzer",
    imageUrl: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/Anne-Schweitzer-Tattoo-Expertin.jpg",
    role: "Tätowiererin in Kassel und Autorin im Tattoo-Magazin",
    jobTitle: "Tattoo Artist",
    bio:
      "Anne Schweitzer ist seit Jahrzehnten eine feste Größe in der Tattoo-Szene. Gemeinsam mit Clemens Schweitzer führt sie das älteste Tattoo-Studio Nordhessens – gegründet 1983 in Kassel.",
    fallbackBio: "Anne Schweitzer begleitet das Tattoo-Magazin mit redaktionellen Beiträgen zu Motiven, Stilfragen und Inspiration aus der Szene.",
    name: "Anne Schweitzer",
    expertise: ["Old School", "Black & White", "Dotwork", "Modern Style"],
    socials: [
      { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/tattoostudio_schweitzer/" },
      { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/TattooStudio.Anne.Clemens.Schweitzer" },
      { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/user/schweitzerclemens" },
    ],
    extraSameAs: ["https://www.anne-schweitzer.de/", "https://www.clemens-schweitzer.de/"],
    facts: [
      "Tätowiert im ältesten Tattoo-Studio Nordhessens – seit 1983 in Kassel",
      "Old School, Black & White, Dotwork und individuelle Custom-Designs",
    ],
  },
};

export type AuthorProfile = {
  slug: string;
  requestedSlug: string;
  name: string;
  role: string;
  jobTitle: string;
  bio: string;
  imageUrl?: string;
  profileUrl: string;
  facts: string[];
  expertise: string[];
  socials: AuthorSocialLink[];
  sameAs: string[];
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

  const archiveBio = stripHtml(firstMatch(html, /<div class="archive-description">([\s\S]*?)<\/div>/i));
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

  const postCountFact = `Bereits ${authorPostCount} veröffentlichte Beiträge im Tattoo-Magazin`;
  const facts = override.facts
    ? [...override.facts, postCountFact]
    : slug === "redaktion"
      ? [
          "Langjährige Erfahrung mit Nischen-Singlebörsen und Online-Dating",
          "Praxisnahe Tipps für tätowierte Singles und Szene-Communities",
          postCountFact,
        ]
      : [
          "Schreibt über Tattoo-Motive, Stilrichtungen und verwandte Themen",
          postCountFact,
          "Führt Leserinnen und Leser direkt zu passenden Magazin-Einstiegen",
        ];

  return {
    slug,
    requestedSlug: slug,
    name,
    role,
    jobTitle: override.jobTitle || role,
    bio:
      override.bio ||
      archiveBio ||
      override.fallbackBio ||
      (slug === "redaktion"
        ? "Christian M. Haas teilt Erfahrungen, Einschätzungen und konkrete Tipps rund um Dating, Szene-Fokus und Partnersuche für tätowierte Singles."
        : `${name} begleitet das Tattoo-Magazin mit redaktionellen Beiträgen zu Motiven, Stilfragen und Inspiration aus der Szene.`),
    imageUrl,
    profileUrl: override.profileUrl || `/magazin/author/${slug}`,
    facts,
    expertise: override.expertise || [],
    socials: override.socials || [],
    sameAs: [...(override.socials || []).map((social) => social.href), ...(override.extraSameAs || [])],
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
