import chCityInventory from "../data/tattoo-cities-ch.json";
import {
  isChTattooCitySlug,
  type ChTattooCitySlug,
} from "./markets";

export type { ChTattooCitySlug } from "./markets";
export { chTattooCitySlugs, isChTattooCitySlug } from "./markets";

export type ChTattooCityPage = (typeof chCityInventory.cities)[ChTattooCitySlug];

export function getChTattooSinglesOverview() {
  return chCityInventory.overview;
}

export function getChTattooCityPage(slug: string): ChTattooCityPage | null {
  return isChTattooCitySlug(slug) ? chCityInventory.cities[slug] : null;
}
