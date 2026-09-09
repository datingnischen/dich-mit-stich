import { GET as getMarketSitemap } from "@/app/market-sitemap/[market]/route";

export const dynamic = "force-static";

export function GET(request: Request) {
  return getMarketSitemap(request, { params: Promise.resolve({ market: "at" }) });
}
