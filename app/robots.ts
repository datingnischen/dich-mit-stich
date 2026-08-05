import type { MetadataRoute } from "next";
import { publicUrl } from "@/lib/markets";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: publicUrl("de", "/sitemap.xml"),
    host: publicUrl("de"),
  };
}