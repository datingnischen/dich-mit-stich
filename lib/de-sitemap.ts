import type { MetadataRoute } from "next";
import { ABOUT_PATHS } from "@/lib/about-pages";
import { FAQ_PATH } from "@/lib/faq";
import { isThinMagazineCategory } from "@/lib/editorial-metadata";
import { isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { getMagazineCategories, getMagazineRouteEntries } from "@/lib/wordpress";
import { withTrailingSlash } from "@/lib/markets";
import { tattooCitySlugs } from "@/lib/tattoo-singles";
import { getIndexableTattooStudioCities } from "@/lib/tattoo-studio-guide";

const SITE_URL = "https://dich-mit-stich.de";

// Die DE-Sitemap gibt es gesamt unter /sitemap.xml und je Bereich unter /magazin/sitemap.xml und
// /tattoo-studios/sitemap.xml – dort lagen die Sitemaps der alten WordPress-Installationen, die
// Crawler und Suchmaschinen noch kennen. nginx reicht beide Bereiche an Vercel durch.
function withSlashes(locations: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return locations.map((location) => ({ ...location, url: withTrailingSlash(location.url) }));
}

async function magazineLocations(): Promise<MetadataRoute.Sitemap> {
  const [rawEntries, rawCategories] = await Promise.all([getMagazineRouteEntries(), getMagazineCategories()]);
  const entries = rawEntries.filter(
    (entry) => !["expertenteam", "home", "tattoo-studios"].includes(entry.slug) && !isMagazineArticleQuarantined(entry.slug),
  );
  const categories = rawCategories.filter(
    (category) => category.slug !== "erfolgsgeschichten" && !isThinMagazineCategory(category),
  );

  return [
    { url: `${SITE_URL}/magazin`, changeFrequency: "daily", priority: 0.9 },
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
  ];
}

function studioLocations(): MetadataRoute.Sitemap {
  const studioCities = getIndexableTattooStudioCities("de");
  return [
    { url: `${SITE_URL}/tattoo-studios`, changeFrequency: "weekly", priority: 0.9 },
    ...studioCities.map((city) => ({
      url: `${SITE_URL}/tattoo-studios/${city.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
      lastModified: city.lastVerified,
    })),
  ];
}

function siteLocations(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tattoo-singles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}${FAQ_PATH}`, changeFrequency: "monthly", priority: 0.8 },
    ...ABOUT_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/ueber-uns" ? 0.8 : 0.7,
    })),
    ...tattooCitySlugs.map((slug) => ({
      url: `${SITE_URL}/tattoo-singles/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

export async function deSitemap(): Promise<MetadataRoute.Sitemap> {
  return withSlashes([...siteLocations(), ...(await magazineLocations()), ...studioLocations()]);
}

export async function deMagazineSitemap(): Promise<MetadataRoute.Sitemap> {
  return withSlashes(await magazineLocations());
}

export function deStudioSitemap(): MetadataRoute.Sitemap {
  return withSlashes(studioLocations());
}
