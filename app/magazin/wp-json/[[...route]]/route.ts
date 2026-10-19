import { handleWpRest, wpRestPreflight, wpRestResponse } from "@/lib/wp-rest-compat";
import { isTeaserImageRoute, teaserImageResponse } from "@/lib/teaser-image";
import { isMarketTeaserCode, loadMarketTeaserSource } from "@/lib/wp-market-teasers";

// WordPress-kompatibler REST-Endpunkt für Magazin-Beiträge (aus den Dateien erzeugt), siehe lib/wp-rest-compat.ts.
// Die URL bleibt wie im früheren WordPress: https://dich-mit-stich.de/cms-mag/wp-json/wp/v2/posts (und /magazin/wp-json/…).
// ?rest_route= und index.php?rest_route= leitet proxy.ts hierher um.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ route?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { route = [] } = await context.params;
  // Teaserbilder für ICONY ohne Dateiendung (lib/teaser-image.ts)
  if (isTeaserImageRoute(route)) return teaserImageResponse(route, request.method);
  const params = new URL(request.url).searchParams;
  // AT/CH-Knoten: proxy.ts schreibt /at|ch/magazin/wp-json/… hierher um und hängt dms_market an (lib/wp-market-teasers.ts).
  const market = params.get("dms_market");
  params.delete("dms_market");
  const result = isMarketTeaserCode(market)
    ? handleWpRest(`/${route.join("/")}`, params, loadMarketTeaserSource(market))
    : handleWpRest(`/${route.join("/")}`, params);
  return wpRestResponse(result, request.method);
}

export const HEAD = GET;

export function OPTIONS() {
  return wpRestPreflight();
}
