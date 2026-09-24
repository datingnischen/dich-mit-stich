import type { MarketCode } from "./markets.ts";
import { getIndexableTattooStudioCities, type TattooStudioCityGuide } from "./tattoo-studio-guide.ts";

/** City centres of all studio guide cities, used to suggest the nearest other guides. */
const CITY_CENTRES: Record<MarketCode, Record<string, [number, number]>> = {
  de: {
    berlin: [52.52, 13.405],
    bochum: [51.482, 7.216],
    bonn: [50.737, 7.098],
    bremen: [53.079, 8.802],
    dortmund: [51.514, 7.468],
    dresden: [51.05, 13.738],
    duisburg: [51.434, 6.762],
    duesseldorf: [51.228, 6.773],
    essen: [51.456, 7.012],
    "frankfurt-am-main": [50.11, 8.682],
    hamburg: [53.551, 9.994],
    hannover: [52.375, 9.732],
    karlsruhe: [49.007, 8.404],
    koeln: [50.938, 6.96],
    leipzig: [51.34, 12.375],
    muenchen: [48.137, 11.575],
    muenster: [51.96, 7.626],
    nuernberg: [49.452, 11.077],
    stuttgart: [48.776, 9.183],
    wuppertal: [51.256, 7.151],
  },
  at: {
    dornbirn: [47.414, 9.742],
    graz: [47.071, 15.439],
    innsbruck: [47.269, 11.404],
    klagenfurt: [46.624, 14.308],
    linz: [48.306, 14.286],
    salzburg: [47.809, 13.055],
    "sankt-poelten": [48.204, 15.626],
    villach: [46.61, 13.855],
    wels: [48.166, 14.027],
    wien: [48.208, 16.373],
    "wiener-neustadt": [47.815, 16.244],
  },
  ch: {
    basel: [47.56, 7.589],
    bern: [46.948, 7.447],
    "biel-bienne": [47.137, 7.247],
    genf: [46.204, 6.143],
    lausanne: [46.52, 6.633],
    lugano: [46.004, 8.951],
    luzern: [47.05, 8.309],
    "st-gallen": [47.424, 9.377],
    winterthur: [47.5, 8.724],
    zuerich: [47.377, 8.542],
  },
};

/** Great-circle distance in kilometres. */
function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function getStudioCityCentre(market: MarketCode, slug: string) {
  return CITY_CENTRES[market][slug] ?? null;
}

/** The nearest other published studio guides of the same market, closest first. */
export function getNearbyStudioCities(market: MarketCode, slug: string, limit = 3): { guide: TattooStudioCityGuide; distanceKm: number }[] {
  const origin = getStudioCityCentre(market, slug);
  if (!origin) return [];
  return getIndexableTattooStudioCities(market)
    .filter((guide) => guide.slug !== slug && CITY_CENTRES[market][guide.slug])
    .map((guide) => ({ guide, distanceKm: Math.round(distanceKm(origin, CITY_CENTRES[market][guide.slug])) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit);
}
