import { getMarket, publicUrl, type MarketCode } from "./markets.ts";
import { staticAsset } from "./static-asset.ts";

const PROFILE_SLUG = "unser-datingexperte";
const PROFILE_PATH = `/magazin/${PROFILE_SLUG}`;
const AMAZON_URL = "https://www.amazon.de/dp/3696371211/";
const START = "<!-- dating-ohne-bullshit-book:start -->";
const END = "<!-- dating-ohne-bullshit-book:end -->";
const SCHEMA_START = "<!-- dating-ohne-bullshit-schema:start -->";
const SCHEMA_END = "<!-- dating-ohne-bullshit-schema:end -->";

type PublishedAuthorProfileInput = {
  slug: string;
  title: string;
  description: string;
  content: string;
  modified?: string | null;
  personImage?: string | null;
  market?: MarketCode;
};

type JsonLdNode = Record<string, unknown>;

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;|&#0*38;/gi, "&")
    .replace(/&quot;|&#0*34;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'");
}

function findPublishedBookBlock(content: string) {
  const markerStart = content.indexOf(START);
  const markerEnd = content.indexOf(END, markerStart + START.length);
  if (markerStart >= 0 && markerEnd >= 0) {
    return {
      start: markerStart,
      end: markerEnd + END.length,
      block: content.slice(markerStart + START.length, markerEnd),
    };
  }

  const amazonIndex = content.indexOf(AMAZON_URL);
  if (amazonIndex < 0) return null;
  const sectionStart = content.lastIndexOf("<section", amazonIndex);
  const sectionClose = content.indexOf("</section>", amazonIndex);
  if (sectionStart < 0 || sectionClose < 0) return null;
  const end = sectionClose + "</section>".length;
  const block = content.slice(sectionStart, end);
  if (!block.includes("Dating ohne Bullshit") || !block.includes("978-3-6963-7121-0")) return null;
  return { start: sectionStart, end, block };
}

function extractBoundedBookCover(content: string) {
  const match = findPublishedBookBlock(content);
  if (!match || !match.block.includes(AMAZON_URL)) return null;

  const image = match.block.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1];
  if (!image) return null;
  return decodeHtmlAttribute(image);
}

export function stripPublishedBookBlock(content: string) {
  const match = findPublishedBookBlock(content);
  if (!match) return content;
  return content.slice(0, match.start) + content.slice(match.end);
}

export function stripLegacyExpertPortrait(content: string) {
  const imageIndex = content.indexOf("Christian-M-Haas-200x300.png");
  if (imageIndex < 0) return content;
  const paragraphStart = content.lastIndexOf("<p", imageIndex);
  const paragraphClose = content.indexOf("</p>", imageIndex);
  if (paragraphStart < 0 || paragraphClose < 0) return content;
  const end = paragraphClose + "</p>".length;
  const block = content.slice(paragraphStart, end);
  if (!block.includes("<img") || !block.includes('alt="Datingexperte"')) return content;
  return content.slice(0, paragraphStart) + content.slice(end);
}

export function stripPublishedBookSchema(content: string) {
  let result = content;
  let start = result.indexOf(SCHEMA_START);
  while (start >= 0) {
    const end = result.indexOf(SCHEMA_END, start + SCHEMA_START.length);
    if (end < 0) break;
    result = result.slice(0, start) + result.slice(end + SCHEMA_END.length);
    start = result.indexOf(SCHEMA_START);
  }
  return result;
}

export function buildPublishedAuthorProfileGraph(input: PublishedAuthorProfileInput) {
  if (input.slug !== PROFILE_SLUG) return null;
  const bookCover = extractBoundedBookCover(input.content);
  if (!bookCover) return null;
  const market = input.market ?? "de";
  const profileUrl = publicUrl(market, PROFILE_PATH);
  const personId = `${profileUrl}#person`;
  const bookId = `${profileUrl}#book-isbn-9783696371210`;
  const locale = getMarket(market).locale;

  const nodes: JsonLdNode[] = [
    {
      "@type": "BreadcrumbList",
      "@id": `${profileUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Magazin", item: publicUrl(market, "/magazin") },
        { "@type": "ListItem", position: 2, name: "Christian M. Haas", item: profileUrl },
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": `${profileUrl}#webpage`,
      url: profileUrl,
      name: input.title,
      description: input.description,
      breadcrumb: { "@id": `${profileUrl}#breadcrumb` },
      mainEntity: { "@id": personId },
      dateModified: input.modified || undefined,
      inLanguage: locale,
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Christian M. Haas",
      url: profileUrl,
      description: input.description,
      jobTitle: "Datingexperte und Autor für tätowierte Singles",
      image: input.personImage || undefined,
    },
    {
      "@type": "Book",
      "@id": bookId,
      name: "Dating ohne Bullshit",
      alternateName: "Der ungeschönte Insiderblick ins Online-Dating-Business",
      author: { "@id": personId },
      isbn: "9783696371210",
      datePublished: "2026-08-21",
      inLanguage: locale,
      bookFormat: "https://schema.org/Paperback",
      numberOfPages: 136,
      url: AMAZON_URL,
      image: staticAsset("/images/books/dating-ohne-bullshit-cover.webp"),
    },
  ];

  return { "@context": "https://schema.org", "@graph": nodes };
}
