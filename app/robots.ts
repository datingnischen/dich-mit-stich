import type { MetadataRoute } from "next";
import { CONTEST_ADMIN_PATH, CONTEST_API_PATH } from "@/lib/contest/config";
import { publicUrl } from "@/lib/markets";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Contest: Moderation und JSON-API sind keine Seiten für Suchmaschinen.
      disallow: [`${CONTEST_ADMIN_PATH}/`, `${CONTEST_API_PATH}/`],
    },
    sitemap: publicUrl("de", "/sitemap.xml"),
    host: publicUrl("de"),
  };
}