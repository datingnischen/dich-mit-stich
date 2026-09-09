import { GET as getMarketSitemap } from "@/app/market-sitemap/[market]/route";

export const dynamic = "force-static";

type RouteProps = {
  params: Promise<{ market: string }>;
};

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export function GET(request: Request, context: RouteProps) {
  return getMarketSitemap(request, context);
}
