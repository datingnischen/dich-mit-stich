import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFrame } from "@/components/site-frame";
import { publicUrl } from "@/lib/markets";
import { getTattooStudioCities } from "@/lib/tattoo-studio-guide";

export const metadata: Metadata = {
  title: "Tattoo-Studio-Guide für Deutschland",
  description: "Entdecke redaktionell geprüfte Tattoo-Studios nach Stadt und Stil – transparent, aktuell und ohne gekaufte Ranglisten.",
  alternates: { canonical: publicUrl("de", "/tattoo-studios") },
};

export default function TattooStudioGuidePage() {
  const cities = getTattooStudioCities("de");
  const studioCount = cities.reduce((total, city) => total + city.studios.length, 0);

  return (
    <SiteFrame market="de" sectionLive>
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
              <Link className="button button-primary" href="/tattoo-studios/hannover">Studios in Hannover entdecken</Link>
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
          <li><strong>{studioCount}</strong><span>strukturierte Studios im Pilot</span></li>
          <li><strong>{cities.length}</strong><span>redaktioneller Stadtguide</span></li>
          <li><strong>0</strong><span>gekaufte Rangplätze</span></li>
        </ul>

        <section className="content-section studio-guide-country-strip" aria-label="Länder des Studio-Guides">
          <div><span>Jetzt verfügbar</span><strong>Deutschland</strong></div>
          <div><span>Nächste Ausbaustufe</span><strong>Österreich</strong></div>
          <div><span>Nächste Ausbaustufe</span><strong>Schweiz</strong></div>
        </section>

        <section className="content-section">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Stadtguides</span>
            <h2>Starte mit einer Stadt, nicht mit einer endlosen Linkliste</h2>
            <p>Jeder Guide verbindet lokale Szene-Einordnung mit strukturierten Studio-Profilen.</p>
          </div>
          <div className="studio-city-grid">
            {cities.map((city) => (
              <Link className="studio-city-card" href={`/tattoo-studios/${city.slug}`} key={city.identity}>
                {city.imageUrl ? (
                  <Image src={city.imageUrl} alt={`Altstadt von ${city.cityName}`} width={1200} height={675} sizes="(max-width: 760px) 100vw, 60vw" />
                ) : null}
                <div className="studio-city-card-overlay">
                  <span>Niedersachsen · {city.studios.length} Studios</span>
                  <h2>{city.cityName}</h2>
                  <strong>Stadtguide öffnen →</strong>
                </div>
              </Link>
            ))}
          </div>
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
