import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { TattooStudioLargestCities } from "@/components/tattoo-studio-largest-cities";
import { marketLanguageAlternates, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getTattooCityDirectory } from "@/lib/tattoo-singles";
import { getLargestTattooStudioCities, getTattooStudioCities } from "@/lib/tattoo-studio-guide";

export const metadata: Metadata = {
  title: "Tattoo-Studio-Guide für Deutschland",
  description: "Entdecke Tattoo-Studio-Stadtguides mit Tipps zu Stil, Portfolio, Beratung und Hygiene – übersichtlich nach Städten und ohne gekaufte Ranglisten.",
  alternates: { canonical: publicUrl("de", "/tattoo-studios"), languages: marketLanguageAlternates("/tattoo-studios") },
};

export default function TattooStudioGuidePage() {
  const cities = getTattooStudioCities("de");
  const largestCities = getLargestTattooStudioCities("de");
  const atGuideCount = getTattooStudioCities("at").length;
  const chGuideCount = getTattooStudioCities("ch").length;
  const guideCities = cities;
  const largestCitySlugs = new Set(largestCities.map((city) => city.slug));
  const guideCitySlugs = new Set(cities.map((city) => city.slug));
  const additionalTattooCities = getTattooCityDirectory().filter(
    (city) => !largestCitySlugs.has(city.slug) && !guideCitySlugs.has(city.slug),
  );
  return (
    <SiteFrame market="de" sectionLive aid="location">
      <main className="shell studio-guide-shell">
        <section className="studio-guide-hero">
          <div className="studio-guide-hero-copy">
            <span className="eyebrow studio-guide-eyebrow">Dich mit Stich · Studio Guide</span>
            <h1>Tattoo-Studio-Guide für Deutschland</h1>
            <p>
              Finde Tattoo-Studios in deiner Stadt und entdecke, worauf es bei Stil, Portfolio, Hygiene und Beratung
              ankommt. Unsere Stadtguides helfen dir bei der Auswahl, ohne Studios gegen Bezahlung hervorzuheben.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/tattoo-studios/berlin">Studios in Berlin entdecken</Link>
              <MarketLink className="button button-secondary" targetMarket="at" pathname="/tattoo-studios">Tattoo-Studios Österreich</MarketLink>
              <MarketLink className="button button-secondary" targetMarket="ch" pathname="/tattoo-studios">Tattoo-Studios Schweiz</MarketLink>
              <a className="button button-secondary" href="#guide-prinzipien">Darauf solltest du achten</a>
            </div>
          </div>
          <div className="studio-guide-hero-mark" aria-hidden="true">
            <span>INK</span>
            <strong>GUIDE</strong>
            <small>DE · AT · CH</small>
          </div>
        </section>

        <figure className="studio-directory-banner">
          <Image
            src={staticAsset("/tattoo-studios/tattoo-studio-verzeichnis-deutschland.png")}
            alt="Dich mit Stich Tattoo-Studio-Verzeichnis für Deutschland mit Tattoo-Maschine und Standort-Symbolen"
            width={1983}
            height={626}
            sizes="(max-width: 1152px) calc(100vw - 32px), 1120px"
            unoptimized
            priority
          />
        </figure>

        <nav className="content-section studio-guide-country-strip" aria-label="Tattoo-Studio-Guides nach Land">
          <MarketLink className="studio-guide-country-link" targetMarket="de" pathname="/tattoo-studios"><strong>Deutschland</strong><span>{cities.length} Stadtguides</span></MarketLink>
          <MarketLink className="studio-guide-country-link" targetMarket="at" pathname="/tattoo-studios"><strong>Österreich</strong><span>{atGuideCount} Stadtguides</span></MarketLink>
          <MarketLink className="studio-guide-country-link" targetMarket="ch" pathname="/tattoo-studios"><strong>Schweiz</strong><span>{chGuideCount} Stadtguides</span></MarketLink>
        </nav>

        <section className="content-section studio-city-finder-feature" aria-labelledby="stadt-finder-heading">
          <div className="studio-city-finder-copy">
            <span className="eyebrow">Tattoo-Studios nach Stadt</span>
            <h2 id="stadt-finder-heading">Finde den passenden Stadtguide</h2>
            <p>Wähle deine Stadt und entdecke hilfreiche Tipps für deine Studiosuche. Vergleiche Stil, Portfolio und Kontaktmöglichkeiten, bevor du einen Termin vereinbarst.</p>
            <a className="button button-primary" href="#stadtguides">Zu den Stadtguides</a>
          </div>
          <figure className="studio-city-finder-art">
            <Image
              src={staticAsset("/tattoo-studios/tattoo-studios-nach-stadt-deutschland.png")}
              alt="Deutschlandkarte mit markierten Tattoo-Studio-Städten Hamburg, Berlin, Köln, Frankfurt und München"
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
            <span className="eyebrow">Stadtguides</span>
            <h2>Tattoo-Studio-Guides nach Stadt</h2>
            <p>Wähle deinen Stadtguide und finde Tipps für deine Studiosuche vor Ort. Einige Guides enthalten außerdem konkrete Studios mit direkten Links zu ihren Webseiten.</p>
            <p>Vor einem Termin solltest du Portfolio, Stil, Hygiene, Beratung, aktuelle Kontaktdaten und Verfügbarkeit immer direkt beim jeweiligen Studio prüfen.</p>
          </div>
          <div className="studio-city-grid">
            {guideCities.map((city) => (
              <Link className="studio-city-card" href={`/tattoo-studios/${city.slug}`} key={city.identity}>
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
              </Link>
            ))}
          </div>
          <div className="studio-guide-overview-copy">
            <h3>So nutzt du die Tattoo-Studio-Übersicht</h3>
            <ul>
              <li>Vergleiche nicht nur die Entfernung, sondern vor allem Stil, Portfolio und abgeheilte Arbeiten.</li>
              <li>Frage vorab nach Beratung, Motivgröße, Platzierung, Preisrahmen und Pflegehinweisen.</li>
              <li>Nutze die verlinkten Studio-Webseiten als Ausgangspunkt und prüfe aktuelle Angaben direkt beim Anbieter.</li>
            </ul>
            <p>Wenn du außerdem tätowierte Singles kennenlernen möchtest, findest du passende regionale Datingseiten bei den <Link href="/tattoo-singles">Tattoo-Singles</Link>.</p>
          </div>
        </section>

        <TattooStudioLargestCities market="de" />

        <section className="content-section studio-all-cities-section" aria-labelledby="additional-tattoo-cities-heading">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Weitere Tattoo-Städte</span>
            <h2 id="additional-tattoo-cities-heading">Weitere Tattoo-Stadtseiten in Deutschland</h2>
            <p>Entdecke weitere Städte mit lokalen Tipps rund um Tattoos, Dating und die Szene vor Ort.</p>
          </div>
          <div className="studio-all-city-grid">
            {additionalTattooCities.map((city) => (
              <Link className="studio-all-city-card" href={`/tattoo-singles/${city.slug}`} key={city.slug}>
                <span className="studio-all-city-media">
                  <Image src={staticAsset(city.imageUrl)} alt={`Stadtansicht von ${city.label}`} width={220} height={150} sizes="(max-width: 640px) 112px, 150px" unoptimized />
                </span>
                <span className="studio-all-city-copy">
                  <LocationPinIcon />
                  <span><strong>{city.label}</strong><small>Tattoo-Stadtseite öffnen</small></span>
                </span>
              </Link>
            ))}
          </div>
          <details className="city-preview-sources">
            <summary>Bildquellen der weiteren Stadtmotive</summary>
            <ul>
              {additionalTattooCities.map((city) => (
                <li key={city.slug}>
                  <strong>{city.label}:</strong>{" "}
                  <a href={city.imageAttribution.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {city.imageAttribution.title}
                  </a>{" "}
                  von {city.imageAttribution.creator}, {city.imageAttribution.license}
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="content-section studio-guide-principles" id="guide-prinzipien">
          <div className="section-header">
            <span className="eyebrow">Deine Studiosuche</span>
            <h2>Darauf solltest du bei der Studiosuche achten</h2>
          </div>
          <div className="studio-principle-grid">
            <article><span>01</span><h3>Portfolio vergleichen</h3><p>Achte auf Arbeiten im gewünschten Stil und schau dir nach Möglichkeit auch abgeheilte Tattoos an.</p></article>
            <article><span>02</span><h3>Persönlich beraten lassen</h3><p>Kläre Motiv, Platzierung, Preisrahmen und Pflegehinweise direkt mit dem Studio.</p></article>
            <article><span>03</span><h3>Hygiene ernst nehmen</h3><p>Ein sauberes Studio, transparente Abläufe und verständliche Nachsorgehinweise sind wichtiger als Rankings.</p></article>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
