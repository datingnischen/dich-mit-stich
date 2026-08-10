import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MarketLink } from "@/components/market-link";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getTattooStudioCities } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string }> };

export function generateStaticParams() {
  return [{ market: "ch" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if ((await params).market !== "ch") return { robots: { index: false, follow: false } };
  return {
    title: "Tattoo-Studio-Guide Schweiz",
    description: "Ausgewählte Schweizer Tattoo-Studios mit nachvollziehbaren Primärquellen, Adressen und transparentem Prüfdatum.",
    alternates: { canonical: publicUrl("ch", "/tattoo-studios") },
    robots: { index: false, follow: true },
  };
}

export default async function SwissTattooStudioGuidePage({ params }: PageProps) {
  if ((await params).market !== "ch") notFound();
  const cities = getTattooStudioCities("ch");
  const studioCount = cities.reduce((total, city) => total + city.studios.length, 0);

  return (
    <main className="shell studio-guide-shell">
      <section className="studio-guide-hero">
        <div className="studio-guide-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">Dich mit Stich Schweiz · Studio Guide</span>
          <h1>Tattoo-Studio-Guide für die Schweiz</h1>
          <p>Entdecke sorgfältig recherchierte Studios nach Stadt und Stil – mit offiziellen Quellen, sichtbarem Prüfdatum und ohne gekaufte Ranglisten.</p>
          <div className="button-row">
            <MarketLink className="button button-primary" targetMarket="ch" pathname="/tattoo-studios/zuerich">Zürich-Pilot ansehen</MarketLink>
            <a className="button button-secondary" href="#guide-prinzipien">Unser Rechercheprinzip</a>
          </div>
        </div>
        <div className="studio-guide-hero-mark" aria-hidden="true"><span>INK</span><strong>GUIDE</strong><small>CH · PILOT</small></div>
      </section>

      <ul className="studio-guide-stats" aria-label="Aktueller Umfang des Schweizer Tattoo-Studio-Guides">
        <li><strong>{studioCount}</strong><span>strukturierte Studios</span></li>
        <li><strong>{cities.length}</strong><span>redaktionelle Stadtguides</span></li>
        <li><strong>0</strong><span>gekaufte Rangplätze</span></li>
      </ul>

      <section className="content-section">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">Schweizer Stadtguides</span>
          <h2>Qualität vor Masse: Start mit Zürich</h2>
          <p>Jeder Eintrag wird gegen eine offizielle öffentliche Quelle geprüft, bevor er im Guide erscheint.</p>
        </div>
        <div className="studio-city-grid">
          {cities.map((city) => (
            <MarketLink className="studio-city-card" targetMarket="ch" pathname={`/tattoo-studios/${city.slug}`} key={city.identity}>
              {city.imageUrl ? <Image src={staticAsset(city.imageUrl)} alt={`Stadtansicht von ${city.cityName}`} width={1200} height={675} sizes="(max-width: 760px) 100vw, 60vw" /> : null}
              <div className="studio-city-card-overlay"><span>{city.region} · {city.studios.length} Studios</span><h2>{city.cityName}</h2><strong>Stadtguide öffnen →</strong></div>
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
