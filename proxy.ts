import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";
import { getMarket, MARKET_CODES, resolveMarketRequest } from "./lib/markets.ts";

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

const PUBLIC_MARKET_HOSTS = new Set(MARKET_CODES.map((code) => getMarket(code).domain));

// Ersetzt die eingebaute Slash-Umleitung von Next.js (skipTrailingSlashRedirect): Die sähe nur den
// Upstream-Pfad /at/faq/ und schickte Besucher der Landesdomain auf das nicht existierende /at/faq.
function trailingSlashRedirect(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  if (pathname === "/" || !pathname.endsWith("/")) {
    return null;
  }

  // Plain URL statt nextUrl.clone(): NextURL hängt den ursprünglichen Schrägstrich wieder an.
  const destination = new URL(request.nextUrl.href);
  let target = pathname.replace(/\/+$/, "") || "/";
  if (PUBLIC_MARKET_HOSTS.has(hostname.replace(/\.$/, ""))) {
    target = target.replace(/^\/(?:de|at|ch)(?=\/|$)/, "") || "/";
  }
  destination.pathname = target;
  return NextResponse.redirect(destination, 308);
}

export function proxy(request: NextRequest) {
  const slashRedirect = trailingSlashRedirect(request);
  if (slashRedirect) {
    return protectPreview(slashRedirect, request);
  }

  if (
    INTERNAL_MARKET_PATH_PATTERN.test(request.nextUrl.pathname)
    && request.headers.get(MARKET_REWRITE_HEADER) === MARKET_REWRITE_TOKEN
  ) {
    return protectPreview(NextResponse.next(), request);
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
