import type { MetadataRoute } from "next";
import { getAllMagazineEntries, getMagazineCategories } from "@/lib/wordpress";
import { tattooCitySlugs } from "@/lib/tattoo-singles";

const SITE_URL = "https://dich-mit-stich.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories] = await Promise.all([getAllMagazineEntries(), getMagazineCategories()]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/magazin`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tattoo-singles`, changeFrequency: "daily", priority: 0.9 },
    ...entries.map((entry) => ({
      url: `${SITE_URL}/magazin/${entry.slug}`,
      changeFrequency: "weekly" as const,
      priority: entry.type === "post" ? 0.8 : 0.7,
      lastModified: entry.modified || entry.date,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/magazin/thema/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tattooCitySlugs.map((slug) => ({
      url: `${SITE_URL}/tattoo-singles/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
