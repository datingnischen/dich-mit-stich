import type { MetadataRoute } from "next";
import { getMagazineCategories, getMagazineRouteEntries } from "@/lib/wordpress";
import { tattooCitySlugs } from "@/lib/tattoo-singles";
import { getTattooStudioCities, getTattooStudioSlugs } from "@/lib/tattoo-studio-guide";

const SITE_URL = "https://dich-mit-stich.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories] = await Promise.all([getMagazineRouteEntries(), getMagazineCategories()]);
  const studioCities = getTattooStudioCities("de");
  const studioSlugs = getTattooStudioSlugs("de");

  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/magazin`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tattoo-singles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tattoo-studios`, changeFrequency: "weekly", priority: 0.9 },
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
    ...studioCities.map((city) => ({
      url: `${SITE_URL}/tattoo-studios/${city.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
      lastModified: city.lastVerified,
    })),
    ...studioSlugs.map((slug) => ({
      url: `${SITE_URL}/tattoo-studio/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
