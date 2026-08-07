import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { getWordPressCityPage, getWordPressCitySlugs } from "@/lib/wordpress-cities";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

export const dynamic = "force-static";

type SupportedMarket = "ch" | "at";

type PageProps = {
  params: Promise<{ market: string; slug: string }>;
};

const MARKET_COPY: Record<SupportedMarket, {
  countryLabel: string;
  countryAdjective: string;
  datingEyebrow: string;
  cityIndexLabel: string;
}> = {
  at: {
    countryLabel: "Österreich",
    countryAdjective: "Österreichischer",
    datingEyebrow: "Dating-Einstieg Österreich",
    cityIndexLabel: "Alle Städte in Österreich",
  },
  ch: {
    countryLabel: "Schweiz",
    countryAdjective: "Schweizer",
    datingEyebrow: "Dating-Einstieg Schweiz",
    cityIndexLabel: "Alle Schweizer Städte",
  },
};

function isSupportedMarket(market: string): market is SupportedMarket {
  return market === "ch" || market === "at";
}

export async function generateStaticParams() {
  const markets: SupportedMarket[] = ["at", "ch"];
  const entries = await Promise.all(markets.map(async (market) =>
    (await getWordPressCitySlugs(market)).map((slug) => ({ market, slug })),
  ));
  return entries.flat();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isSupportedMarket(market)) return { robots: { index: false, follow: false } };
  const city = await getWordPressCityPage(market, slug);
  if (!city) return { robots: { index: false, follow: false } };

  return {
    title: city.title,
    description: city.metaDescription,
    alternates: { canonical: publicUrl(market, `/tattoo-singles/${slug}`) },
  };
}

export default async function MarketTattooSinglesCityPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isSupportedMarket(market)) notFound();
  const city = await getWordPressCityPage(market, slug);
  if (!city) notFound();
  const copy = MARKET_COPY[market];

  return (
    <main className="shell shell-narrow">
      <section className="home-stage city-stage panel-card">
        <div className="home-stage-copy">
          <span className="eyebrow eyebrow-brand">Tattoo-Singles in {city.cityName}</span>
          <h1>{city.h1}</h1>
          <p>{city.metaDescription}</p>
          <ul className="trust-points" aria-label={`Vorteile für Tattoo-Singles in ${city.cityName}`}>
            <li>Schneller Einstieg für Singles aus {city.cityName} und Umgebung</li>
            <li>{copy.countryAdjective} Stadt-Guide für Tattoo-, Piercing- und Alternative-Szene</li>
            <li>Direkter Weg zur kostenlosen Registrierung</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={city.registrationUrl}>Kostenlos registrieren</a>
            <MarketLink className="button button-secondary" targetMarket={market} pathname="/tattoo-singles">
              {copy.cityIndexLabel}
            </MarketLink>
          </div>
        </div>

        <div className="home-stage-visual city-stage-visual" data-city-hero-layout="stacked">
          {city.imageUrl ? (
            <div className="home-stage-picture">
              <Image
                src={staticAsset(city.imageUrl)}
                alt={city.imageAlt}
                width={1000}
                height={667}
                sizes="(max-width: 900px) 100vw, 50vw"
                priority
              />
            </div>
          ) : null}
          <div className="floating-entry-card city-entry-card">
            <span className="eyebrow">{copy.datingEyebrow}</span>
            <h2>{city.heroTitle}</h2>
            <p>Entdecke tätowierte und gepiercte Singles aus {city.cityName} und der Umgebung.</p>
            <a className="button button-primary" href={city.registrationUrl}>Jetzt kostenlos starten</a>
          </div>
        </div>
      </section>

      <MarketHtmlContent className="rich-content" market={market} html={city.contentHtml} />

      <section
        className="content-section"
        aria-label="Bildquelle des Stadtfotos"
        data-image-attribution-version="licensed-v1"
      >
        <p>
          <strong>Bildquelle</strong>: {city.imageAttribution.label}. {" "}
          {city.imageAttribution.sourceUrl ? (
            <a href={city.imageAttribution.sourceUrl} rel="license noreferrer" target="_blank">Originalquelle</a>
          ) : null}
          {city.imageAttribution.licenseLabel && city.imageAttribution.licenseUrl ? (
            <>
              {" · "}
              <a href={city.imageAttribution.licenseUrl} rel="license noreferrer" target="_blank">
                {city.imageAttribution.licenseLabel}
              </a>
            </>
          ) : null}
        </p>
      </section>
    </main>
  );
}
