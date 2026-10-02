import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { withAssetHost } from "./magazine-content.ts";

/**
 * Tattoo-Singles-Stadtseiten aus Dateien im Repo (kein WordPress-Custom-Post-Type "stadt" mehr):
 *   content/staedte/<markt>-<stadt>.md   Frontmatter (Titel, Hero, Bildnachweis) + bereinigtes HTML
 * Bilder liegen unter public/magazin/wp-content/uploads/ und werden beim Laden auf den Asset-Host gelegt.
 */

type CityMarket = "de" | "ch" | "at";

export type CityPage = {
  id: number;
  market: CityMarket;
  slug: string;
  cityName: string;
  cityRegion: string;
  title: string;
  metaDescription: string;
  h1: string;
  heroTitle: string;
  imageUrl: string | null;
  imageAlt: string;
  imageAttribution: {
    label: string;
    sourceUrl: string;
    publisher: string;
    licenseLabel: string;
    licenseUrl: string;
  };
  contentHtml: string;
  relatedCities: { slug: string; label: string }[];
  registrationUrl: string;
};

export type CityOverview = {
  title: string;
  description: string;
  cityLinks: Array<{ slug: string; label: string; region: string; imageUrl: string | null }>;
};

type CityFrontmatter = Omit<CityPage, "contentHtml" | "relatedCities" | "imageUrl"> & { image?: string };

let cached: CityPage[] | null = null;

function loadCities(): CityPage[] {
  if (cached) return cached;
  const dir = path.join(process.cwd(), "content", "staedte");
  const cities = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name): CityPage => {
      const parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
      const { image, ...data } = parsed.data as CityFrontmatter;
      return {
        ...data,
        imageUrl: image ? withAssetHost(image) : null,
        contentHtml: withAssetHost(parsed.content.trim()),
        relatedCities: [],
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
  // Dateien ändern sich zur Laufzeit nicht: in Production einmal einlesen, in dev immer frisch.
  if (process.env.NODE_ENV === "production") cached = cities;
  return cities;
}

export async function getCitySlugs(market: CityMarket): Promise<string[]> {
  return loadCities().filter((city) => city.market === market).map((city) => city.slug);
}

export async function getCityOverview(market: CityMarket): Promise<CityOverview> {
  const cities = loadCities().filter((city) => city.market === market);

  return {
    title: market === "ch" ? "Tattoo Singles Schweiz" : "Tattoo-Singles in Deutschland",
    description: market === "ch"
      ? "Finde dein Perfect Tattoo Match in der Schweiz. Wir verbinden tätowierte Singles."
      : "Finde tätowierte und gepiercte Singles in deiner Stadt und entdecke lokale Szene-Guides.",
    cityLinks: cities
      .map((city) => ({ slug: city.slug, label: city.cityName, region: city.cityRegion, imageUrl: city.imageUrl }))
      .sort((a, b) => a.label.localeCompare(b.label, "de")),
  };
}

export async function getCityPage(market: CityMarket, slug: string): Promise<CityPage | null> {
  return loadCities().find((city) => city.market === market && city.slug === slug) ?? null;
}
