import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { publicUrl } from "@/lib/markets";
import { getTattooStudioCities, getTattooStudioCityGuide } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ city: string }> };

type FaqItem = { question: string; answer: string };

export function generateStaticParams() {
  return getTattooStudioCities("de").map((city) => ({ city: city.slug }));
}

function pageDescription(cityName: string, studioCount: number) {
  return `${studioCount} ausgewählte Tattoo-Studios in ${cityName} mit Adressen, Quellen und Prüfdatum. Stilhinweise nur, soweit sie öffentlich belegt sind.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) return {};

  const title = `Tattoo-Studios in ${guide.cityName}: redaktioneller Guide`;
  const description = pageDescription(guide.cityName, guide.studios.length);
  const url = publicUrl("de", `/tattoo-studios/${city}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      ...(guide.imageUrl ? { images: [{ url: guide.imageUrl, alt: `Tattoo-Studio-Guide für ${guide.cityName}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(guide.imageUrl ? { images: [guide.imageUrl] } : {}),
    },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

function faqItems(cityName: string): FaqItem[] {
  return [
    {
      question: `Wie wähle ich ein Tattoo-Studio in ${cityName} aus?`,
      answer: "Vergleiche zuerst Portfolios für dein gewünschtes Motiv. Kläre danach Beratung, Ablauf, Adresse und Kontaktweg direkt mit dem Studio, bevor du einen Termin vereinbarst.",
    },
    {
      question: "Ist die Reihenfolge der Studios eine Bewertung?",
      answer: "Nein. Die Reihenfolge ist weder ein Ranking noch eine Qualitätsbewertung. Entscheidend sind dein Motiv, der passende Stil, ein persönliches Beratungsgespräch und dein eigener Eindruck.",
    },
    {
      question: "Sind Preise, Öffnungszeiten und freie Termine aktuell?",
      answer: "Diese Angaben können sich kurzfristig ändern. Prüfe Preise, Öffnungszeiten, Terminverfügbarkeit und den genauen Ablauf deshalb immer direkt beim jeweiligen Studio.",
    },
    {
      question: "Welche Angaben prüft Dich mit Stich?",
      answer: "Wir gleichen öffentlich zugängliche Quellen zu Namen, Standort, Kontaktwegen und ausdrücklich genannten Schwerpunkten ab. Das sichtbare Prüfdatum zeigt, wann die redaktionelle Kontrolle zuletzt erfolgte.",
    },
  ];
}

export default async function TattooStudioCityPage({ params }: PageProps) {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) notFound();

  const studios = [...guide.studios].sort((left, right) => left.name.localeCompare(right.name, "de"));
  const pageUrl = publicUrl("de", `/tattoo-studios/${guide.slug}`);
  const guideUrl = publicUrl("de", "/tattoo-studios");
  const faqs = faqItems(guide.cityName);
  const itemListId = `${pageUrl}#studio-liste`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        name: `Tattoo-Studios in ${guide.cityName}`,
        description: pageDescription(guide.cityName, guide.studios.length),
        url: pageUrl,
        dateModified: guide.lastVerified,
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": itemListId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: publicUrl("de", "/") },
          { "@type": "ListItem", position: 2, name: "Tattoo-Studio-Guide", item: guideUrl },
          { "@type": "ListItem", position: 3, name: guide.cityName, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: `Tattoo-Studios in ${guide.cityName}`,
        url: pageUrl,
        numberOfItems: guide.studios.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: studios.map((studio, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: studio.name,
          url: publicUrl("de", `/tattoo-studio/${studio.slug}`),
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <SiteFrame market="de" sectionLive aid="location">
      <main className="shell studio-guide-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        <nav className="studio-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Startseite</Link></li>
            <li><Link href="/tattoo-studios">Tattoo-Studio-Guide</Link></li>
            <li aria-current="page">{guide.cityName}</li>
          </ol>
        </nav>

        <section className="studio-city-hero">
          <div className="studio-city-hero-copy">
            <span className="eyebrow studio-guide-eyebrow">{guide.region} · Studio Guide</span>
            <h1>Tattoo-Studios in {guide.cityName}</h1>
            <p>{guide.studios.length} redaktionell erfasste Studios mit Adressen, Quellen und ausdrücklich belegten Stilhinweisen – transparent und ohne Rangliste.</p>
            <div className="studio-hero-actions">
              <a className="button button-primary" href="#studio-auswahl">Studios vergleichen</a>
              <a className="button button-secondary" href="#auswahl-check">Auswahl-Check ansehen</a>
            </div>
            <div className="studio-verification-line">
              <span aria-hidden="true">✓</span>
              <div><strong>Zuletzt redaktionell geprüft</strong><time dateTime={guide.lastVerified}>{formatDate(guide.lastVerified)}</time></div>
            </div>
          </div>
          {guide.imageUrl ? (
            <figure className="studio-city-hero-media">
              <Image src={guide.imageUrl} alt={`${guide.cityName} als Standort des Tattoo-Studio-Guides`} width={1200} height={800} sizes="(max-width: 900px) 100vw, 50vw" priority />
              <figcaption>Foto: {guide.imageAttribution.creator} · {guide.imageAttribution.license}</figcaption>
            </figure>
          ) : null}
        </section>

        <section className="content-section studio-list-section" id="studio-auswahl" aria-labelledby="studio-auswahl-heading">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Studio-Auswahl</span>
            <h2 id="studio-auswahl-heading">{guide.studios.length} Tattoo-Studios in {guide.cityName}</h2>
            <p>Alphabetische Auswahl, keine Rangliste. Öffne ein Profil für Quellen, Kontaktangaben und den jeweiligen Datenstand.</p>
          </div>
          <div className="tattoo-studio-grid">
            {studios.map((studio) => {
              const sourceIsGuide = studio.sourceUrl === guide.sourceUrl;
              return (
                <article className="tattoo-studio-card" key={studio.identity}>
                  <div className="tattoo-studio-card-mark" aria-hidden="true"><strong>{studio.name.slice(0, 2).toUpperCase()}</strong></div>
                  <div className="tattoo-studio-card-copy">
                    <div className="tattoo-studio-card-head"><span>{studio.styles.length ? "Stilhinweise vorhanden" : "Redaktionell erfasst"}</span><h3>{studio.name}</h3></div>
                    <p>{studio.description}</p>
                    {studio.styles.length ? <div className="studio-style-row" aria-label="Öffentlich belegte Stilhinweise">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
                    <div className="studio-card-address"><span aria-hidden="true">⌖</span><span>{studio.address}</span></div>
                    {sourceIsGuide && !studio.websiteUrl ? (
                      <span className="studio-card-source-missing">Keine offizielle Studioseite verifiziert</span>
                    ) : (
                      <a className="studio-card-source" href={studio.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{studio.websiteUrl && studio.websiteUrl === studio.sourceUrl ? "Offizielle Studioseite" : "Datenquelle ansehen"} ↗</a>
                    )}
                    <Link className="studio-card-link" href={`/tattoo-studio/${studio.slug}`}>Studio-Profil ansehen <span>→</span></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="content-section studio-choice-section" id="auswahl-check" aria-labelledby="auswahl-check-heading">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Vor dem Termin</span>
            <h2 id="auswahl-check-heading">Das solltest du vor der Anfrage prüfen</h2>
            <p>Ein passendes Studio erkennst du nicht an seiner Position in einer Liste. Diese drei Schritte helfen dir bei einer belastbaren Vorauswahl.</p>
          </div>
          <div className="studio-choice-grid">
            <article><span>01</span><h3>Stil und Portfolio</h3><p>Sieh dir mehrere verheilte Arbeiten an und prüfe, ob Linienführung, Flächen und Motive zu deiner Idee passen.</p></article>
            <article><span>02</span><h3>Beratung und Ablauf</h3><p>Kläre Motiv, Körperstelle, Größe, Vorbereitung, Terminablauf und Nachsorge direkt mit dem Studio.</p></article>
            <article><span>03</span><h3>Adresse und Kontakt</h3><p>Prüfe die aktuelle Studioseite, den genauen Standort sowie Preise, Öffnungszeiten und freie Termine.</p></article>
          </div>
        </section>

        <section className="content-section studio-editorial-layout" id="tattoo-stile">
          <article className="rich-content studio-editorial-card" dangerouslySetInnerHTML={{ __html: guide.editorialHtml }} />
          <aside className="studio-transparency-card">
            <span className="eyebrow">Transparenz</span>
            <h2>So ist diese Auswahl entstanden</h2>
            <p><strong>Keine bezahlte Platzierung.</strong> Wir zeigen öffentlich auffindbare Studios und ordnen ausschließlich nachvollziehbare Angaben redaktionell ein.</p>
            <div className="studio-transparency-copy" dangerouslySetInnerHTML={{ __html: guide.selectionMethodHtml }} />
            <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Öffentliche Ausgangsquelle ansehen</a>
          </aside>
        </section>

        <section className="content-section studio-faq-section" id="haeufige-fragen" aria-labelledby="studio-faq-heading">
          <div className="section-header studio-guide-section-header">
            <span className="eyebrow">Kurz beantwortet</span>
            <h2 id="studio-faq-heading">Häufige Fragen zu Tattoo-Studios in {guide.cityName}</h2>
          </div>
          <div className="studio-faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {guide.imageAttribution.sourceUrl ? (
          <p className="studio-image-source">Stadtbild: <a href={guide.imageAttribution.sourceUrl} target="_blank" rel="license noopener noreferrer nofollow">{guide.imageAttribution.title}</a> · {guide.imageAttribution.license}</p>
        ) : null}
      </main>
    </SiteFrame>
  );
}
