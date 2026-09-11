import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { publicUrl } from "@/lib/markets";
import { getTattooCityDirectory } from "@/lib/tattoo-singles";
import { getTattooStudioCities } from "@/lib/tattoo-studio-guide";

export const metadata: Metadata = {
  title: "Tattoo-Studio-Guide für Deutschland",
  description: "Entdecke redaktionell geprüfte Tattoo-Studios nach Stadt und Stil – transparent, aktuell und ohne gekaufte Ranglisten.",
  alternates: { canonical: publicUrl("de", "/tattoo-studios") },
};

export default function TattooStudioGuidePage() {
  const cities = getTattooStudioCities("de");
  const allTattooCities = getTattooCityDirectory();
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

        <ul className="studio-guide-stats" aria-label="Aktueller Umfang des Tattoo-Studio-Guides">
          <li><strong>{studioCount}</strong><span>strukturierte Studios</span></li>
          <li><strong>{cities.length}</strong><span>redaktionelle Stadtguides</span></li>
          <li><strong>0</strong><span>gekaufte Rangplätze</span></li>
        </ul>

        <section className="content-section studio-guide-country-strip" aria-label="Länder des Studio-Guides">
          <div><span>Jetzt verfügbar</span><strong>Deutschland</strong></div>
          <div><span>Nächste Ausbaustufe</span><strong>Österreich</strong></div>
          <div><span>Vorschau verfügbar</span><strong>Schweiz</strong></div>
        </section>

        <section className="content-section">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Stadtguides</span>
            <h2>Redaktionelle Studio-Guides nach Stadt</h2>
            <p>Für Berlin und Hannover findest du geprüfte Profile, Quellen und konkrete Auswahlhilfen.</p>
          </div>
          <div className="studio-city-grid">
            {cities.map((city) => (
              <Link className="studio-city-card" href={`/tattoo-studios/${city.slug}`} key={city.identity}>
                {city.imageUrl ? (
                  <span className="studio-city-card-media">
                    <Image src={city.imageUrl} alt={`Stadtansicht von ${city.cityName}`} width={420} height={280} sizes="(max-width: 640px) 120px, 180px" />
                  </span>
                ) : null}
                <span className="studio-city-card-copy">
                  <span>{city.region} · {city.studios.length} Studios</span>
                  <span className="studio-city-card-title"><LocationPinIcon /><strong>{city.cityName}</strong></span>
                  <small>Redaktioneller Studio-Guide</small>
                  <b>Stadtguide öffnen →</b>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="content-section studio-all-cities-section" aria-labelledby="all-tattoo-cities-heading">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Tattoo-Städte</span>
            <h2 id="all-tattoo-cities-heading">Alle Tattoo-Städte auf einen Blick</h2>
            <p>Hier findest du alle veröffentlichten Tattoo-Stadtseiten. Berlin und Hannover haben zusätzlich einen redaktionellen Studio-Guide.</p>
          </div>
          <div className="studio-all-city-grid">
            {allTattooCities.map((city) => (
              <Link className="studio-all-city-card" href={`/tattoo-singles/${city.slug}`} key={city.slug}>
                <span className="studio-all-city-media">
                  <Image src={city.imageUrl} alt={`Stadtansicht von ${city.label}`} width={220} height={150} sizes="(max-width: 640px) 112px, 150px" />
                </span>
                <span className="studio-all-city-copy">
                  <LocationPinIcon />
                  <span><strong>{city.label}</strong><small>Tattoo-Singles in {city.label}</small></span>
                </span>
              </Link>
            ))}
          </div>
          <details className="city-preview-sources">
            <summary>Bildquellen der Stadtmotive</summary>
            <ul>
              {allTattooCities.map((city) => (
                <li key={city.slug}>
                  <strong>{city.label}:</strong>{" "}
                  <a href={city.imageAttribution.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {city.imageAttribution.title}
                  </a>{" "}
                  von {city.imageAttribution.creator},{" "}
                  <a href={city.imageAttribution.licenseUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {city.imageAttribution.license}
                  </a>{" "}
                  <span>– Bearbeitung: {city.imageAttribution.modifications}</span>
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
