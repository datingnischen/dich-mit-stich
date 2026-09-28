import type { MetadataRoute } from "next";
import { deSitemap } from "@/lib/de-sitemap";

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return deSitemap();
}
