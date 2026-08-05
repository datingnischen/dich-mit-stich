import { cache } from "react";

const MAGAZINE_API_BASE = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";

const ROUTE_FIELDS = "id,slug,type,date,modified";
const LIST_FIELDS = "id,slug,type,date,modified,link,title,excerpt,_links,_embedded";

export const WORDPRESS_FETCH_POLICY = {
  routePageSize: 100,
  listPageSize: 25,
  routeFields: ROUTE_FIELDS,
  listFields: LIST_FIELDS,
  maxAttempts: 3,
  timeoutMs: 15_000,
  routeRevalidate: 3_600,
  listRevalidate: 900,
  detailRevalidate: 3_600,
  categoryRevalidate: 1_800,
} as const;

export type WpRendered = {
  rendered?: string;
};

type WpMedia = {
  source_url?: string;
  alt_text?: string;
};

type WpAuthor = {
  name?: string;
  slug?: string;
  link?: string;
};

type WpTerm = {
  id: number;
  name: string;
  slug: string;
  taxonomy?: string;
  link?: string;
  description?: string;
};

type WpRestItem = {
  id: number;
  slug: string;
  type: "post" | "page";
  date?: string;
  modified?: string;
  link?: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  _embedded?: {
    author?: WpAuthor[];
    "wp:featuredmedia"?: WpMedia[];
    "wp:term"?: WpTerm[][];
  };
};

type WpCategory = {
  id: number;
  count?: number;
  name: string;
  slug: string;
  link?: string;
  description?: string;
};

type WpUser = {
  id: number;
  slug: string;
};

type WpCacheConfig = {
  revalidate: number;
  tags: string[];
};

type FetchWithRetryOptions = {
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  delayMs?: number;
  timeoutMs?: number;
};

export type MagazineCategory = {
  id: number;
  name: string;
  slug: string;
  link?: string;
  description: string;
  count: number;
};

export type MagazineEntry = {
  id: number;
  slug: string;
  type: "post" | "page";
  date?: string;
  modified?: string;
  link?: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  authorName?: string;
  authorSlug?: string;
  categories: MagazineCategory[];
};

export type MagazineRouteEntry = Pick<MagazineEntry, "id" | "slug" | "type" | "date" | "modified">;

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit = {},
  options: FetchWithRetryOptions = {},
) {
  const fetchImpl = options.fetchImpl || fetch;
  const maxAttempts = options.maxAttempts || WORDPRESS_FETCH_POLICY.maxAttempts;
  const delayMs = options.delayMs ?? 250;
  const timeoutMs = options.timeoutMs || WORDPRESS_FETCH_POLICY.timeoutMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxAttempts) {
        return response;
      }

      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
    }

    if (delayMs > 0) {
      await wait(delayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("WordPress request failed after all retry attempts");
}

export async function collectPaginated<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; totalPages: number }>,
) {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const { items, totalPages } = await fetchPage(page);
    results.push(...items);

    if (items.length === 0 || page >= Math.max(1, totalPages)) break;
    page += 1;
  }

  return results;
}

function decodeNamedEntities(text: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    hellip: "…",
    auml: "ä",
    ouml: "ö",
    uuml: "ü",
    Auml: "Ä",
    Ouml: "Ö",
    Uuml: "Ü",
    szlig: "ß",
    eacute: "é",
    agrave: "à",
    ecirc: "ê",
    copy: "©",
    reg: "®",
    trade: "™",
  };

  return text.replace(/&([a-zA-Z]+);/g, (_, name: string) => entities[name] ?? `&${name};`);
}

export function decodeHtmlEntities(text = "") {
  return decodeNamedEntities(text)
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([\da-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

export function stripHtml(text = "") {
  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatGermanDate(dateString?: string) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString.slice(0, 10);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeCategory(term: WpTerm): MagazineCategory {
  return {
    id: term.id,
    name: decodeHtmlEntities(term.name || ""),
    slug: term.slug,
    link: term.link,
    description: decodeHtmlEntities(term.description || ""),
    count: 0,
  };
}

function sanitizeMediaUrl(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/");
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractFirstImageFromHtml(html = "") {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return sanitizeMediaUrl(match?.[1]);
}

function normalizeEntry(item: WpRestItem): MagazineEntry {
  const featured = item._embedded?.["wp:featuredmedia"]?.[0];
  const author = item._embedded?.author?.[0];
  const categoryTerms = (item._embedded?.["wp:term"] || [])
    .flat()
    .filter((term) => term?.taxonomy === "category")
    .map(normalizeCategory);
  const content = item.content?.rendered || "";
  const excerpt = item.excerpt?.rendered || "";
  const featuredImage = sanitizeMediaUrl(featured?.source_url) || extractFirstImageFromHtml(content);

  return {
    id: item.id,
    slug: item.slug,
    type: item.type,
    date: item.date,
    modified: item.modified,
    link: item.link,
    title: decodeHtmlEntities(item.title?.rendered || ""),
    excerpt,
    content,
    featuredImage,
    featuredImageAlt: featured?.alt_text ? decodeHtmlEntities(featured.alt_text) : undefined,
    authorName: author?.name ? decodeHtmlEntities(author.name) : undefined,
    authorSlug: author?.slug,
    categories: categoryTerms,
  };
}

async function fetchWp<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  cacheConfig: WpCacheConfig,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }

  const response = await fetchWithRetry(`${MAGAZINE_API_BASE}${path}?${search.toString()}`, {
    headers: {
      "User-Agent": "Dich-mit-Stich Next.js magazine",
    },
    next: cacheConfig,
  } as RequestInit & { next: WpCacheConfig });

  if (!response.ok) {
    throw new Error(`WordPress request failed for ${path}: ${response.status} ${response.statusText}`);
  }

  return response as Response & { json(): Promise<T> };
}

async function fetchAllPaginated<T>(
  path: string,
  baseParams: Record<string, string | number | boolean>,
  options: { pageSize: number; cacheConfig: WpCacheConfig },
) {
  return collectPaginated<T>(async (page) => {
    const response = await fetchWp<T[]>(
      path,
      { ...baseParams, per_page: options.pageSize, page },
      options.cacheConfig,
    );
    const items = await response.json();
    const totalPages = Number(response.headers.get("X-WP-TotalPages") || page);
    return { items, totalPages };
  });
}

const routeCache = (type: "posts" | "pages"): WpCacheConfig => ({
  revalidate: WORDPRESS_FETCH_POLICY.routeRevalidate,
  tags: ["wordpress:routes", `wordpress:${type}`],
});

const listCache = (type: "posts" | "pages"): WpCacheConfig => ({
  revalidate: WORDPRESS_FETCH_POLICY.listRevalidate,
  tags: ["wordpress:lists", `wordpress:${type}`],
});

export const getMagazineCategories = cache(async (): Promise<MagazineCategory[]> => {
  const response = await fetchAllPaginated<WpCategory>(
    "/categories",
    {
      _fields: "id,count,name,slug,link,description",
      orderby: "count",
      order: "desc",
      hide_empty: true,
    },
    {
      pageSize: WORDPRESS_FETCH_POLICY.routePageSize,
      cacheConfig: {
        revalidate: WORDPRESS_FETCH_POLICY.categoryRevalidate,
        tags: ["wordpress:categories"],
      },
    },
  );

  return response
    .map((category) => ({
      id: category.id,
      name: decodeHtmlEntities(category.name),
      slug: category.slug,
      link: category.link,
      description: decodeHtmlEntities(category.description || ""),
      count: category.count || 0,
    }))
    .sort((a, b) => b.count - a.count);
});

export const getMagazinePosts = cache(async (): Promise<MagazineEntry[]> => {
  const posts = await fetchAllPaginated<WpRestItem>(
    "/posts",
    {
      _embed: 1,
      _fields: WORDPRESS_FETCH_POLICY.listFields,
      orderby: "date",
      order: "desc",
    },
    { pageSize: WORDPRESS_FETCH_POLICY.listPageSize, cacheConfig: listCache("posts") },
  );

  return posts.map(normalizeEntry);
});

export const getMagazinePages = cache(async (): Promise<MagazineEntry[]> => {
  const pages = await fetchAllPaginated<WpRestItem>(
    "/pages",
    {
      _embed: 1,
      _fields: WORDPRESS_FETCH_POLICY.listFields,
      orderby: "title",
      order: "asc",
    },
    { pageSize: WORDPRESS_FETCH_POLICY.listPageSize, cacheConfig: listCache("pages") },
  );

  return pages.map(normalizeEntry);
});

export const getMagazineRouteEntries = cache(async (): Promise<MagazineRouteEntry[]> => {
  const [posts, pages] = await Promise.all([
    fetchAllPaginated<WpRestItem>(
      "/posts",
      { _fields: WORDPRESS_FETCH_POLICY.routeFields, orderby: "date", order: "desc" },
      { pageSize: WORDPRESS_FETCH_POLICY.routePageSize, cacheConfig: routeCache("posts") },
    ),
    fetchAllPaginated<WpRestItem>(
      "/pages",
      { _fields: WORDPRESS_FETCH_POLICY.routeFields, orderby: "title", order: "asc" },
      { pageSize: WORDPRESS_FETCH_POLICY.routePageSize, cacheConfig: routeCache("pages") },
    ),
  ]);

  return [...posts, ...pages].map(({ id, slug, type, date, modified }) => ({ id, slug, type, date, modified }));
});

export const getAllMagazineEntries = getMagazineRouteEntries;

export const getMagazineEntryBySlug = cache(async (slug: string): Promise<MagazineEntry | null> => {
  const cacheConfig: WpCacheConfig = {
    revalidate: WORDPRESS_FETCH_POLICY.detailRevalidate,
    tags: ["wordpress:entries", `wordpress:entry:${slug}`],
  };
  const detailParams = { slug, _embed: 1 };
  const postResponse = await fetchWp<WpRestItem[]>("/posts", detailParams, cacheConfig);
  const posts = await postResponse.json();
  if (posts[0]) return normalizeEntry(posts[0]);

  const pageResponse = await fetchWp<WpRestItem[]>("/pages", detailParams, cacheConfig);
  const pages = await pageResponse.json();
  if (pages[0]) return normalizeEntry(pages[0]);

  return null;
});

export const getMagazineCategoryBySlug = cache(async (slug: string): Promise<MagazineCategory | null> => {
  const response = await fetchWp<WpCategory[]>(
    "/categories",
    { slug, _fields: "id,count,name,slug,link,description" },
    {
      revalidate: WORDPRESS_FETCH_POLICY.categoryRevalidate,
      tags: ["wordpress:categories", `wordpress:category:${slug}`],
    },
  );
  const categories = await response.json();
  const category = categories[0];
  if (!category) return null;

  return {
    id: category.id,
    name: decodeHtmlEntities(category.name),
    slug: category.slug,
    link: category.link,
    description: decodeHtmlEntities(category.description || ""),
    count: category.count || 0,
  };
});

export const getMagazineAuthorPostCount = cache(async (slug: string): Promise<number> => {
  const cacheConfig: WpCacheConfig = {
    revalidate: WORDPRESS_FETCH_POLICY.categoryRevalidate,
    tags: ["wordpress:authors", `wordpress:author:${slug}`],
  };
  const userResponse = await fetchWp<WpUser[]>(
    "/users",
    { slug, _fields: "id,slug" },
    cacheConfig,
  );
  const users = await userResponse.json();
  if (!users[0]) return 0;

  const postsResponse = await fetchWp<WpRestItem[]>(
    "/posts",
    { author: users[0].id, per_page: 1, _fields: "id" },
    cacheConfig,
  );
  return Number(postsResponse.headers.get("X-WP-Total") || 0);
});

export const getMagazineEntriesForCategory = cache(async (slug: string): Promise<MagazineEntry[]> => {
  const category = await getMagazineCategoryBySlug(slug);
  if (!category) return [];

  const response = await fetchAllPaginated<WpRestItem>(
    "/posts",
    {
      _embed: 1,
      _fields: WORDPRESS_FETCH_POLICY.listFields,
      categories: category.id,
      orderby: "date",
      order: "desc",
    },
    {
      pageSize: WORDPRESS_FETCH_POLICY.listPageSize,
      cacheConfig: {
        revalidate: WORDPRESS_FETCH_POLICY.listRevalidate,
        tags: ["wordpress:lists", "wordpress:posts", `wordpress:category:${slug}`],
      },
    },
  );

  return response.map(normalizeEntry);
});
