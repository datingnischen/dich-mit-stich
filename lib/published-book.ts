const SITE_URL = "https://dich-mit-stich.de";
const PROFILE_SLUG = "unser-datingexperte";
const PROFILE_PATH = `/magazin/${PROFILE_SLUG}`;
const PROFILE_URL = `${SITE_URL}${PROFILE_PATH}`;
const PERSON_ID = `${PROFILE_URL}#person`;
const BOOK_ID = `${PROFILE_URL}#book-isbn-9783696371210`;
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
};

type JsonLdNode = Record<string, unknown>;

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;|&#0*38;/gi, "&")
    .replace(/&quot;|&#0*34;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'");
}

function extractBoundedBookCover(content: string) {
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start < 0 || end < 0) return null;

  const block = content.slice(start + START.length, end);
  if (!block.includes(AMAZON_URL)) return null;

  const image = block.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1];
  if (!image) return null;
  return decodeHtmlAttribute(image);
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

  const nodes: JsonLdNode[] = [
    {
      "@type": "BreadcrumbList",
      "@id": `${PROFILE_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Magazin", item: `${SITE_URL}/magazin` },
        { "@type": "ListItem", position: 2, name: "Christian M. Haas", item: PROFILE_URL },
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": `${PROFILE_URL}#webpage`,
      url: PROFILE_URL,
      name: input.title,
      description: input.description,
      breadcrumb: { "@id": `${PROFILE_URL}#breadcrumb` },
      mainEntity: { "@id": PERSON_ID },
      dateModified: input.modified || undefined,
      inLanguage: "de-DE",
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Christian M. Haas",
      url: PROFILE_URL,
      description: input.description,
      jobTitle: "Datingexperte und Autor für tätowierte Singles",
      image: input.personImage || undefined,
    },
    {
      "@type": "Book",
      "@id": BOOK_ID,
      name: "Dating ohne Bullshit",
      alternateName: "Der ungeschönte Insiderblick ins Online-Dating-Business",
      author: { "@id": PERSON_ID },
      isbn: "9783696371210",
      datePublished: "2026-08-21",
      inLanguage: "de-DE",
      bookFormat: "https://schema.org/Paperback",
      numberOfPages: 136,
      url: AMAZON_URL,
      image: bookCover,
    },
  ];

  return { "@context": "https://schema.org", "@graph": nodes };
}
