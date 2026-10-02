import { loadMagazineCategories, loadMagazinePosts, readDataJson } from "./magazine-content.ts";
import type { MagazineCategory, MagazineEntry } from "./magazine-text.ts";
import { SITE_ORIGIN } from "./magazine-urls.ts";

/**
 * WordPress-kompatibler REST-Endpunkt für die Magazin-BEITRÄGE, erzeugt aus den Dateien im Repo.
 *
 * Hintergrund: ICONY (Heiko Grossmann) liest auf den Startseiten der Plattformen immer drei Magazin-Teaser über
 * https://dich-mit-stich.de/cms-mag/wp-json/wp/v2/posts (zusätzlich /magazin/wp-json/…). Das WordPress ist abgelöst,
 * der Endpunkt bleibt: gleiche URL, gleiche Felder (WP-REST-Format).
 *
 * Bewusst NICHT vorhanden: Seiten (Hubs, Motiv-Lexikon, Autorenprofile), Tattoo-Studios, Städte, Autoren
 * (/wp/v2/users, `author` ist nur eine ID, kein `_embedded.author`) und die Mediathek als Liste. Alles Unbekannte
 * antwortet mit 404.
 */

export const PUBLIC_ORIGIN = SITE_ORIGIN;
export const WP_ORIGIN = `${PUBLIC_ORIGIN}/cms-mag`;
const REST_BASE = `${WP_ORIGIN}/wp-json/wp/v2`;
const MEDIA_ID_OFFSET = 1_000_000;

export const WP_REST_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-WP-Nonce, Content-Disposition, Content-MD5, Content-Type",
  "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages, Link",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
  Allow: "GET",
};

export type WpRestResponse = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
};

type Json = Record<string, unknown>;
type ImageSizes = Record<string, { width: number; height: number; bytes?: number }>;
type AuthorRow = { id: number; slug: string };

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;
const NAMESPACE_ROUTES = ["/wp/v2/posts", "/wp/v2/categories", "/wp/v2/tags", "/wp/v2/media"];

function error(status: number, code: string, message: string): WpRestResponse {
  return { status, body: { code, message, data: { status } }, headers: {} };
}

const NO_ROUTE = () => error(404, "rest_no_route", "Es wurde keine Route gefunden, die der URL und der Anfragemethode entspricht.");

// ---------------------------------------------------------------- Quelle

type PostItem = {
  id: number;
  slug: string;
  link: string;
  date: string;
  dateGmt: string;
  modified: string;
  modifiedGmt: string;
  title: string;
  titlePlain: string;
  excerpt: string;
  content: string;
  author: number;
  categories: number[];
  featuredMedia: MediaItem | null;
  haystack: string;
};

type MediaItem = {
  id: number;
  postId: number;
  slug: string;
  sourceUrl: string;
  alt: string;
  title: string;
  date: string;
  dateGmt: string;
  modified: string;
  modifiedGmt: string;
  width: number;
  height: number;
  bytes: number;
  file: string;
  mime: string;
};

export type WpSource = { posts: PostItem[]; media: MediaItem[]; categories: MagazineCategory[] };

const BERLIN = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function berlinParts(instant: number): number {
  const parts = Object.fromEntries(BERLIN.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
}

const isoSeconds = (ms: number) => new Date(ms).toISOString().slice(0, 19);

/** Lokale Zeit (Europe/Berlin, wie WordPress `date`) und UTC (`date_gmt`) aus einem Frontmatter-Wert. */
function localAndGmt(value: string | undefined, fallback = "1970-01-01T00:00:00"): { local: string; gmt: string } {
  const raw = value || fallback;
  if (/Z$|[+-]\d\d:?\d\d$/.test(raw)) {
    const instant = Date.parse(raw);
    return { local: isoSeconds(berlinParts(instant)), gmt: isoSeconds(instant) };
  }
  const asUtc = Date.parse(`${raw.slice(0, 19)}${raw.length === 10 ? "T00:00:00" : ""}Z`);
  const offset = berlinParts(asUtc) - asUtc;
  return { local: isoSeconds(asUtc), gmt: isoSeconds(asUtc - offset) };
}

function readImageSizes(): ImageSizes {
  try {
    return readDataJson<ImageSizes>("magazin-bilder.json");
  } catch {
    return {};
  }
}

const MIME_BY_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function plain(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Relative Links und Dateipfade im Text werden absolut auf die Live-Domain (Asset-Dateien sind es schon). */
function absolutize(html: string): string {
  return html.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attr: string, path: string) => `${attr}="${PUBLIC_ORIGIN}${path}"`);
}

function buildSource(): WpSource {
  const sizes = readImageSizes();
  // Nur Beiträge (content/magazin/beitraege); Hubs, Lexikon und Autorenprofile (seiten) bleiben draußen.
  const entries: MagazineEntry[] = loadMagazinePosts().filter((entry) => entry.type === "post" && entry.id > 0);
  const authorIds = new Map(readDataJson<AuthorRow[]>("magazin-autoren.json").map((author) => [author.slug, author.id]));
  const media: MediaItem[] = [];

  const posts = entries.map((entry): PostItem => {
    const published = localAndGmt(entry.date);
    const updated = localAndGmt(entry.modified || entry.date);
    const title = escapeHtml(entry.title);
    let featured: MediaItem | null = null;
    if (entry.featuredImage) {
      const hostPath = entry.featuredImage.replace(/^https?:\/\/[^/]+(?:\/app-assets)?/, "");
      const size = sizes[hostPath];
      const file = hostPath.replace(/^\/magazin\/wp-content\/uploads\//, "");
      featured = {
        id: MEDIA_ID_OFFSET + entry.id,
        postId: entry.id,
        slug: (file.split("/").pop() || file).replace(/\.[a-z0-9]+$/i, ""),
        sourceUrl: entry.featuredImage,
        alt: entry.featuredImageAlt?.trim() || title,
        title: entry.featuredImageAlt?.trim() || title,
        date: published.local,
        dateGmt: published.gmt,
        modified: updated.local,
        modifiedGmt: updated.gmt,
        width: size?.width ?? 0,
        height: size?.height ?? 0,
        bytes: size?.bytes ?? 0,
        file,
        mime: MIME_BY_EXTENSION[(file.split(".").pop() || "").toLowerCase()] ?? "image/jpeg",
      };
      media.push(featured);
    }
    const excerpt = absolutize(entry.excerpt);
    const content = absolutize(entry.content);
    return {
      id: entry.id,
      slug: entry.slug,
      link: `${PUBLIC_ORIGIN}/magazin/${entry.slug}/`,
      date: published.local,
      dateGmt: published.gmt,
      modified: updated.local,
      modifiedGmt: updated.gmt,
      title,
      titlePlain: plain(title),
      excerpt,
      content,
      author: authorIds.get(entry.authorSlug ?? "") ?? 2,
      categories: entry.categories.map((category) => category.id),
      featuredMedia: featured,
      haystack: `${plain(title)} ${plain(excerpt)} ${plain(content)}`,
    };
  });

  const categories = loadMagazineCategories().map((category) => ({
    ...category,
    count: posts.filter((post) => post.categories.includes(category.id)).length,
  }));
  return { posts, media, categories };
}

let cached: WpSource | null = null;

export function loadWpSource(): WpSource {
  if (cached) return cached;
  const source = buildSource();
  if (process.env.NODE_ENV === "production") cached = source;
  return source;
}

// ---------------------------------------------------------------- Objekte im WordPress-Format

const categoryLink = (category: { slug: string }) => `${PUBLIC_ORIGIN}/magazin/thema/${category.slug}/`;

function mediaObject(media: MediaItem): Json {
  const details: Json = { filesize: media.bytes, file: media.file, sizes: {} };
  if (media.width && media.height) {
    details.width = media.width;
    details.height = media.height;
    details.sizes = {
      full: { file: media.file.split("/").pop(), width: media.width, height: media.height, mime_type: media.mime, source_url: media.sourceUrl },
    };
  }
  return {
    id: media.id,
    date: media.date,
    date_gmt: media.dateGmt,
    guid: { rendered: media.sourceUrl },
    modified: media.modified,
    modified_gmt: media.modifiedGmt,
    slug: media.slug,
    status: "inherit",
    type: "attachment",
    link: media.sourceUrl,
    title: { rendered: media.title },
    author: 2,
    comment_status: "closed",
    ping_status: "closed",
    template: "",
    meta: [],
    description: { rendered: "" },
    caption: { rendered: "" },
    alt_text: media.alt,
    media_type: "image",
    mime_type: media.mime,
    media_details: details,
    post: media.postId,
    source_url: media.sourceUrl,
    _links: {
      self: [{ href: `${REST_BASE}/media/${media.id}` }],
      collection: [{ href: `${REST_BASE}/media` }],
    },
  };
}

function termObject(category: MagazineCategory): Json {
  return { id: category.id, link: categoryLink(category), name: category.name, slug: category.slug, taxonomy: "category" };
}

function categoryObject(category: MagazineCategory & { count: number }): Json {
  return {
    id: category.id,
    count: category.count,
    description: category.description,
    link: categoryLink(category),
    name: category.name,
    slug: category.slug,
    taxonomy: "category",
    parent: 0,
    meta: [],
    _links: {
      self: [{ href: `${REST_BASE}/categories/${category.id}` }],
      collection: [{ href: `${REST_BASE}/categories` }],
      "wp:post_type": [{ href: `${REST_BASE}/posts?categories=${category.id}` }],
    },
  };
}

function postObject(post: PostItem, source: WpSource, embed: Set<string> | null): Json {
  const media = post.featuredMedia;
  const object: Json = {
    id: post.id,
    date: post.date,
    date_gmt: post.dateGmt,
    guid: { rendered: post.link },
    modified: post.modified,
    modified_gmt: post.modifiedGmt,
    slug: post.slug,
    status: "publish",
    type: "post",
    link: post.link,
    title: { rendered: post.title },
    content: { rendered: post.content, protected: false },
    excerpt: { rendered: post.excerpt, protected: false },
    author: post.author,
    featured_media: media ? media.id : 0,
    comment_status: "closed",
    ping_status: "closed",
    sticky: false,
    template: "",
    format: "standard",
    meta: { footnotes: "" },
    categories: post.categories,
    tags: [],
  };

  const links: Json = {
    self: [{ href: `${REST_BASE}/posts/${post.id}` }],
    collection: [{ href: `${REST_BASE}/posts` }],
    about: [{ href: `${REST_BASE}/types/post` }],
  };
  if (media) links["wp:featuredmedia"] = [{ embeddable: true, href: `${REST_BASE}/media/${media.id}` }];
  links["wp:term"] = [
    { taxonomy: "category", embeddable: true, href: `${REST_BASE}/categories?post=${post.id}` },
    { taxonomy: "post_tag", embeddable: true, href: `${REST_BASE}/tags?post=${post.id}` },
  ];
  object._links = links;

  if (embed) {
    const embedded: Json = {};
    if (media && embed.has("wp:featuredmedia")) embedded["wp:featuredmedia"] = [mediaObject(media)];
    if (embed.has("wp:term")) {
      embedded["wp:term"] = [
        post.categories
          .map((id) => source.categories.find((category) => category.id === id))
          .filter((category): category is MagazineCategory & { count: number } => Boolean(category))
          .map(termObject),
        [],
      ];
    }
    if (Object.keys(embedded).length) object._embedded = embedded;
  }
  return object;
}

// ---------------------------------------------------------------- Parameter

function intParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function idList(params: URLSearchParams, key: string): number[] | null {
  const raw = params.getAll(key).flatMap((value) => value.split(","));
  if (!raw.length) return null;
  return raw.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value));
}

function embedSet(params: URLSearchParams): Set<string> | null {
  if (!params.has("_embed")) return null;
  const raw = params.get("_embed") ?? "";
  if (raw === "" || raw === "1" || raw === "true") return new Set(["wp:featuredmedia", "wp:term"]);
  if (raw === "0" || raw === "false") return null;
  return new Set(raw.split(",").map((value) => value.trim()));
}

function fieldPaths(params: URLSearchParams): string[] | null {
  const raw = params.get("_fields");
  if (!raw) return null;
  const paths = raw.split(",").map((value) => value.trim()).filter(Boolean);
  return paths.length ? paths : null;
}

function pickPaths(value: unknown, paths: string[][]): unknown {
  if (!paths.length) return value;
  if (Array.isArray(value)) return value.map((item) => pickPaths(item, paths));
  if (value === null || typeof value !== "object") return value;
  const source = value as Json;
  const out: Json = {};
  const wholeKeys = new Set(paths.filter((path) => path.length === 1).map((path) => path[0]));
  const nested = new Map<string, string[][]>();
  for (const path of paths) {
    if (path.length > 1) nested.set(path[0], [...(nested.get(path[0]) || []), path.slice(1)]);
  }
  for (const key of Object.keys(source)) {
    if (wholeKeys.has(key)) out[key] = source[key];
    else if (nested.has(key)) out[key] = pickPaths(source[key], nested.get(key) || []);
  }
  return out;
}

function applyFields(object: Json, fields: string[] | null): Json {
  if (!fields) return object;
  return pickPaths(object, fields.map((field) => field.split("."))) as Json;
}

const stripZ = (value: string) => value.replace(/Z$/, "");

function queryPosts(posts: PostItem[], params: URLSearchParams) {
  let items = posts.slice();

  const include = idList(params, "include");
  if (include) items = items.filter((post) => include.includes(post.id));
  const exclude = idList(params, "exclude");
  if (exclude) items = items.filter((post) => !exclude.includes(post.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) items = items.filter((post) => slugs.includes(post.slug));
  const authors = idList(params, "author");
  if (authors) items = items.filter((post) => authors.includes(post.author));
  const categories = idList(params, "categories");
  if (categories) items = items.filter((post) => post.categories.some((id) => categories.includes(id)));
  const categoriesExclude = idList(params, "categories_exclude");
  if (categoriesExclude) items = items.filter((post) => !post.categories.some((id) => categoriesExclude.includes(id)));
  if (idList(params, "tags")) items = [];
  const search = params.get("search")?.trim().toLowerCase();
  if (search) items = items.filter((post) => post.haystack.includes(search));
  const after = params.get("after");
  if (after) items = items.filter((post) => post.date > stripZ(after));
  const before = params.get("before");
  if (before) items = items.filter((post) => post.date < stripZ(before));
  const modifiedAfter = params.get("modified_after");
  if (modifiedAfter) items = items.filter((post) => post.modified > stripZ(modifiedAfter));
  const modifiedBefore = params.get("modified_before");
  if (modifiedBefore) items = items.filter((post) => post.modified < stripZ(modifiedBefore));

  const filtered = Boolean(authors || categories);
  const orderby = params.get("orderby") || "date";
  // orderby=include behält die Reihenfolge der include-Liste, unabhängig von order.
  const direction = orderby === "include" || (params.get("order") || "desc").toLowerCase() === "asc" ? 1 : -1;
  const key = (post: PostItem): string | number => {
    switch (orderby) {
      case "modified": return post.modified;
      case "title": return post.titlePlain;
      case "slug": return post.slug;
      case "id": return post.id;
      case "author": return post.author;
      case "include": return include ? include.indexOf(post.id) : 0;
      default: return post.date;
    }
  };
  items.sort((a, b) => {
    const left = key(a);
    const right = key(b);
    const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "de");
    // Wie WordPress: bei gleichem Datum ungefiltert ID absteigend, mit Autor-/Kategorie-Filter ID aufsteigend.
    return order * direction || (filtered ? a.id - b.id : b.id - a.id);
  });

  const total = items.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const offset = params.has("offset")
    ? intParam(params, "offset", 0, 0, Number.MAX_SAFE_INTEGER)
    : (intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER) - 1) * perPage;
  return { items: items.slice(offset, offset + perPage), total, totalPages };
}

function collectionHeaders(route: string, params: URLSearchParams, total: number, totalPages: number): Record<string, string> {
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const headers: Record<string, string> = { "X-WP-Total": String(total), "X-WP-TotalPages": String(totalPages) };
  const link = (target: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(target));
    return `<${WP_ORIGIN}/wp-json/wp/v2/${route}?${next.toString()}>`;
  };
  const parts: string[] = [];
  if (page > 1) parts.push(`${link(page - 1)}; rel="prev"`);
  if (page < totalPages) parts.push(`${link(page + 1)}; rel="next"`);
  if (parts.length) headers.Link = parts.join(", ");
  return headers;
}

function postCollection(params: URLSearchParams, source: WpSource): WpRestResponse {
  const { items, total, totalPages } = queryPosts(source.posts, params);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  if (page > 1 && page > totalPages && !params.has("offset")) {
    return error(400, "rest_post_invalid_page_number", "Die angeforderte Seitennummer ist größer als die Anzahl der verfügbaren Seiten.");
  }
  const embed = embedSet(params);
  const fields = fieldPaths(params);
  return {
    status: 200,
    body: items.map((post) => applyFields(postObject(post, source, embed), fields)),
    headers: collectionHeaders("posts", params, total, totalPages),
  };
}

function categoryCollection(params: URLSearchParams, source: WpSource): WpRestResponse {
  let rows = source.categories.filter((row) => row.count > 0 || params.get("hide_empty") === "false");
  const include = idList(params, "include");
  if (include) rows = rows.filter((row) => include.includes(row.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) rows = rows.filter((row) => slugs.includes(row.slug));
  const post = idList(params, "post");
  if (post) {
    const selected = source.posts.filter((item) => post.includes(item.id));
    rows = rows.filter((row) => selected.some((item) => item.categories.includes(row.id)));
  }
  const orderby = params.get("orderby") || "name";
  const direction = (params.get("order") || "asc").toLowerCase() === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    const order = orderby === "count" ? a.count - b.count : orderby === "id" ? a.id - b.id : orderby === "slug" ? a.slug.localeCompare(b.slug) : a.name.localeCompare(b.name, "de");
    return order * direction;
  });
  const total = rows.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const fields = fieldPaths(params);
  return {
    status: 200,
    body: rows.slice((page - 1) * perPage, page * perPage).map((row) => applyFields(categoryObject(row), fields)),
    headers: collectionHeaders("categories", params, total, totalPages),
  };
}

// ---------------------------------------------------------------- Einstieg

/**
 * @param route  Pfad hinter /wp-json, z. B. "/wp/v2/posts" oder "/wp/v2/posts/3554" (mit oder ohne Slash am Ende)
 * @param params Query-Parameter der Anfrage
 */
export function handleWpRest(route: string, params: URLSearchParams, source: WpSource = loadWpSource()): WpRestResponse {
  const normalized = `/${route.replace(/^\/+|\/+$/g, "")}`;
  const parts = normalized.split("/").filter(Boolean);

  if (normalized === "/") {
    return {
      status: 200,
      body: {
        name: "Dich mit Stich - Magazin",
        description: "",
        url: PUBLIC_ORIGIN,
        home: PUBLIC_ORIGIN,
        namespaces: ["wp/v2"],
        authentication: {},
        routes: Object.fromEntries(NAMESPACE_ROUTES.map((path) => [path, { namespace: "wp/v2", methods: ["GET"] }])),
      },
      headers: {},
    };
  }

  if (parts[0] !== "wp" || parts[1] !== "v2") return NO_ROUTE();
  if (parts.length === 2) return { status: 200, body: { namespace: "wp/v2", routes: NAMESPACE_ROUTES }, headers: {} };

  const resource = parts[2];
  const idPart = parts[3];
  if (parts.length > 4) return NO_ROUTE();

  if (resource === "posts") {
    if (!idPart) return postCollection(params, source);
    const post = /^\d+$/.test(idPart) ? source.posts.find((item) => item.id === Number(idPart)) : undefined;
    if (!post) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(postObject(post, source, embedSet(params)), fieldPaths(params)), headers: {} };
  }

  if (resource === "categories") {
    if (!idPart) return categoryCollection(params, source);
    const row = /^\d+$/.test(idPart) ? source.categories.find((item) => item.id === Number(idPart)) : undefined;
    if (!row) return error(404, "rest_term_invalid", "Begriff existiert nicht.");
    return { status: 200, body: applyFields(categoryObject(row), fieldPaths(params)), headers: {} };
  }

  // Schlagwörter gibt es im Magazin nicht: leere Liste, einzelne IDs 404.
  if (resource === "tags") {
    if (idPart) return error(404, "rest_term_invalid", "Begriff existiert nicht.");
    return { status: 200, body: [], headers: collectionHeaders("tags", params, 0, 0) };
  }

  // Nur Beitragsbilder, keine Liste der Mediathek.
  if (resource === "media" && idPart && /^\d+$/.test(idPart)) {
    const media = source.media.find((item) => item.id === Number(idPart));
    if (!media) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(mediaObject(media), fieldPaths(params)), headers: {} };
  }

  return NO_ROUTE();
}

/** Antwort als Response-Objekt inklusive CORS-, Cache- und WP-Headern. */
export function wpRestResponse(result: WpRestResponse, method = "GET"): Response {
  const headers = new Headers({ ...WP_REST_HEADERS, ...result.headers });
  if (result.status >= 400) headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  const body = method === "HEAD" ? null : JSON.stringify(result.body);
  return new Response(body, { status: result.status, headers });
}

export function wpRestPreflight(): Response {
  const headers = new Headers(WP_REST_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}
