import type { Metadata } from "next";

// Das Layout-Template hängt " | Dich mit Stich" an. Seobility misst bis 580 px, das sind etwa 60 Zeichen.
export const BRAND_SUFFIX = " | Dich mit Stich";
export const MAX_TITLE_LENGTH = 60;
const BRAND_PATTERN = /dich[\s-]mit[\s-]stich/i;

/**
 * Titel mit Markenzusatz, solange er passt. Enthält der Titel die Marke schon (sonst
 * "Wortwiederholung") oder würde er mit Zusatz zu lang, bleibt er ohne Zusatz.
 */
export function brandedTitle(title: string): NonNullable<Metadata["title"]> {
  if (BRAND_PATTERN.test(title)) return { absolute: title };
  return title.length + BRAND_SUFFIX.length <= MAX_TITLE_LENGTH ? title : { absolute: title };
}
