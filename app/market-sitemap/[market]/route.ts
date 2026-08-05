import { isMarketCode } from "@/lib/markets";

export const dynamic = "force-static";

type RouteProps = {
  params: Promise<{ market: string }>;
};

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function GET(_request: Request, { params }: RouteProps) {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") {
    return new Response("Not found", { status: 404 });
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n';

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
