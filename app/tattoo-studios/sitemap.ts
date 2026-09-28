import type { MetadataRoute } from "next";
import { deStudioSitemap } from "@/lib/de-sitemap";

// /tattoo-studios/sitemap.xml war die Sitemap des Studio-WordPress; sie listet jetzt die Studio-Guides.
export default function sitemap(): MetadataRoute.Sitemap {
  return deStudioSitemap();
}
