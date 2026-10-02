import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type { MagazineCategory, MagazineEntry } from "./magazine-text.ts";
import { UPLOADS_PATH } from "./magazine-urls.ts";
import { staticAsset } from "./static-asset.ts";

/**
 * Magazin-Inhalte aus Dateien im Repo (kein WordPress mehr):
 *   content/magazin/beitraege/<slug>.md   Beiträge (Frontmatter + HTML-Körper)
 *   content/magazin/seiten/<slug>.md      feste Seiten (Hubs, Motiv-Lexikon, Autorenprofile)
 *   data/magazin-kategorien.json          Kategorien
 *   data/magazin-autoren.json             Autoren und Autorenprofile (lib/author-profiles.ts)
 * Bilder und Audio liegen unter public/magazin/wp-content/uploads/ (Pfad wie früher in WordPress).
 */

type Frontmatter = {
  id: number;
  title: string;
  seoTitle?: string;
  description?: string;
  excerpt?: string;
  published?: string;
  updated?: string;
  categories?: string[];
  author?: string;
  image?: string;
  imageAlt?: string;
};

type CategoryRow = { id: number; slug: string; name: string; description: string };
type AuthorRow = { slug: string; name: string };

const root = () => process.cwd();

export function readDataJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(root(), "data", file), "utf8")) as T;
}

function readFolder(folder: string) {
  const dir = path.join(root(), "content", "magazin", folder);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) => {
      const parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
      return { slug: name.replace(/\.md$/, ""), data: parsed.data as Frontmatter, body: parsed.content.trim() };
    });
}

// Uploads liegen in public/. Auf der Live-Domain liefert nginx nur Seitenrouten, Dateien kommen vom Asset-Host
// (wie alle anderen Bilder der App): Pfade werden beim Laden auf die absolute Asset-URL umgeschrieben.
export function withAssetHost(html: string) {
  return html.split(UPLOADS_PATH).join(staticAsset(UPLOADS_PATH));
}

type Loaded = { posts: MagazineEntry[]; pages: MagazineEntry[]; categories: MagazineCategory[] };
let cached: Loaded | null = null;

function build(): Loaded {
  const categoryRows = readDataJson<CategoryRow[]>("magazin-kategorien.json");
  const authorRows = readDataJson<AuthorRow[]>("magazin-autoren.json");
  const categories: MagazineCategory[] = categoryRows.map((row) => ({ ...row, count: 0 }));

  const toEntry = (file: ReturnType<typeof readFolder>[number], type: "post" | "page"): MagazineEntry => {
    const { data } = file;
    const author = authorRows.find((item) => item.slug === data.author);
    return {
      id: data.id,
      slug: file.slug,
      type,
      date: data.published,
      modified: data.updated,
      title: data.title,
      excerpt: withAssetHost(data.excerpt ?? ""),
      content: withAssetHost(file.body),
      featuredImage: data.image ? withAssetHost(data.image) : undefined,
      featuredImageAlt: data.imageAlt,
      authorName: author?.name,
      authorSlug: author?.slug,
      categories: (data.categories ?? [])
        .map((slug) => categories.find((item) => item.slug === slug))
        .filter((item): item is MagazineCategory => Boolean(item)),
      seoTitle: data.seoTitle,
      seoDescription: data.description,
    };
  };

  const posts = readFolder("beitraege")
    .map((file) => toEntry(file, "post"))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const pages = readFolder("seiten")
    .map((file) => toEntry(file, "page"))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
  for (const post of posts) for (const category of post.categories) category.count += 1;

  return { posts, pages, categories: [...categories].sort((a, b) => b.count - a.count) };
}

function load(): Loaded {
  if (cached) return cached;
  const loaded = build();
  // Dateien ändern sich zur Laufzeit nicht: in Production einmal einlesen, in dev immer frisch.
  if (process.env.NODE_ENV === "production") cached = loaded;
  return loaded;
}

export const loadMagazinePosts = () => load().posts;
export const loadMagazinePages = () => load().pages;
export const loadMagazineCategories = () => load().categories;
