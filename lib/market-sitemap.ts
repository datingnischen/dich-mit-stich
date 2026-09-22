import { ABOUT_PATHS } from "./about-pages.ts";
import { FAQ_PATH } from "./faq.ts";
import { atTattooCitySlugs, chTattooCitySlugs, publicUrl } from "./markets.ts";
import { getIndexableTattooStudioCities, type TattooStudioMarket } from "./tattoo-studio-guide.ts";

const TATTOO_SINGLE_CITY_SLUGS: Record<TattooStudioMarket, readonly string[]> = {
  at: atTattooCitySlugs,
  ch: chTattooCitySlugs,
};

/**
 * Every public URL an AT or CH sitemap should advertise. Studio pages only join
 * once their city guide carries verified studios, so rollout drafts stay out of
 * the index instead of shipping thin pages.
 */
export function marketSitemapLocations(market: TattooStudioMarket): string[] {
  const studioCities = getIndexableTattooStudioCities(market);

  return [
    publicUrl(market, FAQ_PATH),
    ...ABOUT_PATHS.map((path) => publicUrl(market, path)),
    publicUrl(market, "/tattoo-singles"),
    ...TATTOO_SINGLE_CITY_SLUGS[market].map((slug) => publicUrl(market, `/tattoo-singles/${slug}`)),
    ...(studioCities.length > 0 ? [publicUrl(market, "/tattoo-studios")] : []),
    ...studioCities.map((city) => publicUrl(market, `/tattoo-studios/${city.slug}`)),
  ];
}
