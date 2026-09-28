// Seit 2026-09-28 liegt das Magazin-WordPress unter /cms-mag/; /magazin/ liefert nginx an Vercel aus.
export const WORDPRESS_ORIGIN = "https://dich-mit-stich.de";
export const WORDPRESS_BASE_URL = `${WORDPRESS_ORIGIN}/cms-mag`;
export const WORDPRESS_UPLOADS_URL = `${WORDPRESS_BASE_URL}/wp-content/uploads/`;
export const PUBLIC_MAGAZINE_URL = `${WORDPRESS_ORIGIN}/magazin/`;

// nginx reicht unter /cms-mag/ keine Pretty-Permalinks durch, rest_route funktioniert immer.
export function wordpressRestUrl(route: string, search: URLSearchParams | string = "") {
  const query = String(search);
  return `${WORDPRESS_BASE_URL}/?rest_route=/wp/v2${route}${query ? `&${query}` : ""}`;
}

export function wordpressAuthorArchiveUrl(slug: string) {
  return `${WORDPRESS_BASE_URL}/?author_name=${encodeURIComponent(slug)}`;
}

// WordPress kennt nach dem Umzug die Site-URL www.dich-mit-stich.de.de/cms-mag; alte Beiträge enthalten fest /magazin/wp-content/.
const TYPO_HOST = /(?:https?:)?\/\/(?:www\.)?dich-mit-stich\.de\.de(?=\/)/gi;
const ABSOLUTE_UPLOADS = /https?:\/\/(?:www\.)?dich-mit-stich\.de\/(?:magazin|cms-mag)\/wp-content\/uploads\//gi;
const RELATIVE_UPLOADS = /(^|[\s"'(,=])\/(?:magazin|cms-mag)\/wp-content\/uploads\//g;
const CMS_PAGE_LINK = /https?:\/\/(?:www\.)?dich-mit-stich\.de\/cms-mag\/(?!wp-)/gi;

/** Bringt Bild- und Beitrags-URLs aus WordPress auf den Upload-Pfad unter /cms-mag/ bzw. die öffentliche /magazin/-Adresse. */
export function normalizeWordPressUrls(value: string) {
  if (!value.includes("dich-mit-stich") && !value.includes("/wp-content/")) return value;
  return value
    .replace(TYPO_HOST, WORDPRESS_ORIGIN)
    .replace(ABSOLUTE_UPLOADS, WORDPRESS_UPLOADS_URL)
    .replace(RELATIVE_UPLOADS, `$1${WORDPRESS_UPLOADS_URL}`)
    .replace(CMS_PAGE_LINK, PUBLIC_MAGAZINE_URL);
}

/** Wendet normalizeWordPressUrls auf jeden String einer REST-Antwort an. */
export function normalizeWordPressPayload<T>(value: T): T {
  if (typeof value === "string") return normalizeWordPressUrls(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeWordPressPayload(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeWordPressPayload(item)]),
    ) as T;
  }
  return value;
}
