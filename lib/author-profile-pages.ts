import type { AuthorSocialLink } from "./author-profiles.ts";

export type AuthorProfileStudio = {
  name: string;
  addressLines: string[];
  websites: { label: string; href: string }[];
};

export type AuthorProfilePage = {
  slug: string;
  authorSlug: string;
  hero: { src: string; alt: string; width: number; height: number };
  studio?: AuthorProfileStudio;
  socialsHeading: string;
  articleListHeading: string;
};

const AUTHOR_PROFILE_PAGES: Record<string, AuthorProfilePage> = {
  "anne-schweitzer": {
    slug: "anne-schweitzer",
    authorSlug: "anne-schweitzer",
    hero: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/Anne-Schweitzer-Tattoo-Expertin.jpg",
      alt: "Anne Schweitzer, Tattoo Artist aus Kassel, in ihrem Studio",
      width: 1201,
      height: 1197,
    },
    studio: {
      name: "Tätowier-Studio Anne & Clemens Schweitzer",
      addressLines: ["Steinweg 1 (gegenüber dem Staatstheater)", "34117 Kassel"],
      websites: [
        { label: "anne-schweitzer.de", href: "https://www.anne-schweitzer.de/" },
        { label: "clemens-schweitzer.de", href: "https://www.clemens-schweitzer.de/" },
      ],
    },
    socialsHeading: "Anne Schweitzer im Netz",
    articleListHeading: "Beiträge von Anne Schweitzer",
  },
};

export function getAuthorProfilePage(slug: string): AuthorProfilePage | null {
  return AUTHOR_PROFILE_PAGES[slug] ?? null;
}

export function isAuthorProfilePageSlug(slug: string) {
  return Boolean(AUTHOR_PROFILE_PAGES[slug]);
}

function stripSection(html: string, heading: RegExp) {
  const match = html.match(heading);
  if (!match || match.index === undefined) return html;
  const start = match.index;
  const next = html.indexOf("<h2", start + match[0].length);
  if (next < 0) return html;
  return html.slice(0, start) + html.slice(next);
}

/**
 * The WordPress profile page opens with the same portrait that the page hero already shows and
 * renders studio address plus social profiles as plain lists. Both are rendered as first-party
 * blocks instead, so they are removed from the imported body.
 */
export function stripAuthorProfileDuplicates(html: string, page: AuthorProfilePage) {
  let result = html;

  const figure = result.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/i);
  if (figure && figure.index !== undefined && figure.index < 400 && /<img\b/i.test(figure[0])) {
    result = result.slice(0, figure.index) + result.slice(figure.index + figure[0].length);
  }

  if (page.studio) {
    result = stripSection(result, /<h2\b[^>]*>\s*Studio\s*(?:&amp;|&|und)\s*Kontakt\s*<\/h2>/i);
  }
  result = stripSection(result, /<h2\b[^>]*>\s*Folgen Sie[^<]*<\/h2>/i);

  return result;
}

export function authorProfileSameAs(socials: AuthorSocialLink[], page: AuthorProfilePage | null) {
  const websites = page?.studio?.websites.map((site) => site.href) ?? [];
  return [...socials.map((social) => social.href), ...websites];
}
