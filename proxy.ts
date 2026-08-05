import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveMarketRequest } from "@/lib/markets";

export function proxy(request: NextRequest) {
  const resolution = resolveMarketRequest(request.nextUrl.pathname);

  if (resolution.action === "pass") {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = resolution.pathname;

  if (resolution.action === "redirect") {
    return NextResponse.redirect(destination, 308);
  }

  if (resolution.action === "placeholder") {
    destination.searchParams.set("requestedPath", resolution.requestedPath);
  }

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|app-assets/).*)"],
};
