import type { AuthorProfile } from "@/lib/author-profiles";
import type { AnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { latestIsoDate } from "@/lib/json-ld";
import { getMarket, publicUrl, type MarketCode } from "@/lib/markets";
import type { MagazineEntry } from "@/lib/wordpress";

const SITE_URL = publicUrl("de");

export const EDITORIAL_ENTITY_IDS = {
  website: `${SITE_URL}#website`,
  brand: `${SITE_URL}#brand`,
  operator: `${SITE_URL}#operator`,
} as const;

function editorialEntityIds(market: MarketCode) {
  const siteUrl = publicUrl(market);
  return {
    website: `${siteUrl}#website`,
    brand: `${siteUrl}#brand`,
    operator: `${siteUrl}#operator`,
  };
}

function absolutePublicUrl(path: string, market: MarketCode = "de") {
  return new URL(path, publicUrl(market)).toString();
}

export function authorEntityId(profileUrl: string, market: MarketCode = "de") {
  return `${absolutePublicUrl(profileUrl, market).replace(/\/$/, "")}#person`;
}

export function buildAuthorProfileGraph(profile: AuthorProfile, market: MarketCode = "de") {
  const siteUrl = publicUrl(market);
  const locale = getMarket(market).locale;
  const entityIds = editorialEntityIds(market);
  const canonical = absolutePublicUrl(profile.profileUrl, market).replace(/\/$/, "");
  const personId = authorEntityId(profile.profileUrl, market);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": entityIds.operator,
        name: "Icony GmbH",
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        "@id": entityIds.website,
        url: siteUrl,
        name: "Dich mit Stich",
        inLanguage: locale,
        publisher: { "@id": entityIds.operator },
      },
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: profile.name,
        isPartOf: { "@id": entityIds.website },
        mainEntity: { "@id": personId },
        inLanguage: locale,
      },
      {
        "@type": "Person",
        "@id": personId,
        name: profile.name,
        url: canonical,
        description: profile.bio,
        jobTitle: profile.role,
        image: profile.imageUrl,
      },
    ],
  };
}

type MagazineArticleGraphInput = {
  entry: MagazineEntry;
  description: string;
  authorProfile: AuthorProfile | null;
  featuredImage?: { src: string } | null;
  pilotEntry: AnswerEnginePilotEntry | null;
  market?: MarketCode;
};

export function buildMagazineArticleGraph({
  entry,
  description,
  authorProfile,
  featuredImage,
  pilotEntry,
  market = "de",
}: MagazineArticleGraphInput) {
  const siteUrl = publicUrl(market);
  const locale = getMarket(market).locale;
  const entityIds = editorialEntityIds(market);
  const canonical = publicUrl(market, `/magazin/${entry.slug}`);
  const pageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": entityIds.operator,
      name: "Icony GmbH",
      url: siteUrl,
    },
    {
      "@type": "Brand",
      "@id": entityIds.brand,
      name: "Dich mit Stich",
      url: siteUrl,
    },
    {
      "@type": "WebSite",
      "@id": entityIds.website,
      url: siteUrl,
      name: "Dich mit Stich",
      inLanguage: locale,
      publisher: { "@id": entityIds.operator },
      about: { "@id": entityIds.brand },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: canonical,
      name: entry.title,
      isPartOf: { "@id": entityIds.website },
      primaryImageOfPage: featuredImage ? { "@id": `${canonical}#primaryimage` } : undefined,
      inLanguage: locale,
    },
  ];

  if (featuredImage) {
    graph.push({
      "@type": "ImageObject",
      "@id": `${canonical}#primaryimage`,
      url: absolutePublicUrl(featuredImage.src, market),
      caption: entry.featuredImageAlt || entry.title,
    });
  }

  if (authorProfile) {
    graph.push({
      "@type": "Person",
      "@id": authorEntityId(authorProfile.profileUrl, market),
      name: authorProfile.name,
      url: absolutePublicUrl(authorProfile.profileUrl, market),
      jobTitle: authorProfile.role,
      image: authorProfile.imageUrl,
    });
  }

  graph.push({
    "@type": "Article",
    "@id": articleId,
    url: canonical,
    mainEntityOfPage: { "@id": pageId },
    headline: entry.title,
    description,
    datePublished: entry.date,
    dateModified: latestIsoDate(entry.modified, pilotEntry?.reviewedAt, entry.date),
    inLanguage: locale,
    isPartOf: { "@id": entityIds.website },
    publisher: { "@id": entityIds.operator },
    author: authorProfile ? { "@id": authorEntityId(authorProfile.profileUrl, market) } : undefined,
    image: featuredImage ? { "@id": `${canonical}#primaryimage` } : undefined,
    about: pilotEntry ? [
      { "@type": "Thing", name: pilotEntry.cluster === "piercing" ? "Piercing" : "Tattoo" },
      { "@type": "Thing", name: entry.title },
    ] : undefined,
    citation: pilotEntry?.sources.map((source) => source.url),
  });

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
