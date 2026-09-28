import { ABOUT_SLUGS, getAboutPage } from "@/lib/about-pages";
import { FAQ_PATH, faqAnswerText, getFaqSections } from "@/lib/faq";
import { MAGAZINE_HUBS, TATTOO_HUB } from "@/lib/magazine-hubs";
import { isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { getMarketMagazineCatalog } from "@/lib/market-magazine";
import { isAtTattooCitySlug, isChTattooCitySlug, type MarketCode } from "@/lib/markets";
import { shortenExcerpt, type SearchDocument } from "@/lib/site-search";
import { getTattooCityDirectory } from "@/lib/tattoo-singles";
import { getTattooStudioCities } from "@/lib/tattoo-studio-guide";
import { stripHtml, teaserText, type MagazineEntry } from "@/lib/wordpress";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";
import atCities from "../data/tattoo-cities-at.json" with { type: "json" };
import chCities from "../data/tattoo-cities-ch.json" with { type: "json" };

// Seiten aus dem Magazin-WordPress, die öffentlich woanders liegen oder nicht in die Sitemap gehören.
const HIDDEN_MAGAZINE_SLUGS = new Set(["expertenteam", "home", "tattoo-studios"]);
const HUB_SLUGS: ReadonlySet<string> = new Set(MAGAZINE_HUBS.map((hub) => hub.slug));

type CityLink = { slug: string; label: string; region?: string };

function magazineArea(entry: MagazineEntry): SearchDocument["area"] {
  if (entry.type === "post") return "Magazin";
  if (entry.slug === TATTOO_HUB.slug) return "Lexikon";
  return HUB_SLUGS.has(entry.slug) ? "Themenwelt" : "Ratgeber";
}

async function magazineDocuments(market: MarketCode): Promise<SearchDocument[]> {
  try {
    // Gecachte Listenabrufe, dieselben wie auf /magazin/ – kein eigener WordPress-Request pro Suche.
    const { posts, pages } = await getMarketMagazineCatalog(market);
    return [...posts, ...pages]
      .filter((entry) => !HIDDEN_MAGAZINE_SLUGS.has(entry.slug) && !isMagazineArticleQuarantined(entry.slug))
      .map((entry) => ({
        area: magazineArea(entry),
        title: entry.title,
        excerpt: shortenExcerpt(teaserText(entry, 400) || stripHtml(entry.excerpt)),
        keywords: entry.categories.map((category) => category.name).join(" "),
        pathname: `/magazin/${entry.slug}`,
      }));
  } catch (error) {
    console.error("Seitensuche: Magazin nicht verfügbar", error);
    return [];
  }
}

function fallbackCityLinks(market: MarketCode): CityLink[] {
  if (market === "at") return atCities.overview.cityLinks;
  if (market === "ch") return chCities.overview.cityLinks;
  return getTattooCityDirectory().map(({ slug, label }) => ({ slug, label }));
}

function isRoutedCity(market: MarketCode, slug: string) {
  if (market === "at") return isAtTattooCitySlug(slug);
  if (market === "ch") return isChTattooCitySlug(slug);
  return true;
}

const COUNTRY_LABEL: Record<MarketCode, string> = { de: "Deutschland", at: "Österreich", ch: "der Schweiz" };

async function cityDocuments(market: MarketCode): Promise<SearchDocument[]> {
  let links: CityLink[];
  try {
    links = (await getWordPressCityOverview(market)).cityLinks;
    if (links.length === 0) links = fallbackCityLinks(market);
  } catch (error) {
    console.error("Seitensuche: Städteliste nicht verfügbar", error);
    links = fallbackCityLinks(market);
  }

  const snapshot: Record<string, { metaDescription?: string }> =
    market === "at" ? atCities.cities : market === "ch" ? chCities.cities : {};

  return links
    .filter((city) => isRoutedCity(market, city.slug))
    .map((city) => ({
      area: "Stadt" as const,
      title: `Tattoo-Singles in ${city.label}`,
      excerpt: shortenExcerpt(
        snapshot[city.slug]?.metaDescription
          || `Tätowierte und gepiercte Singles in ${city.label}${city.region ? ` (${city.region})` : ""} – Stadtseite mit Szene-Tipps.`,
      ),
      keywords: `${city.label} ${city.region ?? ""} ${COUNTRY_LABEL[market]} Partnersuche Kontakte`,
      pathname: `/tattoo-singles/${city.slug}`,
    }));
}

function studioDocuments(market: MarketCode): SearchDocument[] {
  return getTattooStudioCities(market).flatMap((guide) => [
    {
      area: "Studio-Guide" as const,
      title: `Tattoo-Studios in ${guide.cityName}`,
      excerpt: shortenExcerpt(stripHtml(guide.editorialHtml) || `Redaktioneller Studio-Guide für ${guide.cityName}.`),
      keywords: `${guide.cityName} ${guide.region} ${guide.studios.map((studio) => studio.name).join(" ")}`,
      pathname: `/tattoo-studios/${guide.slug}`,
    },
  ]);
}

function aboutDocuments(market: MarketCode): SearchDocument[] {
  return [null, ...ABOUT_SLUGS].flatMap((slug) => {
    const page = getAboutPage(market, slug);
    if (!page) return [];
    return [{
      area: "Über uns" as const,
      title: page.title,
      excerpt: shortenExcerpt(page.description || page.lead),
      keywords: `${page.lead} ${page.cards.map((card) => `${card.title} ${card.text}`).join(" ")}`,
      pathname: page.path,
    }];
  });
}

function faqDocuments(market: MarketCode): SearchDocument[] {
  return getFaqSections(market).flatMap((section, sectionIndex) =>
    section.items.map((item) => ({
      area: "FAQ" as const,
      title: item.question,
      excerpt: shortenExcerpt(faqAnswerText(item.answer)),
      keywords: section.title,
      pathname: `${FAQ_PATH}#faq-section-${sectionIndex + 1}`,
    })),
  );
}

export async function getSiteSearchDocuments(market: MarketCode): Promise<SearchDocument[]> {
  const [magazine, cities] = await Promise.all([magazineDocuments(market), cityDocuments(market)]);
  return [...cities, ...studioDocuments(market), ...magazine, ...aboutDocuments(market), ...faqDocuments(market)];
}
