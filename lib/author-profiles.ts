import { getMagazineAuthorPostCount, getMagazinePosts } from "./magazine.ts";
import { readDataJson, withAssetHost } from "./magazine-content.ts";

export type AuthorSocialPlatform = "instagram" | "facebook" | "youtube" | "linkedin" | "xing" | "pinterest";

export type AuthorSocialLink = {
  platform: AuthorSocialPlatform;
  label: string;
  href: string;
};

/** Eintrag in data/magazin-autoren.json (früher WordPress-Benutzer plus Profil-Overrides im Code). */
type AuthorRow = {
  id: number;
  slug: string;
  name: string;
  profileUrl?: string;
  image?: string;
  role: string;
  jobTitle?: string;
  bio: string;
  expertise?: string[];
  socials?: AuthorSocialLink[];
  extraSameAs?: string[];
  /** Faktenliste ohne die Beitragszahl, die kommt aus den Beitragsdateien. */
  facts: string[];
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

export async function getAuthorProfile(slug: string): Promise<AuthorProfile | null> {
  const row = readDataJson<AuthorRow[]>("magazin-autoren.json").find((author) => author.slug === slug);
  if (!row) return null;

  const authorPostCount = await getMagazineAuthorPostCount(slug);
  const socials = row.socials ?? [];

  return {
    slug,
    requestedSlug: slug,
    name: row.name,
    role: row.role,
    jobTitle: row.jobTitle || row.role,
    bio: row.bio,
    imageUrl: row.image ? withAssetHost(row.image) : undefined,
    profileUrl: row.profileUrl || `/magazin/author/${slug}`,
    facts: [...row.facts, `Bereits ${authorPostCount} veröffentlichte Beiträge im Tattoo-Magazin`],
    expertise: row.expertise ?? [],
    socials,
    sameAs: [...socials.map((social) => social.href), ...(row.extraSameAs ?? [])],
  };
}

export async function getKnownAuthorSlugs(): Promise<string[]> {
  const posts = await getMagazinePosts();
  const slugs = new Set(posts.map((post) => post.authorSlug).filter(Boolean) as string[]);
  return [...slugs];
}

export async function getAuthorPosts(slug: string) {
  const posts = await getMagazinePosts();
  return posts.filter((post) => post.authorSlug === slug);
}
