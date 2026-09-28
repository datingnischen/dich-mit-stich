// Magazin-WordPress liegt seit 2026-09-28 unter /cms-mag/; nginx reicht dort nur rest_route durch, kein /wp-json/.
export const WORDPRESS_REST_BASE = "https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2";

/** Hängt einen REST-Pfad samt Query an eine Basis an – mit /wp-json/- wie mit ?rest_route=-Basis. */
export function joinRestUrl(base, path) {
  const root = base.replace(/\/$/, "");
  const route = `/${path.replace(/^\//, "")}`;
  return root.includes("?rest_route=") ? `${root}${route.replace("?", "&")}` : `${root}${route}`;
}

export function wpRestUrl(path) {
  return joinRestUrl(WORDPRESS_REST_BASE, path);
}
