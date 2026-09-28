import type { Metadata } from "next";
import { brandedTitle } from "./seo-title.ts";

// AIOSEO im Magazin-WordPress hängt "| Tattoo-Magazin" (#site_title) an.
const WORDPRESS_TITLE_SUFFIX = /\s*[|–-]\s*Tattoo-Magazin\s*$/i;

export function cleanWordPressSeoTitle(title = "") {
  return title.replace(WORDPRESS_TITLE_SUFFIX, "").replace(/\s+/g, " ").trim();
}

export function magazineMetaTitle(entry: { title: string; seoTitle?: string }): NonNullable<Metadata["title"]> {
  return brandedTitle(entry.seoTitle || entry.title);
}
