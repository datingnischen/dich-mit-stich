import { cache } from "react";
import { decodeHtmlEntities } from "@/lib/wordpress";

export const tattooCitySlugs = [
  "berlin",
  "bochum",
  "bremen",
  "dortmund",
  "dresden",
  "duesseldorf",
  "essen",
  "frankfurt-am-main",
  "hamburg",
  "hannover",
  "koeln",
  "leipzig",
  "mannheim",
  "muenchen",
  "nuernberg",
  "stuttgart",
] as const;

export type TattooCitySlug = (typeof tattooCitySlugs)[number];

const cityDisplayNames: Record<string, string> = {
  berlin: "Berlin",
  bochum: "Bochum",
  bremen: "Bremen",
  dortmund: "Dortmund",
  dresden: "Dresden",
  duesseldorf: "Düsseldorf",
  essen: "Essen",
  "frankfurt-am-main": "Frankfurt am Main",
  hamburg: "Hamburg",
  hannover: "Hannover",
  koeln: "Köln",
  leipzig: "Leipzig",
  mannheim: "Mannheim",
  muenchen: "München",
  nuernberg: "Nürnberg",
  stuttgart: "Stuttgart",
};

export type TattooSinglesOverview = {
  title: string;
  description: string;
  cityLinks: { slug: string; label: string; imageUrl?: string }[];
};

export type TattooCityPage = {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  heroTitle: string;
  contentHtml: string;
  relatedCities: { slug: string; label: string }[];
  registrationUrl: string;
};

const BASE_URL = "https://dich-mit-stich.de";

const cityOverviewImages: Record<string, string> = {
  berlin: "/cities/berlin.jpg",
  bochum: "/cities/bochum.jpg",
  bremen: "/cities/bremen.jpg",
  dortmund: "/cities/dortmund.jpg",
  dresden: "/cities/dresden.jpg",
  duesseldorf: "https://static-cms.icony-hosting.de/cms/03C0A04014128F5AFC214AF19D174AE19FC31623497FF435769CBFD8B6D7A593/1000/Du%CC%88sseldorf.jpg",
  essen: "/cities/essen.jpg",
  "frankfurt-am-main": "/cities/frankfurt-am-main.jpg",
  hamburg: "/cities/hamburg.jpg",
  hannover: "/cities/hannover.jpg",
  koeln: "https://static-cms.icony-hosting.de/cms/A09A2DC9CEC3EC67627C7A6DB4897927D27E6530910D2B827ED94079314F6771/1000/Ko%CC%88ln.jpg",
  leipzig: "/cities/leipzig.jpg",
  mannheim: "/cities/mannheim.jpg",
  muenchen: "https://static-cms.icony-hosting.de/cms/300391CEAA3A23853BC56F57E16008048277D4EB2169527E3920D40E6DD4B06E/1000/Mu%CC%88nchen.jpg",
  nuernberg: "https://static-cms.icony-hosting.de/cms/6441D7B560A901E596AFC3AB89A3B5FF8C825638C014BB26E2F43556C7D527C5/Singles-N%C3%BCrnberg.jpg",
  stuttgart: "/cities/stuttgart.jpg",
};

async function fetchHtml(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "User-Agent": "Amigo dich-mit-stich tattoo-singles migration",
    },
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`Tattoo singles request failed for ${path}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function firstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : "";
}

function normalizeContentHtml(html: string) {
  return html
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/loading="lazy"/gi, 'loading="lazy" decoding="async"')
    .replace(/\sdata-media-id="[^"]*"/gi, "")
    .trim();
}

function cityLabelFromSlug(slug: string) {
  return cityDisplayNames[slug] || decodeHtmlEntities(slug.replace(/-/g, " "));
}

function relatedCitiesFromHtml(html: string) {
  const matches = [...html.matchAll(/https:\/\/dich-mit-stich\.de\/tattoo-singles\/([^/]+)\//gi)];
  const seen = new Set<string>();
  const items: { slug: string; label: string }[] = [];

  for (const match of matches) {
    const slug = match[1];
    if (!tattooCitySlugs.includes(slug as TattooCitySlug)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    items.push({ slug, label: cityLabelFromSlug(slug) });
  }

  return items;
}

export const getTattooSinglesOverview = cache(async (): Promise<TattooSinglesOverview> => {
  const html = await fetchHtml("/tattoo-singles/");
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i) || "Finde dein Tattoo Single in deiner Stadt";
  const description = firstMatch(html, /<meta name="description" content="([^"]+)"/i);
  const cityLinks = tattooCitySlugs.map((slug) => ({
    slug,
    label: cityLabelFromSlug(slug),
    imageUrl: cityOverviewImages[slug],
  }));

  return {
    title,
    description,
    cityLinks,
  };
});

export const getTattooCityPage = cache(async (slug: string): Promise<TattooCityPage | null> => {
  if (!tattooCitySlugs.includes(slug as TattooCitySlug)) return null;

  const html = await fetchHtml(`/tattoo-singles/${slug}/`);
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const metaDescription = firstMatch(html, /<meta name="description" content="([^"]+)"/i);
  const h1 = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const heroTitle = firstMatch(html, /<h2 class="h2 semibold">([\s\S]*?)<\/h2>/i);
  const registrationUrl = firstMatch(html, /<form action="([^"]*registration[^"]*)"/i) || `${BASE_URL}/registration/`;

  const contentMatch = html.match(
    /<div class="text-content m-t-64 m-b-64">([\s\S]*?)<\/div>\s*<div class="">\s*<a href="https:\/\/dich-mit-stich\.de\/registration\//i,
  );

  const contentHtml = normalizeContentHtml(contentMatch?.[1] || "");
  const relatedCities = relatedCitiesFromHtml(contentHtml).filter((city) => city.slug !== slug);

  return {
    slug,
    title,
    metaDescription,
    h1,
    heroTitle,
    contentHtml,
    relatedCities,
    registrationUrl,
  };
});
