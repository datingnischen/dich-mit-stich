export type AuthorProfileContactCard = {
  eyebrow: string;
  heading: string;
  addressLines?: string[];
  websites?: { label: string; href: string }[];
};

export type AuthorProfileHero = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type AuthorProfilePage = {
  slug: string;
  authorSlug: string;
  /** Two-sentence lead that replaces the truncated WordPress excerpt on page, in meta and in schema. */
  lead: string;
  /** Set when the imported body has no usable featured image of its own. */
  hero?: AuthorProfileHero;
  /** Square portrait sources get a 1:1 cover instead of the 5:4 expert crop. */
  portraitCover: boolean;
  /** Imported opening portrait duplicates the page hero. */
  stripLeadingPortrait: boolean;
  /** Headings whose section is rendered as a first-party block instead. */
  strippedSections: string[];
  contactCard?: AuthorProfileContactCard;
  socialsHeading: string;
  articleListHeading: string;
};

const AUTHOR_PROFILE_PAGES: Record<string, AuthorProfilePage> = {
  "anne-schweitzer": {
    slug: "anne-schweitzer",
    authorSlug: "anne-schweitzer",
    lead: "Anne Schweitzer führt mit Clemens Schweitzer das älteste Tattoo-Studio Nordhessens in Kassel. Im Magazin ordnet sie Motive und Stilfragen aus der Praxis ein.",
    hero: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/Anne-Schweitzer-Tattoo-Expertin.jpg",
      alt: "Anne Schweitzer, Tattoo Artist aus Kassel, in ihrem Studio",
      width: 1201,
      height: 1197,
    },
    portraitCover: true,
    stripLeadingPortrait: true,
    strippedSections: ["Studio & Kontakt", "Folgen Sie"],
    contactCard: {
      eyebrow: "Studio & Kontakt",
      heading: "Tätowier-Studio Anne & Clemens Schweitzer",
      addressLines: ["Steinweg 1 (gegenüber dem Staatstheater)", "34117 Kassel"],
      websites: [
        { label: "anne-schweitzer.de", href: "https://www.anne-schweitzer.de/" },
        { label: "clemens-schweitzer.de", href: "https://www.clemens-schweitzer.de/" },
      ],
    },
    socialsHeading: "Anne Schweitzer im Netz",
    articleListHeading: "Beiträge von Anne Schweitzer",
  },
  "unser-datingexperte": {
    slug: "unser-datingexperte",
    authorSlug: "redaktion",
    lead: "Christian M. Haas entwickelt seit 2008 Singlebörsen und berät dich-mit-stich.de als Datingexperte. Er schreibt über Partnersuche für tätowierte Singles.",
    portraitCover: false,
    stripLeadingPortrait: false,
    strippedSections: ["Kontakt & weitere Informationen"],
    contactCard: {
      eyebrow: "Vita & Quellen",
      heading: "Mehr Hintergrund zu Christian M. Haas",
      addressLines: ["Laufbahn, Projekterfahrung und redaktionelle Arbeit in der ausführlichen Vita."],
      websites: [{ label: "datingnischen.de/christian", href: "https://datingnischen.de/christian/" }],
    },
    socialsHeading: "Christian M. Haas im Netz",
    articleListHeading: "Beiträge von Christian M. Haas",
  },
};

export function getAuthorProfilePage(slug: string): AuthorProfilePage | null {
  return AUTHOR_PROFILE_PAGES[slug] ?? null;
}

export function isAuthorProfilePageSlug(slug: string) {
  return Boolean(AUTHOR_PROFILE_PAGES[slug]);
}

function escapeForHeading(heading: string) {
  return heading
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/&/g, "(?:&amp;|&|und)")
    .replace(/\s+/g, "\\s*");
}

function stripSection(html: string, heading: string) {
  const pattern = new RegExp(`<h2\\b[^>]*>\\s*${escapeForHeading(heading)}[^<]*</h2>`, "i");
  const match = html.match(pattern);
  if (!match || match.index === undefined) return html;
  const start = match.index;
  const next = html.indexOf("<h2", start + match[0].length);
  if (next < 0) return html;
  return html.slice(0, start) + html.slice(next);
}

/**
 * The imported profile bodies repeat what the page already renders as first-party blocks: the
 * portrait from the hero, the studio address and the list of social and vita links. Those runs are
 * removed so each fact appears exactly once.
 */
export function stripAuthorProfileDuplicates(html: string, page: AuthorProfilePage) {
  let result = html;

  if (page.stripLeadingPortrait) {
    const figure = result.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/i);
    if (figure && figure.index !== undefined && figure.index < 400 && /<img\b/i.test(figure[0])) {
      result = result.slice(0, figure.index) + result.slice(figure.index + figure[0].length);
    }
  }

  for (const heading of page.strippedSections) {
    result = stripSection(result, heading);
  }

  return result;
}
