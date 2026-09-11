import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import {
  getTattooStudioCities,
  isTattooStudioMarket,
  TATTOO_STUDIO_MARKETS,
  type TattooStudioMarket,
} from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string }> };

type MarketCopy = {
  countryName: string;
  countryWithArticle: string;
  locationPhrase: string;
  adjective: string;
  regionLabel: string;
};

const MARKET_COPY: Record<TattooStudioMarket, MarketCopy> = {
  at: {
    countryName: "Österreich",
    countryWithArticle: "Österreich",
    locationPhrase: "Österreich",
    adjective: "Österreichische",
    regionLabel: "AT",
  },
  ch: {
    countryName: "Schweiz",
    countryWithArticle: "die Schweiz",
    locationPhrase: "der Schweiz",
    adjective: "Schweizer",
    regionLabel: "CH",
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
    description: `Ausgewählte Tattoo-Studios in ${copy.locationPhrase} mit nachvollziehbaren Primärquellen, Adressen und transparentem Prüfdatum.`,
    alternates: { canonical: publicUrl(market, "/tattoo-studios") },
    robots: { index: false, follow: true },
  };
}

export default async function MarketTattooStudioGuidePage({ params }: PageProps) {
  const { market } = await params;
  if (!isTattooStudioMarket(market)) notFound();
  const copy = MARKET_COPY[market];
  const cities = getTattooStudioCities(market);
  const studioCount = cities.reduce((total, city) => total + city.studios.length, 0);

  return (
    <main className="shell studio-guide-shell">
      <section className="studio-guide-hero">
        <div className="studio-guide-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">Dich mit Stich {copy.countryName} · Studio Guide</span>
          <h1>Tattoo-Studio-Guide für {copy.countryWithArticle}</h1>
          <p>Entdecke sorgfältig recherchierte Studios nach Stadt und Stil – mit offiziellen Quellen, sichtbarem Prüfdatum und ohne gekaufte Ranglisten.</p>
          <div className="button-row">
            <a className="button button-primary" href="#stadtguides">Stadtguides ansehen</a>
            <a className="button button-secondary" href="#guide-prinzipien">Unser Rechercheprinzip</a>
          </div>
        </div>
        <div className="studio-guide-hero-mark" aria-hidden="true"><span>INK</span><strong>GUIDE</strong><small>{copy.regionLabel} · STÄDTE</small></div>
      </section>

      <ul className="studio-guide-stats" aria-label={`Aktueller Umfang des Tattoo-Studio-Guides für ${copy.countryWithArticle}`}>
        <li><strong>{studioCount}</strong><span>strukturierte Studios</span></li>
        <li><strong>{cities.length}</strong><span>redaktionelle Stadtguides</span></li>
        <li><strong>0</strong><span>gekaufte Rangplätze</span></li>
      </ul>

      <section className="content-section" id="stadtguides">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">{copy.adjective} Stadtguides</span>
          <h2>Studio-Guides nach Stadt</h2>
          <p>Jeder Eintrag wird gegen eine offizielle öffentliche Quelle geprüft, bevor er im Guide erscheint.</p>
        </div>
        <div className="studio-city-grid">
          {cities.map((city) => (
            <MarketLink className="studio-city-card" targetMarket={market} pathname={`/tattoo-studios/${city.slug}`} key={city.identity}>
              {city.imageUrl ? (
                <span className="studio-city-card-media">
                  <Image src={staticAsset(city.imageUrl)} alt={`Stadtansicht von ${city.cityName}`} width={420} height={280} sizes="(max-width: 640px) 120px, 180px" />
                </span>
              ) : null}
              <span className="studio-city-card-copy">
                <span>{city.region} · {city.studios.length} Studios</span>
                <span className="studio-city-card-title"><LocationPinIcon /><strong>{city.cityName}</strong></span>
                <small>Redaktioneller Studio-Guide</small>
                <b>Stadtguide öffnen →</b>
              </span>
            </MarketLink>
          ))}
        </div>
      </section>

      <section className="content-section studio-guide-principles" id="guide-prinzipien">
        <div className="section-header"><span className="eyebrow">Unser Standard</span><h2>Nachvollziehbar statt Bewertungsportal</h2></div>
        <div className="studio-principle-grid">
          <article><span>01</span><h3>Primärquellen</h3><p>Website, Adresse und Stilprofil stammen nach Möglichkeit direkt vom Studio.</p></article>
          <article><span>02</span><h3>Keine Rangliste</h3><p>Die Reihenfolge ist keine Qualitätsbewertung und enthält keine erfundenen Sterne.</p></article>
          <article><span>03</span><h3>Prüfdatum sichtbar</h3><p>Jeder Datensatz zeigt, wann die öffentliche Quelle zuletzt redaktionell geprüft wurde.</p></article>
        </div>
      </section>
    </main>
  );
}
