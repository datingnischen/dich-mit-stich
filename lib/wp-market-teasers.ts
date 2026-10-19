import { readDataJson } from "./magazine-content.ts";
import { publicUrl } from "./markets.ts";
import { teaserImageUrl } from "./teaser-image.ts";
import type { WpSource } from "./wp-rest-compat.ts";

/**
 * AT/CH-Knoten der WordPress-kompatiblen Schnittstelle (https://dich-mit-stich.at|ch/magazin/wp-json/wp/v2/posts).
 *
 * Hintergrund (Heiko, 2026-10-19): Die .at/.ch-Startseiten holten ihre drei Teaser von der .de-Schnittstelle. Die
 * Bilder kamen dann von dich-mit-stich.de, die CSP der ICONY-Startseiten (`img-src 'self'`) blockte sie, und die Links
 * führten ins .de-Magazin. Ein eigenes Magazin je Land gibt es (noch) nicht. Bis dahin liefert der Länderknoten die
 * drei größten Städteseiten des Landes als „Beiträge“: Link, Bild und Text auf der Landesdomain.
 */

type MarketTeaserCode = "at" | "ch";
type CityRow = { slug: string; cityName: string; title: string; metaDescription: string; imageUrl: string; imageAlt?: string };
type CityFile = { cities: Record<string, CityRow> };

// Größte Städte nach Einwohnern; Bildmaße der Dateien in public/cities/<land>/.
const TEASER_CITIES: Record<MarketTeaserCode, { slug: string; width: number; height: number; bytes: number }[]> = {
  at: [
    { slug: "wien", width: 1000, height: 563, bytes: 133573 },
    { slug: "graz", width: 1000, height: 666, bytes: 250793 },
    { slug: "linz", width: 1000, height: 518, bytes: 125782 },
  ],
  ch: [
    { slug: "zuerich", width: 1000, height: 679, bytes: 149910 },
    { slug: "genf", width: 1000, height: 563, bytes: 140624 },
    { slug: "basel", width: 1000, height: 666, bytes: 218332 },
  ],
};

// Feste Datumswerte: Reihenfolge = Einwohnerzahl (neuester „Beitrag“ zuerst).
const DATES = ["2026-10-19T12:00:00", "2026-10-19T11:00:00", "2026-10-19T10:00:00"];
const ID_BASE: Record<MarketTeaserCode, number> = { at: 910_000, ch: 920_000 };
const MEDIA_ID_OFFSET = 1_000_000;

export function isMarketTeaserCode(value: unknown): value is MarketTeaserCode {
  return value === "at" || value === "ch";
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildMarketSource(market: MarketTeaserCode): WpSource {
  const { cities } = readDataJson<CityFile>(`tattoo-cities-${market}.json`);
  const restRoot = publicUrl(market, "/magazin/wp-json");
  const media: WpSource["media"] = [];
  const posts = TEASER_CITIES[market].map((teaser, index): WpSource["posts"][number] => {
    const city = cities[teaser.slug];
    if (!city) throw new Error(`Stadt ${market}/${teaser.slug} fehlt in data/tattoo-cities-${market}.json`);
    const id = ID_BASE[market] + index + 1;
    const title = escapeHtml(city.title);
    const excerpt = `<p>${escapeHtml(city.metaDescription)}</p>\n`;
    const file = city.imageUrl.replace(/^\//, "");
    const featured = {
      id: MEDIA_ID_OFFSET + id,
      postId: id,
      slug: `${market}-${teaser.slug}`,
      sourceUrl: teaserImageUrl(restRoot, city.imageUrl),
      alt: city.imageAlt?.trim() || title,
      title: city.imageAlt?.trim() || title,
      date: DATES[index],
      dateGmt: DATES[index],
      modified: DATES[index],
      modifiedGmt: DATES[index],
      width: teaser.width,
      height: teaser.height,
      bytes: teaser.bytes,
      file,
      mime: "image/jpeg",
    };
    media.push(featured);
    return {
      id,
      slug: teaser.slug,
      link: publicUrl(market, `/tattoo-singles/${teaser.slug}/`),
      date: DATES[index],
      dateGmt: DATES[index],
      modified: DATES[index],
      modifiedGmt: DATES[index],
      title,
      titlePlain: city.title.toLowerCase(),
      excerpt,
      content: excerpt,
      author: 2,
      categories: [],
      featuredMedia: featured,
      haystack: `${city.title} ${city.metaDescription}`.toLowerCase(),
    };
  });
  return { posts, media, categories: [] };
}

const cached = new Map<MarketTeaserCode, WpSource>();

export function loadMarketTeaserSource(market: MarketTeaserCode): WpSource {
  const hit = cached.get(market);
  if (hit) return hit;
  const source = buildMarketSource(market);
  if (process.env.NODE_ENV === "production") cached.set(market, source);
  return source;
}
