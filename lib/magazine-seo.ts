import type { Metadata } from "next";

// Layout-Template hängt " | Dich mit Stich" an; Google zeigt etwa 60 Zeichen.
const BRAND_SUFFIX = " | Dich mit Stich";
const MAX_TITLE_LENGTH = 60;
// AIOSEO im Magazin-WordPress hängt "| Tattoo-Magazin" (#site_title) an.
const WORDPRESS_TITLE_SUFFIX = /\s*[|–-]\s*Tattoo-Magazin\s*$/i;

export function cleanWordPressSeoTitle(title = "") {
  return title.replace(WORDPRESS_TITLE_SUFFIX, "").replace(/\s+/g, " ").trim();
}

export function magazineMetaTitle(entry: { title: string; seoTitle?: string }): NonNullable<Metadata["title"]> {
  const title = entry.seoTitle || entry.title;
  return title.length + BRAND_SUFFIX.length <= MAX_TITLE_LENGTH ? title : { absolute: title };
}
