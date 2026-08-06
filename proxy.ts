import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveMarketRequest } from "@/lib/markets";

export function proxy(request: NextRequest) {
  const rewriteDestination = request.headers.get("x-dms-rewrite-destination");

  // Next.js runs the proxy again for rewritten requests. Only pass through the exact
  // destination chosen by the first, allowlisted resolution; this header never selects a market.
  if (rewriteDestination === request.nextUrl.pathname) {
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-dms-rewrite-destination", destination.pathname);

  return NextResponse.rewrite(destination, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|app-assets/).*)"],
};
