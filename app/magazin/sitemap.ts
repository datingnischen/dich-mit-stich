import type { MetadataRoute } from "next";
import { deMagazineSitemap } from "@/lib/de-sitemap";

// /magazin/sitemap.xml war die Sitemap des Magazin-WordPress; sie listet jetzt die Magazinseiten aus Next.js.
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return deMagazineSitemap();
}
