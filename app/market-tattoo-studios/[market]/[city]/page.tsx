import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MarketLink } from "@/components/market-link";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getTattooStudioCities, getTattooStudioCityGuide } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string; city: string }> };

export function generateStaticParams() {
  return getTattooStudioCities("ch").map((city) => ({ market: "ch", city: city.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, city } = await params;
  if (market !== "ch") return { robots: { index: false, follow: false } };
  const guide = getTattooStudioCityGuide("ch", city);
  if (!guide) return { robots: { index: false, follow: false } };
  return {
    title: `Tattoo-Studios in ${guide.cityName}: transparenter Guide`,
    description: `${guide.studios.length} ausgewählte Tattoo-Studios in ${guide.cityName} mit offiziellen Quellen, Adressen und transparentem Prüfdatum.`,
    alternates: { canonical: publicUrl("ch", `/tattoo-studios/${city}`) },
    robots: { index: false, follow: true },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function SwissTattooStudioCityPage({ params }: PageProps) {
  const { market, city } = await params;
  if (market !== "ch") notFound();
  const guide = getTattooStudioCityGuide("ch", city);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Tattoo-Studios in ${guide.cityName}`,
    url: publicUrl("ch", `/tattoo-studios/${guide.slug}`),
    numberOfItems: guide.studios.length,
    itemListElement: guide.studios.map((studio, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: studio.name,
      url: publicUrl("ch", `/tattoo-studio/${studio.slug}`),
    })),
  };

  return (
    <main className="shell studio-guide-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="studio-breadcrumb" aria-label="Breadcrumb"><MarketLink targetMarket="ch" pathname="/tattoo-studios">Tattoo-Studio-Guide Schweiz</MarketLink><span>›</span><span>{guide.cityName}</span></nav>

      <section className="studio-city-hero">
        <div className="studio-city-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">{guide.region} · Schweizer Studio Guide</span>
          <h1>Tattoo-Studios in {guide.cityName}</h1>
          <p>{guide.studios.length} redaktionell erfasste Studios mit öffentlich belegten Adressen und nachvollziehbaren Quellen.</p>
          <div className="studio-verification-line"><span aria-hidden="true">✓</span><div><strong>Zuletzt redaktionell geprüft</strong><small>{formatDate(guide.lastVerified)}</small></div></div>
        </div>
        {guide.imageUrl ? (
          <figure className="studio-city-hero-media">
            <Image src={staticAsset(guide.imageUrl)} alt={`${guide.cityName} als Standort des Schweizer Tattoo-Studio-Guides`} width={1200} height={800} sizes="(max-width: 900px) 100vw, 50vw" priority />
            <figcaption>Foto: {guide.imageAttribution.creator} · {guide.imageAttribution.license}</figcaption>
          </figure>
        ) : null}
      </section>

      <section className="content-section studio-list-section">
        <div className="section-header studio-guide-section-header"><span className="eyebrow">Studio-Auswahl</span><h2>{guide.studios.length} Tattoo-Studios in {guide.cityName}</h2><p>Keine Rangliste: Die Reihenfolge stellt keine Qualitätsbewertung dar.</p></div>
        <div className="tattoo-studio-grid">
          {guide.studios.map((studio, index) => (
            <article className="tattoo-studio-card" key={studio.identity}>
              <div className="tattoo-studio-card-mark" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><strong>{studio.name.slice(0, 2).toUpperCase()}</strong></div>
              <div className="tattoo-studio-card-copy">
                <div className="tattoo-studio-card-head"><span>Quelle geprüft</span><h3>{studio.name}</h3></div>
                <p>{studio.description}</p>
                {studio.styles.length ? <div className="studio-style-row">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
                <div className="studio-card-address"><span aria-hidden="true">⌖</span><span>{studio.address}</span></div>
                <a className="studio-card-source" href={studio.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Datenquelle ansehen ↗</a>
                <MarketLink className="studio-card-link" targetMarket="ch" pathname={`/tattoo-studio/${studio.slug}`}>Studio-Profil ansehen <span>→</span></MarketLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section studio-editorial-layout">
        <article className="rich-content studio-editorial-card" dangerouslySetInnerHTML={{ __html: guide.editorialHtml }} />
        <aside className="studio-transparency-card"><span className="eyebrow">Transparenz</span><h2>So ist diese Auswahl entstanden</h2><div className="rich-content" dangerouslySetInnerHTML={{ __html: guide.selectionMethodHtml }} /><a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Öffentliche Ausgangsquelle ansehen</a></aside>
      </section>
      {guide.imageAttribution.sourceUrl ? <p className="studio-image-source">Stadtbild: <a href={guide.imageAttribution.sourceUrl} target="_blank" rel="license noreferrer">{guide.imageAttribution.title}</a> · {guide.imageAttribution.license}</p> : null}
    </main>
  );
}
