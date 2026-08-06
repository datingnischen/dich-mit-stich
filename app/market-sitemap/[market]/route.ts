import { chTattooCitySlugs, isMarketCode, publicUrl } from "@/lib/markets";

export const dynamic = "force-static";

type RouteProps = {
  params: Promise<{ market: string }>;
};

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

function xmlUrl(location: string) {
  return `  <url><loc>${location}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") {
    return new Response("Not found", { status: 404 });
  }

  const locations = market === "ch"
    ? [
        publicUrl("ch", "/tattoo-singles"),
        ...chTattooCitySlugs.map((slug) => publicUrl("ch", `/tattoo-singles/${slug}`)),
      ]
    : [];
  const urls = locations.map(xmlUrl).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls ? `\n${urls}\n` : ""}</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
