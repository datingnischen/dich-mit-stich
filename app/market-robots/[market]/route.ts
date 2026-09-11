import { isMarketCode, publicUrl } from "@/lib/markets";

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

  const allowedPaths = [
    "Allow: /ueber-uns",
    "Allow: /tattoo-singles",
    "Allow: /tattoo-studios",
    "Allow: /tattoo-studio/",
  ];
  const body = [
    "User-agent: *",
    ...allowedPaths,
    "Disallow: /",
    `Sitemap: ${publicUrl(market, "/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
