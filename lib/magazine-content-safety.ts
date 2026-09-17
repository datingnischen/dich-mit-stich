const QUARANTINED_MAGAZINE_SLUGS = new Set([
  "anti-tragus-piercing",
  "suprasorb",
]);

export function isMagazineArticleQuarantined(slug: string): boolean {
  return QUARANTINED_MAGAZINE_SLUGS.has(slug);
}

export function getMagazineQuarantineDescription(): string {
  return "Dieser ältere Magazinbeitrag wird fachlich und redaktionell überarbeitet. Bis zum Abschluss veröffentlichen wir die bisherige Langfassung bewusst nicht.";
}
