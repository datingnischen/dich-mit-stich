import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";
import { publicUrl, resolveMarketRequest, withTrailingSlash, type MarketCode } from "./lib/markets.ts";

const MARKET_REWRITE_HEADER = "x-dms-market-rewrite";
const MARKET_REWRITE_TOKEN = crypto.randomUUID();
const INTERNAL_MARKET_PATH_PATTERN = /^\/market-(?:preview|robots|sitemap|about|tattoo-singles|tattoo-studios?|tattoo-studio)(?:\/|$)/;
const PREVIEW_HOST_PATTERN = /\.vercel\.app\.?$/i;

function protectPreview(response: NextResponse, request: NextRequest) {
  const headerHostname = request.headers.get("host")?.replace(/:\d+$/, "") || "";
  if (
    PREVIEW_HOST_PATTERN.test(request.nextUrl.hostname)
    || PREVIEW_HOST_PATTERN.test(headerHostname)
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

const NO_SLASH_PREFIXES = ["/_next/", "/app-assets/", "/api/", "/.well-known/"];

// Ersetzt die eingebaute Slash-Umleitung von Next.js (skipTrailingSlashRedirect): Seitenpfade enden
// immer auf "/". Next.js kannte nur den Upstream-Pfad: nginx ruft für dich-mit-stich.at/faq hier /at/faq
// auf, und Besucher landeten auf dich-mit-stich.at/at/faq/ (404). Pfade mit Marktpräfix gehen darum
// absolut auf die öffentliche Landes-URL; Next.js macht Ziele auf fremden Hosts nicht relativ.
function trailingSlashRedirect(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (
    pathname.endsWith("/")
    || withTrailingSlash(pathname) === pathname
    || NO_SLASH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    || INTERNAL_MARKET_PATH_PATTERN.test(pathname)
  ) {
    return null;
  }

  const target = withTrailingSlash(pathname);
  const marketMatch = target.match(/^\/(de|at|ch)(\/.*)$/);
  if (marketMatch) {
    return NextResponse.redirect(`${publicUrl(marketMatch[1] as MarketCode, marketMatch[2])}${search}`, 308);
  }

  // Plain URL statt nextUrl.clone(): NextURL normalisiert den Schrägstrich sonst selbst.
  const destination = new URL(request.nextUrl.href);
  destination.pathname = target;
  return NextResponse.redirect(destination, 308);
}

export function proxy(request: NextRequest) {
  if (
    INTERNAL_MARKET_PATH_PATTERN.test(request.nextUrl.pathname)
    && request.headers.get(MARKET_REWRITE_HEADER) === MARKET_REWRITE_TOKEN
  ) {
    return protectPreview(NextResponse.next(), request);
  }

  const slashRedirect = trailingSlashRedirect(request);
  if (slashRedirect) {
    return protectPreview(slashRedirect, request);
  }

  const resolution = resolveMarketRequest(request.nextUrl.pathname);

  if (resolution.action === "pass") {
    return protectPreview(NextResponse.next(), request);
  }

  if (resolution.action === "not-found") {
    return protectPreview(new NextResponse("Not found", { status: 404 }), request);
  }

  const destination = request.nextUrl.clone();
  destination.pathname = resolution.pathname;

  if (resolution.action === "redirect") {
    return protectPreview(NextResponse.redirect(destination, 308), request);
  }

  if (resolution.action === "placeholder") {
    destination.searchParams.set("requestedPath", resolution.requestedPath);
  }

  if (destination.pathname === request.nextUrl.pathname) {
    return protectPreview(NextResponse.next(), request);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(MARKET_REWRITE_HEADER, MARKET_REWRITE_TOKEN);
  return protectPreview(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|apple-icon.png|app-assets/).*)"],
};
