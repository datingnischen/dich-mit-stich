import { handleWpRest, wpRestPreflight, wpRestResponse } from "@/lib/wp-rest-compat";

// WordPress-kompatibler REST-Endpunkt für Magazin-Beiträge (aus den Dateien erzeugt), siehe lib/wp-rest-compat.ts.
// Die URL bleibt wie im früheren WordPress: https://dich-mit-stich.de/cms-mag/wp-json/wp/v2/posts (und /magazin/wp-json/…).
// ?rest_route= und index.php?rest_route= leitet proxy.ts hierher um.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ route?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { route = [] } = await context.params;
  const result = handleWpRest(`/${route.join("/")}`, new URL(request.url).searchParams);
  return wpRestResponse(result, request.method);
}

export const HEAD = GET;

export function OPTIONS() {
  return wpRestPreflight();
}
