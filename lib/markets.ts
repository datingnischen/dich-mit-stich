export const MARKET_CODES = ["de", "at", "ch"] as const;

export type MarketCode = (typeof MARKET_CODES)[number];

export const atTattooCitySlugs = [
  "dornbirn",
  "graz",
  "klagenfurt",
  "linz",
  "salzburg",
  "sankt-poelten",
  "villach",
  "wels",
  "wien",
  "wiener-neustadt",
] as const;

export type AtTattooCitySlug = (typeof atTattooCitySlugs)[number];

const atTattooCitySlugSet: ReadonlySet<string> = new Set(atTattooCitySlugs);

export function isAtTattooCitySlug(slug: string): slug is AtTattooCitySlug {
  return atTattooCitySlugSet.has(slug);
}

export const chTattooCitySlugs = [
  "zuerich",
  "winterthur",
  "st-gallen",
  "luzern",
  "lugano",
  "lausanne",
  "genf",
  "biel-bienne",
  "bern",
  "basel",
] as const;

export type ChTattooCitySlug = (typeof chTattooCitySlugs)[number];

const chTattooCitySlugSet: ReadonlySet<string> = new Set(chTattooCitySlugs);

export function isChTattooCitySlug(slug: string): slug is ChTattooCitySlug {
  return chTattooCitySlugSet.has(slug);
}

export type MarketConfig = {
  code: MarketCode;
  countryCode: "DE" | "AT" | "CH";
  countryName: string;
  domain: string;
  locale: "de-DE" | "de-AT" | "de-CH";
  contentEnabled: boolean;
};

const MARKETS: Record<MarketCode, MarketConfig> = {
  de: {
    code: "de",
    countryCode: "DE",
    countryName: "Deutschland",
    domain: "dich-mit-stich.de",
    locale: "de-DE",
    contentEnabled: true,
  },
  at: {
    code: "at",
    countryCode: "AT",
    countryName: "Österreich",
    domain: "dich-mit-stich.at",
    locale: "de-AT",
    contentEnabled: false,
  },
  ch: {
    code: "ch",
    countryCode: "CH",
    countryName: "Schweiz",
    domain: "dich-mit-stich.ch",
    locale: "de-CH",
    contentEnabled: false,
  },
};

export function isMarketCode(value: string): value is MarketCode {
  return MARKET_CODES.includes(value as MarketCode);
}

export function getMarket(code: MarketCode): MarketConfig {
  return MARKETS[code];
}

export function publicUrl(market: MarketCode, pathname = "/"): string {
  const normalizedPath = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `https://${getMarket(market).domain}${normalizedPath}`;
}

export function marketPreviewPath(market: MarketCode, pathname = "/"): string {
  const normalizedPath = pathname === "/" ? "" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `/${market}${normalizedPath}`;
}

type MarketRequestResolution =
  | { action: "pass" }
  | { action: "not-found" }
  | { action: "redirect"; market: "de"; pathname: string }
  | { action: "rewrite"; market: "de"; pathname: string }
  | { action: "market-content"; market: "at" | "ch"; pathname: string }
  | { action: "placeholder"; market: "at" | "ch"; pathname: string; requestedPath: string }
  | { action: "market-robots"; market: "at" | "ch"; pathname: string }
  | { action: "market-sitemap"; market: "at" | "ch"; pathname: string };

const PASS_PATHS = new Set(["/favicon.ico"]);
const PASS_PREFIXES = ["/_next/", "/app-assets/", "/api/"];
const STATIC_FILE_PATTERN = /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|webp|woff2?)$/i;

function shouldPass(pathname: string): boolean {
  return (
    PASS_PATHS.has(pathname) ||
    PASS_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (STATIC_FILE_PATTERN.test(pathname) && !pathname.endsWith("/sitemap.xml") && !pathname.endsWith("/robots.txt"))
  );
}

export function resolveMarketRequest(pathname: string): MarketRequestResolution {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (shouldPass(normalizedPathname)) {
    return { action: "pass" };
  }

  const marketMatch = normalizedPathname.match(/^\/(de|at|ch)(\/.*)?$/);
  if (!marketMatch) {
    return {
      action: "rewrite",
      market: "de",
      pathname: normalizedPathname,
    };
  }

  const market = marketMatch[1] as MarketCode;
  const requestedPath = marketMatch[2] || "/";

  // Rewrite destinations are implementation details and must never become public routes.
  if (/^\/market-(?:preview|robots|sitemap|tattoo-singles)(?:\/|$)/.test(requestedPath)) {
    return { action: "not-found" };
  }

  if (market === "de") {
    return {
      action: "rewrite",
      market,
      pathname: requestedPath,
    };
  }

  if (requestedPath === "/robots.txt") {
    return {
      action: "market-robots",
      market,
      pathname: `/market-robots/${market}`,
    };
  }

  if (requestedPath === "/sitemap.xml") {
    return {
      action: "market-sitemap",
      market,
      pathname: `/market-sitemap/${market}`,
    };
  }

  if (market === "at" || market === "ch") {
    const contentPath = requestedPath.length > 1 ? requestedPath.replace(/\/+$/, "") : requestedPath;

    if (contentPath === "/tattoo-singles") {
      return {
        action: "market-content",
        market,
        pathname: `/market-tattoo-singles/${market}`,
      };
    }

    const cityMatch = contentPath.match(/^\/tattoo-singles\/([^/]+)$/);
    if (cityMatch) {
      if (market === "ch" && isChTattooCitySlug(cityMatch[1])) {
        return {
          action: "market-content",
          market,
          pathname: `/market-tattoo-singles/ch/${cityMatch[1]}`,
        };
      }

      if (market === "at" && isAtTattooCitySlug(cityMatch[1])) {
        return {
          action: "market-content",
          market,
          pathname: `/market-tattoo-singles/at/${cityMatch[1]}`,
        };
      }
    }
  }

  return {
    action: "placeholder",
    market,
    pathname: `/market-preview/${market}`,
    requestedPath,
  };
}
