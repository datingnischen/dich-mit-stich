import type { NextRequest } from "next/server.js";
import { NextResponse } from "next/server.js";
import { resolveMarketRequest } from "./lib/markets.ts";

const MARKET_REWRITE_HEADER = "x-dms-market-rewrite";
const MARKET_REWRITE_TOKEN = crypto.randomUUID();
const INTERNAL_MARKET_PATH_PATTERN = /^\/market-(?:preview|robots|sitemap|about|tattoo-singles|tattoo-studios?|tattoo-studio)(?:\/|$)/;

export function proxy(request: NextRequest) {
  if (
    INTERNAL_MARKET_PATH_PATTERN.test(request.nextUrl.pathname)
    && request.headers.get(MARKET_REWRITE_HEADER) === MARKET_REWRITE_TOKEN
  ) {
    return NextResponse.next();
  }

  const resolution = resolveMarketRequest(request.nextUrl.pathname);

  if (resolution.action === "pass") {
    return NextResponse.next();
  }

  if (resolution.action === "not-found") {
    return new NextResponse("Not found", { status: 404 });
  }

  const destination = request.nextUrl.clone();
  destination.pathname = resolution.pathname;

  if (resolution.action === "redirect") {
    return NextResponse.redirect(destination, 308);
  }

  if (resolution.action === "placeholder") {
    destination.searchParams.set("requestedPath", resolution.requestedPath);
  }

  if (destination.pathname === request.nextUrl.pathname) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(MARKET_REWRITE_HEADER, MARKET_REWRITE_TOKEN);
  return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|app-assets/).*)"],
};
