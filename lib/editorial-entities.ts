import type { AuthorProfile } from "@/lib/author-profiles";
import type { AnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { latestIsoDate } from "@/lib/json-ld";
import type { MagazineEntry } from "@/lib/wordpress";

const SITE_URL = "https://dich-mit-stich.de";

export const EDITORIAL_ENTITY_IDS = {
  website: `${SITE_URL}/#website`,
  brand: `${SITE_URL}/#brand`,
  operator: `${SITE_URL}/#operator`,
} as const;

function absolutePublicUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function authorEntityId(profileUrl: string) {
  return `${absolutePublicUrl(profileUrl).replace(/\/$/, "")}#person`;
}

export function buildAuthorProfileGraph(profile: AuthorProfile) {
  const canonical = absolutePublicUrl(profile.profileUrl).replace(/\/$/, "");
  const personId = authorEntityId(profile.profileUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": EDITORIAL_ENTITY_IDS.operator,
        name: "Icony GmbH",
        url: SITE_URL,
      },
      {
        "@type": "WebSite",
        "@id": EDITORIAL_ENTITY_IDS.website,
        url: SITE_URL,
        name: "Dich mit Stich",
        inLanguage: "de-DE",
        publisher: { "@id": EDITORIAL_ENTITY_IDS.operator },
      },
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: profile.name,
        isPartOf: { "@id": EDITORIAL_ENTITY_IDS.website },
        mainEntity: { "@id": personId },
        inLanguage: "de-DE",
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
};

export function buildMagazineArticleGraph({
  entry,
  description,
  authorProfile,
  featuredImage,
  pilotEntry,
}: MagazineArticleGraphInput) {
  const canonical = `${SITE_URL}/magazin/${entry.slug}`;
  const pageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": EDITORIAL_ENTITY_IDS.operator,
      name: "Icony GmbH",
      url: SITE_URL,
    },
    {
      "@type": "Brand",
      "@id": EDITORIAL_ENTITY_IDS.brand,
      name: "Dich mit Stich",
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": EDITORIAL_ENTITY_IDS.website,
      url: SITE_URL,
      name: "Dich mit Stich",
      inLanguage: "de-DE",
      publisher: { "@id": EDITORIAL_ENTITY_IDS.operator },
      about: { "@id": EDITORIAL_ENTITY_IDS.brand },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: canonical,
      name: entry.title,
      isPartOf: { "@id": EDITORIAL_ENTITY_IDS.website },
      primaryImageOfPage: featuredImage ? { "@id": `${canonical}#primaryimage` } : undefined,
      inLanguage: "de-DE",
    },
  ];

  if (featuredImage) {
    graph.push({
      "@type": "ImageObject",
      "@id": `${canonical}#primaryimage`,
      url: absolutePublicUrl(featuredImage.src),
      caption: entry.featuredImageAlt || entry.title,
    });
  }

  if (authorProfile) {
    graph.push({
      "@type": "Person",
      "@id": authorEntityId(authorProfile.profileUrl),
      name: authorProfile.name,
      url: absolutePublicUrl(authorProfile.profileUrl),
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
    inLanguage: "de-DE",
    isPartOf: { "@id": EDITORIAL_ENTITY_IDS.website },
    publisher: { "@id": EDITORIAL_ENTITY_IDS.operator },
    author: authorProfile ? { "@id": authorEntityId(authorProfile.profileUrl) } : undefined,
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
