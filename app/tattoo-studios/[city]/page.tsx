import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { publicUrl } from "@/lib/markets";
import { getTattooStudioCities, getTattooStudioCityGuide } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return getTattooStudioCities("de").map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) return {};
  return {
    title: `Tattoo-Studios in ${guide.cityName}: redaktioneller Guide`,
    description: `${guide.studios.length} ausgewählte Tattoo-Studios in ${guide.cityName} mit Stilrichtungen, Adressen, Websites und transparentem Prüfdatum.`,
    alternates: { canonical: publicUrl("de", `/tattoo-studios/${city}`) },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function TattooStudioCityPage({ params }: PageProps) {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Tattoo-Studios in ${guide.cityName}`,
    url: publicUrl("de", `/tattoo-studios/${guide.slug}`),
    numberOfItems: guide.studios.length,
    itemListElement: guide.studios.map((studio, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: studio.name,
      url: publicUrl("de", `/tattoo-studio/${studio.slug}`),
    })),
  };

  return (
    <SiteFrame market="de" sectionLive>
      <main className="shell studio-guide-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        <nav className="studio-breadcrumb" aria-label="Breadcrumb">
          <Link href="/tattoo-studios">Tattoo-Studio-Guide</Link><span>›</span><span>{guide.cityName}</span>
        </nav>

        <section className="studio-city-hero">
          <div className="studio-city-hero-copy">
            <span className="eyebrow studio-guide-eyebrow">{guide.region} · Studio Guide</span>
            <h1>Tattoo-Studios in {guide.cityName}</h1>
            <p>{guide.studios.length} redaktionell erfasste Studios – mit Stilprofil, Adresse, Kontaktweg und nachvollziehbarem Datenstand.</p>
            <div className="studio-verification-line">
              <span aria-hidden="true">✓</span>
              <div><strong>Zuletzt redaktionell geprüft</strong><small>{formatDate(guide.lastVerified)}</small></div>
            </div>
          </div>
          {guide.imageUrl ? (
            <figure className="studio-city-hero-media">
              <Image src={guide.imageUrl} alt={`${guide.cityName} als Standort des Tattoo-Studio-Guides`} width={1200} height={800} sizes="(max-width: 900px) 100vw, 50vw" priority />
              <figcaption>Foto: {guide.imageAttribution.creator} · {guide.imageAttribution.license}</figcaption>
            </figure>
          ) : null}
        </section>

        <section className="content-section studio-list-section">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Studio-Auswahl</span>
            <h2>{guide.studios.length} Tattoo-Studios in {guide.cityName}</h2>
            <p>Keine Rangliste: Die Reihenfolge stellt keine Qualitätsbewertung dar.</p>
          </div>
          <div className="tattoo-studio-grid">
            {guide.studios.map((studio, index) => (
              <article className="tattoo-studio-card" key={studio.identity}>
                <div className="tattoo-studio-card-mark" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><strong>{studio.name.slice(0, 2).toUpperCase()}</strong></div>
                <div className="tattoo-studio-card-copy">
                  <div className="tattoo-studio-card-head"><span>Redaktionell erfasst</span><h3>{studio.name}</h3></div>
                  <p>{studio.description}</p>
                  {studio.styles.length ? <div className="studio-style-row">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
                  <div className="studio-card-address"><span aria-hidden="true">⌖</span><span>{studio.address}</span></div>
                  <Link className="studio-card-link" href={`/tattoo-studio/${studio.slug}`}>Studio-Profil ansehen <span>→</span></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section studio-editorial-layout">
          <article className="rich-content studio-editorial-card" dangerouslySetInnerHTML={{ __html: guide.editorialHtml }} />
          <aside className="studio-transparency-card">
            <span className="eyebrow">Transparenz</span>
            <h2>So ist diese Auswahl entstanden</h2>
            <p><strong>Keine bezahlte Platzierung.</strong> Wir zeigen öffentlich auffindbare Studios und ordnen ihre selbst beschriebenen Schwerpunkte redaktionell ein.</p>
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: guide.selectionMethodHtml }} />
            <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Öffentliche Ausgangsquelle ansehen</a>
          </aside>
        </section>

        {guide.imageAttribution.sourceUrl ? (
          <p className="studio-image-source">Stadtbild: <a href={guide.imageAttribution.sourceUrl} target="_blank" rel="license noreferrer">{guide.imageAttribution.title}</a> · {guide.imageAttribution.license}</p>
        ) : null}
      </main>
    </SiteFrame>
  );
}
