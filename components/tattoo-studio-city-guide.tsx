import Image from "next/image";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import type { TattooStudioCityGuide as TattooStudioCityGuideData } from "@/lib/tattoo-studio-guide";

type FaqItem = { question: string; answer: string };

type TattooStudioCityGuideProps = {
  guide: TattooStudioCityGuideData;
  market: Extract<MarketCode, "de" | "ch">;
};

export function tattooStudioCityDescription(cityName: string, studioCount: number) {
  return `${studioCount} ausgewählte Tattoo-Studios in ${cityName} mit Adressen, Quellen und Prüfdatum. Stilhinweise nur, soweit sie öffentlich belegt sind.`;
}

function formatDate(value: string, market: "de" | "ch") {
  return new Intl.DateTimeFormat(market === "ch" ? "de-CH" : "de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function faqItems(cityName: string, market: "de" | "ch"): FaqItem[] {
  const size = market === "ch" ? "Grösse" : "Größe";
  const openingHours = market === "ch" ? "Öffnungszeiten" : "Öffnungszeiten";

  return [
    {
      question: `Wie wähle ich ein Tattoo-Studio in ${cityName} aus?`,
      answer: `Vergleiche zuerst Portfolios für dein gewünschtes Motiv. Kläre danach Beratung, Ablauf, ${size}, Adresse und Kontaktweg direkt mit dem Studio, bevor du einen Termin vereinbarst.`,
    },
    {
      question: "Ist die Reihenfolge der Studios eine Bewertung?",
      answer: "Nein. Die alphabetische Reihenfolge ist weder ein Ranking noch eine Qualitätsbewertung. Entscheidend sind dein Motiv, der passende Stil, ein persönliches Beratungsgespräch und dein eigener Eindruck.",
    },
    {
      question: `Sind Preise, ${openingHours} und freie Termine aktuell?`,
      answer: `Diese Angaben können sich kurzfristig ändern. Prüfe Preise, ${openingHours}, Terminverfügbarkeit und den genauen Ablauf deshalb immer direkt beim jeweiligen Studio.`,
    },
    {
      question: "Welche Angaben prüft Dich mit Stich?",
      answer: "Wir gleichen öffentlich zugängliche Quellen zu Namen, Standort, Kontaktwegen und ausdrücklich genannten Schwerpunkten ab. Das sichtbare Prüfdatum zeigt, wann die redaktionelle Kontrolle zuletzt erfolgte.",
    },
  ];
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function TattooStudioCityGuide({ guide, market }: TattooStudioCityGuideProps) {
  const studios = [...guide.studios].sort((left, right) => left.name.localeCompare(right.name, market === "ch" ? "de-CH" : "de"));
  const pageUrl = publicUrl(market, `/tattoo-studios/${guide.slug}`);
  const guideUrl = publicUrl(market, "/tattoo-studios");
  const faqs = faqItems(guide.cityName, market);
  const itemListId = `${pageUrl}#studio-liste`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const sourceIsPage = normalizeUrl(guide.sourceUrl) === normalizeUrl(pageUrl);
  const isSwiss = market === "ch";
  const imageUrl = guide.imageUrl ? (isSwiss ? staticAsset(guide.imageUrl) : guide.imageUrl) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        name: `Tattoo-Studios in ${guide.cityName}`,
        description: tattooStudioCityDescription(guide.cityName, studios.length),
        url: pageUrl,
        dateModified: guide.lastVerified,
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": itemListId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: publicUrl(market, "/") },
          { "@type": "ListItem", position: 2, name: "Tattoo-Studio-Guide", item: guideUrl },
          { "@type": "ListItem", position: 3, name: guide.cityName, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": itemListId,
        name: `Tattoo-Studios in ${guide.cityName}`,
        url: pageUrl,
        numberOfItems: studios.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: studios.map((studio, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: studio.name,
          url: publicUrl(market, `/tattoo-studio/${studio.slug}`),
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
    <main className="shell studio-guide-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav className="studio-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><MarketLink targetMarket={market} pathname="/">Startseite</MarketLink></li>
          <li><MarketLink targetMarket={market} pathname="/tattoo-studios">Tattoo-Studio-Guide</MarketLink></li>
          <li aria-current="page">{guide.cityName}</li>
        </ol>
      </nav>

      <section className="studio-city-hero">
        <div className="studio-city-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">{guide.region} · {isSwiss ? "Schweizer " : ""}Studio Guide</span>
          <h1>Tattoo-Studios in {guide.cityName}</h1>
          <p>{studios.length} redaktionell erfasste Studios mit Adressen, Quellen und ausdrücklich belegten Stilhinweisen – transparent und ohne Rangliste.</p>
          <div className="studio-hero-actions">
            <a className="button button-primary" href="#studio-auswahl">Studios vergleichen</a>
            <a className="button button-secondary" href="#auswahl-check">Auswahl-Check ansehen</a>
          </div>
          <div className="studio-verification-line">
            <span aria-hidden="true">✓</span>
            <div><strong>Zuletzt redaktionell geprüft</strong><time dateTime={guide.lastVerified}>{formatDate(guide.lastVerified, market)}</time></div>
          </div>
        </div>
        {imageUrl ? (
          <figure className="studio-city-hero-media">
            <Image src={imageUrl} alt={`${guide.cityName} als Standort des Tattoo-Studio-Guides`} width={1200} height={800} sizes="(max-width: 900px) 100vw, 50vw" priority />
            <figcaption>Foto: {guide.imageAttribution.creator} · {guide.imageAttribution.license}</figcaption>
          </figure>
        ) : null}
      </section>

      <section className="content-section studio-list-section" id="studio-auswahl" aria-labelledby="studio-auswahl-heading">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">Studio-Auswahl</span>
          <h2 id="studio-auswahl-heading">{studios.length} Tattoo-Studios in {guide.cityName}</h2>
          <p>Alphabetische Auswahl, keine Rangliste. Öffne ein Profil für Quellen, Kontaktangaben und den jeweiligen Datenstand.</p>
        </div>
        <div className="tattoo-studio-grid">
          {studios.map((studio) => {
            const sourceIsGuide = normalizeUrl(studio.sourceUrl) === normalizeUrl(guide.sourceUrl);
            return (
              <article className="tattoo-studio-card" key={studio.identity}>
                <div className="tattoo-studio-card-mark" aria-hidden="true"><strong>{studio.name.slice(0, 2).toUpperCase()}</strong></div>
                <div className="tattoo-studio-card-copy">
                  <div className="tattoo-studio-card-head"><span>{studio.styles.length ? "Stilhinweise vorhanden" : "Redaktionell erfasst"}</span><h3>{studio.name}</h3></div>
                  <p>{studio.description}</p>
                  {studio.styles.length ? <div className="studio-style-row" aria-label="Öffentlich belegte Stilhinweise">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
                  <div className="studio-place-card">
                    <span className="studio-place-icon"><LocationPinIcon /></span>
                    <span className="studio-place-copy"><small>Standort in {guide.cityName}</small><strong>{studio.address}</strong></span>
                  </div>
                  {sourceIsGuide && !studio.websiteUrl ? (
                    <span className="studio-card-source-missing">Keine offizielle Studioseite verifiziert</span>
                  ) : (
                    <a className="studio-card-source" href={studio.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{studio.websiteUrl && normalizeUrl(studio.websiteUrl) === normalizeUrl(studio.sourceUrl) ? "Offizielle Studioseite" : "Datenquelle ansehen"} ↗</a>
                  )}
                  <MarketLink className="studio-card-link" targetMarket={market} pathname={`/tattoo-studio/${studio.slug}`}>Studio-Profil ansehen <span>→</span></MarketLink>
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
          <article><span>02</span><h3>Beratung und Ablauf</h3><p>Kläre Motiv, Körperstelle, {isSwiss ? "Grösse" : "Größe"}, Vorbereitung, Terminablauf und Nachsorge direkt mit dem Studio.</p></article>
          <article><span>03</span><h3>Adresse und Kontakt</h3><p>Prüfe die aktuelle Studioseite, den genauen Standort sowie Preise, Öffnungszeiten und freie Termine.</p></article>
        </div>
      </section>

      <section className="content-section studio-editorial-layout" id="tattoo-stile">
        <article className="rich-content studio-editorial-card">
          <MarketHtmlContent html={guide.editorialHtml} market={market} />
        </article>
        <aside className="studio-transparency-card">
          <span className="eyebrow">Transparenz</span>
          <h2>So ist diese Auswahl entstanden</h2>
          <p><strong>Keine bezahlte Platzierung.</strong> Wir zeigen öffentlich auffindbare Studios und ordnen ausschließlich nachvollziehbare Angaben redaktionell ein.</p>
          <div className="studio-transparency-copy" dangerouslySetInnerHTML={{ __html: guide.selectionMethodHtml }} />
          {sourceIsPage ? (
            <p className="studio-card-source-missing">Einzelquellen findest du direkt bei den Studios.</p>
          ) : (
            <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Öffentliche Ausgangsquelle ansehen</a>
          )}
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
  );
}
