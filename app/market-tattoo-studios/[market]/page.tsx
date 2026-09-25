import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { TattooStudioLargestCities } from "@/components/tattoo-studio-largest-cities";
import { marketLanguageAlternates, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import {
  getIndexableTattooStudioCities,
  getTattooStudioCities,
  isTattooStudioMarket,
  TATTOO_STUDIO_MARKETS,
  type TattooStudioMarket,
} from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string }> };

type MarketArtwork = {
  src: string;
  alt: string;
};

type MarketCopy = {
  countryName: string;
  countryWithArticle: string;
  locationPhrase: string;
  adjective: string;
  regionLabel: string;
  directoryBanner: MarketArtwork;
  cityFinderArtwork: MarketArtwork;
};

const MARKET_COPY: Record<TattooStudioMarket, MarketCopy> = {
  at: {
    countryName: "Österreich",
    countryWithArticle: "Österreich",
    locationPhrase: "Österreich",
    adjective: "Österreichische",
    regionLabel: "AT",
    directoryBanner: {
      src: "/tattoo-studios/tattoo-studio-verzeichnis-oesterreich.png",
      alt: "Dich mit Stich Tattoo-Studio-Verzeichnis für Österreich mit Tattoo-Maschine und Standort-Symbolen",
    },
    cityFinderArtwork: {
      src: "/tattoo-studios/tattoo-studios-nach-stadt-oesterreich.png",
      alt: "Österreichkarte mit markierten Tattoo-Studio-Städten Wien, Graz, Linz, Salzburg und Innsbruck",
    },
  },
  ch: {
    countryName: "Schweiz",
    countryWithArticle: "die Schweiz",
    locationPhrase: "der Schweiz",
    adjective: "Schweizer",
    regionLabel: "CH",
    directoryBanner: {
      src: "/tattoo-studios/tattoo-studio-verzeichnis-schweiz.png",
      alt: "Dich mit Stich Tattoo-Studio-Verzeichnis für die Schweiz mit Tattoo-Maschine und Standort-Symbolen",
    },
    cityFinderArtwork: {
      src: "/tattoo-studios/tattoo-studios-nach-stadt-schweiz.png",
      alt: "Schweizkarte mit markierten Tattoo-Studio-Städten Zürich, Genf, Basel, Lausanne und Bern",
    },
  },
};

export function generateStaticParams() {
  return TATTOO_STUDIO_MARKETS.map((market) => ({ market }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market } = await params;
  if (!isTattooStudioMarket(market)) return { robots: { index: false, follow: false } };
  const copy = MARKET_COPY[market];
  return {
    title: `Tattoo-Studio-Guide ${copy.countryName}`,
    description: `Entdecke Tattoo-Studios in ${copy.locationPhrase} mit Adressen, direkten Links und praktischen Tipps für deine Auswahl.`,
    alternates: { canonical: publicUrl(market, "/tattoo-studios"), languages: marketLanguageAlternates("/tattoo-studios") },
    robots: { index: getIndexableTattooStudioCities(market).length > 0, follow: true },
  };
}

export default async function MarketTattooStudioGuidePage({ params }: PageProps) {
  const { market } = await params;
  if (!isTattooStudioMarket(market)) notFound();
  const copy = MARKET_COPY[market];
  const cities = getTattooStudioCities(market);

  return (
    <main className="shell studio-guide-shell">
      <section className="studio-guide-hero">
        <div className="studio-guide-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">Dich mit Stich {copy.countryName} · Studio Guide</span>
          <h1>Tattoo-Studio-Guide für {copy.countryWithArticle}</h1>
          <p>Finde Tattoo-Studios nach Stadt und Stil. Vergleiche Adressen, direkte Links und praktische Tipps für deine Auswahl.</p>
          <div className="button-row">
            <a className="button button-primary" href="#stadtguides">Stadtguides ansehen</a>
            <a className="button button-secondary" href="#guide-prinzipien">Darauf solltest du achten</a>
          </div>
        </div>
        <div className="studio-guide-hero-mark" aria-hidden="true"><span>INK</span><strong>GUIDE</strong><small>{copy.regionLabel} · STÄDTE</small></div>
      </section>

      <figure className="studio-directory-banner">
        <Image
          src={staticAsset(copy.directoryBanner.src)}
          alt={copy.directoryBanner.alt}
          width={1983}
          height={626}
          sizes="(max-width: 1152px) calc(100vw - 32px), 1120px"
          unoptimized
          priority
        />
      </figure>

      <section className="content-section studio-city-finder-feature" aria-labelledby="markt-stadt-finder-heading">
        <div className="studio-city-finder-copy">
          <span className="eyebrow">Tattoo-Studios nach Stadt</span>
          <h2 id="markt-stadt-finder-heading">Finde den passenden Stadtguide</h2>
          <p>Wähle deine Stadt und vergleiche Portfolios, Adressen und Kontaktwege. Die Reihenfolge ist keine Rangliste.</p>
          <a className="button button-primary" href="#stadtguides">Zu den Stadtguides</a>
        </div>
        <figure className="studio-city-finder-art">
          <Image
            src={staticAsset(copy.cityFinderArtwork.src)}
            alt={copy.cityFinderArtwork.alt}
            width={768}
            height={768}
            loading="eager"
            unoptimized
            sizes="(max-width: 900px) calc(100vw - 64px), 480px"
          />
        </figure>
      </section>

      <section className="content-section" id="stadtguides">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">{copy.adjective} Stadtguides</span>
          <h2>Studio-Guides nach Stadt</h2>
          <p>Wähle deine Stadt und entdecke Studios, direkte Links und Tipps für deine Auswahl.</p>
        </div>
        <div className="studio-city-grid">
          {cities.map((city) => (
            <MarketLink className="studio-city-card" targetMarket={market} pathname={`/tattoo-studios/${city.slug}`} key={city.identity}>
              {city.imageUrl ? (
                <span className="studio-city-card-media">
                  <Image src={staticAsset(city.imageUrl)} alt={`Stadtansicht von ${city.cityName}`} width={420} height={280} sizes="(max-width: 640px) 120px, 180px" unoptimized />
                </span>
              ) : null}
              <span className="studio-city-card-copy">
                <span>{city.region}</span>
                <span className="studio-city-card-title"><LocationPinIcon /><strong>{city.cityName}</strong></span>
                <small>{city.publicationStatus === "verified" ? `${city.studios.length} Studios und Tipps zur Auswahl` : "Tipps für deine Studiosuche"}</small>
                <b>{city.publicationStatus === "verified" ? `Studios in ${city.cityName} entdecken` : `Guide für ${city.cityName} öffnen`} →</b>
              </span>
            </MarketLink>
          ))}
        </div>
      </section>

      <TattooStudioLargestCities market={market} />

      <section className="content-section studio-guide-principles" id="guide-prinzipien">
        <div className="section-header"><span className="eyebrow">Deine Studiosuche</span><h2>Darauf solltest du bei der Studiosuche achten</h2></div>
        <div className="studio-principle-grid">
          <article><span>01</span><h3>Portfolio vergleichen</h3><p>Achte auf Arbeiten im gewünschten Stil und schau dir nach Möglichkeit auch abgeheilte Tattoos an.</p></article>
          <article><span>02</span><h3>Persönlich beraten lassen</h3><p>Kläre Motiv, Platzierung, Preisrahmen und Pflegehinweise direkt mit dem Studio.</p></article>
          <article><span>03</span><h3>Hygiene ernst nehmen</h3><p>Ein sauberes Studio, transparente Abläufe und verständliche Nachsorgehinweise sind wichtiger als Rankings.</p></article>
        </div>
      </section>
    </main>
  );
}
