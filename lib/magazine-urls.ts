// Seit der Ablösung von WordPress liegen alle Magazin-Uploads im Repo unter public/magazin/wp-content/uploads/
// (Pfad wie früher in WordPress). Inhalte im Repo nennen sie immer mit diesem Pfad; erst beim Laden macht
// lib/magazine-content.ts daraus die absolute Asset-URL (nginx liefert vor den Live-Domains nur Seitenrouten).
export const SITE_ORIGIN = "https://dich-mit-stich.de";
export const PUBLIC_MAGAZINE_URL = `${SITE_ORIGIN}/magazin/`;
export const UPLOADS_PATH = "/magazin/wp-content/uploads/";

// Altbeiträge nennen Bilder mit der früheren WordPress-Adresse (/magazin/ oder /cms-mag/), teils mit Tippfehler-Host.
const TYPO_HOST = /(?:https?:)?\/\/(?:www\.)?dich-mit-stich\.de\.de(?=\/)/gi;
const ABSOLUTE_UPLOADS = /https?:\/\/(?:www\.)?dich-mit-stich\.de\/(?:magazin|cms-mag)\/wp-content\/uploads\//gi;
const RELATIVE_UPLOADS = /(^|[\s"'(,=])\/(?:magazin|cms-mag)\/wp-content\/uploads\//g;
const CMS_PAGE_LINK = /https?:\/\/(?:www\.)?dich-mit-stich\.de\/cms-mag\/(?!wp-)/gi;

/** Bringt Bild- und Beitrags-URLs aus WordPress-Texten auf den Upload-Pfad im Repo bzw. die öffentliche /magazin/-Adresse. */
export function normalizeLegacyUrls(value: string) {
  if (!value.includes("dich-mit-stich") && !value.includes("/wp-content/")) return value;
  return value
    .replace(TYPO_HOST, SITE_ORIGIN)
    .replace(ABSOLUTE_UPLOADS, UPLOADS_PATH)
    .replace(RELATIVE_UPLOADS, `$1${UPLOADS_PATH}`)
    .replace(CMS_PAGE_LINK, PUBLIC_MAGAZINE_URL);
}
