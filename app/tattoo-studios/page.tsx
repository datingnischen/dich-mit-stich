import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { TattooStudioLargestCities } from "@/components/tattoo-studio-largest-cities";
import { publicUrl } from "@/lib/markets";
import { getTattooCityDirectory } from "@/lib/tattoo-singles";
import { getLargestTattooStudioCities, getTattooStudioCities } from "@/lib/tattoo-studio-guide";

export const metadata: Metadata = {
  title: "Tattoo-Studio-Guide für Deutschland",
  description: "Entdecke Tattoo-Studio-Stadtguides mit Auswahlhilfen, sichtbaren Quellen und klar gekennzeichnetem Prüfstatus – ohne gekaufte Ranglisten.",
  alternates: { canonical: publicUrl("de", "/tattoo-studios") },
};

export default function TattooStudioGuidePage() {
  const cities = getTattooStudioCities("de");
  const largestCities = getLargestTattooStudioCities("de");
  const guideCities = cities;
  const largestCitySlugs = new Set(largestCities.map((city) => city.slug));
  const guideCitySlugs = new Set(cities.map((city) => city.slug));
  const additionalTattooCities = getTattooCityDirectory().filter(
    (city) => !largestCitySlugs.has(city.slug) && !guideCitySlugs.has(city.slug),
  );
  const studioCount = cities.reduce((total, city) => total + city.studios.length, 0);

  return (
    <SiteFrame market="de" sectionLive aid="location">
      <main className="shell studio-guide-shell">
        <section className="studio-guide-hero">
          <div className="studio-guide-hero-copy">
            <span className="eyebrow studio-guide-eyebrow">Dich mit Stich · Studio Guide</span>
            <h1>Tattoo-Studio-Guide für Deutschland</h1>
            <p>
              Finde Studios, die zu deinem Stil passen. Redaktionell eingeordnet, mit nachvollziehbaren Quellen und
              sichtbarem Prüfdatum – statt anonymer Listen oder gekaufter Rangplätze.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/tattoo-studios/berlin">Studios in Berlin entdecken</Link>
              <MarketLink className="button button-secondary" targetMarket="at" pathname="/tattoo-studios">Tattoo-Studios Österreich</MarketLink>
              <MarketLink className="button button-secondary" targetMarket="ch" pathname="/tattoo-studios">Tattoo-Studios Schweiz</MarketLink>
              <a className="button button-secondary" href="#guide-prinzipien">So prüfen wir Studios</a>
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
            src="/tattoo-studios/tattoo-studio-verzeichnis-deutschland.png"
            alt="Dich mit Stich Tattoo-Studio-Verzeichnis für Deutschland mit Tattoo-Maschine und Standort-Symbolen"
            width={1983}
            height={626}
            sizes="(max-width: 1152px) calc(100vw - 32px), 1120px"
            priority
          />
        </figure>

        <ul className="studio-guide-stats" aria-label="Aktueller Umfang des Tattoo-Studio-Guides">
          <li><strong>{studioCount}</strong><span>strukturierte Studios</span></li>
          <li><strong>{cities.length}</strong><span>deutsche Studio-Stadtseiten</span></li>
          <li><strong>0</strong><span>gekaufte Rangplätze</span></li>
        </ul>

        <section className="content-section studio-guide-country-strip" aria-label="Länder des Studio-Guides">
          <div><span>Jetzt verfügbar</span><strong>Deutschland</strong></div>
          <div><span>Fünf Stadtguides verfügbar</span><strong>Österreich</strong></div>
          <div><span>Zürich-Guide verfügbar</span><strong>Schweiz</strong></div>
        </section>

        <section className="content-section studio-city-finder-feature" aria-labelledby="stadt-finder-heading">
          <div className="studio-city-finder-copy">
            <span className="eyebrow">Tattoo-Studios nach Stadt</span>
            <h2 id="stadt-finder-heading">Finde den passenden Stadtguide</h2>
            <p>Wähle deine Stadt und vergleiche vorhandene Studioangaben, Kontaktwege und redaktionelle Auswahlhinweise. Die Reihenfolge ist keine Rangliste.</p>
            <a className="button button-primary" href="#stadtguides">Zu den Stadtguides</a>
          </div>
          <figure className="studio-city-finder-art">
            <Image
              src="/tattoo-studios/tattoo-studios-nach-stadt-deutschland.png"
              alt="Deutschlandkarte mit markierten Tattoo-Studio-Städten Hamburg, Berlin, Köln, Frankfurt und München"
              width={768}
              height={768}
              loading="eager"
              sizes="(max-width: 900px) calc(100vw - 64px), 480px"
            />
          </figure>
        </section>

        <section className="content-section" id="stadtguides">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Stadtguides</span>
            <h2>Redaktionelle Studio-Guides nach Stadt</h2>
            <p>Alle Stadtseiten enthalten die übernommenen Auswahlhilfen und Stadttexte. Einzelne Studio-Profile und Kontaktangaben zeigen wir nur dort, wo sie bereits über nachvollziehbare Quellen geprüft wurden.</p>
            <p>Die Listen sind als Orientierung gedacht und keine bezahlte Rangliste. Vor einem Termin solltest du Portfolio, Stil, Hygiene, Beratung, aktuelle Kontaktdaten und Verfügbarkeit immer direkt beim jeweiligen Studio prüfen.</p>
          </div>
          <div className="studio-city-grid">
            {guideCities.map((city) => (
              <Link className="studio-city-card" href={`/tattoo-studios/${city.slug}`} key={city.identity}>
                {city.imageUrl ? (
                  <span className="studio-city-card-media">
                    <Image src={city.imageUrl} alt={`Stadtansicht von ${city.cityName}`} width={420} height={280} sizes="(max-width: 640px) 120px, 180px" />
                  </span>
                ) : null}
                <span className="studio-city-card-copy">
                  <span>{city.region} · {city.publicationStatus === "verified" ? `${city.studios.length} geprüfte Studios` : "Stadtguide übernommen"}</span>
                  <span className="studio-city-card-title"><LocationPinIcon /><strong>{city.cityName}</strong></span>
                  <small>{city.publicationStatus === "verified" ? "Redaktioneller Studio-Guide" : "Studio-Profile in Prüfung"}</small>
                  <b>Stadtguide öffnen →</b>
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
            <p>Auch diese veröffentlichten Stadtseiten bleiben direkt erreichbar. Einen eigenen Studio-Guide ergänzen wir erst nach der Prüfung offizieller Studioquellen.</p>
          </div>
          <div className="studio-all-city-grid">
            {additionalTattooCities.map((city) => (
              <Link className="studio-all-city-card" href={`/tattoo-singles/${city.slug}`} key={city.slug}>
                <span className="studio-all-city-media">
                  <Image src={city.imageUrl} alt={`Stadtansicht von ${city.label}`} width={220} height={150} sizes="(max-width: 640px) 112px, 150px" />
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
            <span className="eyebrow">Unser Standard</span>
            <h2>Was einen vertrauenswürdigen Studio-Guide ausmacht</h2>
          </div>
          <div className="studio-principle-grid">
            <article><span>01</span><h3>Quellen sichtbar</h3><p>Jedes Profil nennt seine öffentliche Grundlage und den letzten redaktionellen Check.</p></article>
            <article><span>02</span><h3>Stile statt Sterne</h3><p>Wir helfen bei der fachlichen Vorauswahl, ohne Bewertungen oder Qualität zu erfinden.</p></article>
            <article><span>03</span><h3>Keine gekauften Rankings</h3><p>Bezahlte Platzierungen werden nicht als unabhängige Empfehlung getarnt.</p></article>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
