import Image from "next/image";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { tattooSinglesPath } from "@/lib/tattoo-singles";
import type { TattooStudioCityGuide as TattooStudioCityGuideData } from "@/lib/tattoo-studio-guide";

type FaqItem = { question: string; answer: string };

type TattooStudioCityGuideProps = {
  guide: TattooStudioCityGuideData;
  market: MarketCode;
};

export function tattooStudioCityDescription(cityName: string, studioCount: number) {
  return studioCount
    ? `${studioCount} Tattoo-Studios in ${cityName} mit Adressen, direkten Links und praktischen Tipps für deine Auswahl.`
    : `Tattoo-Stadtguide für ${cityName} mit Tipps zu Stil, Portfolio, Beratung und Hygiene.`;
}

function formatDate(value: string, market: MarketCode) {
  const locale = market === "ch" ? "de-CH" : market === "at" ? "de-AT" : "de-DE";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function faqItems(cityName: string, market: MarketCode): FaqItem[] {
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
      question: "Wo finde ich aktuelle Angaben zum Studio?",
      answer: "Nutze die verlinkte Studio-Webseite für aktuelle Kontaktdaten, Öffnungszeiten, Preise und freie Termine. Diese Angaben können sich jederzeit ändern.",
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
  const isRollout = guide.publicationStatus === "rollout";
  const isSwiss = market === "ch";
  const marketGuideLabel = market === "ch" ? "Schweizer " : market === "at" ? "Österreichischer " : "";
  const imageUrl = guide.imageUrl ? (market !== "de" ? staticAsset(guide.imageUrl) : guide.imageUrl) : null;

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
          <span className="eyebrow studio-guide-eyebrow">{guide.region} · {marketGuideLabel}Studio Guide</span>
          <h1>Tattoo-Studios in {guide.cityName}</h1>
          <p>{isRollout
            ? `Nutze den Stadtguide für deine Studiosuche in ${guide.cityName}. Aktuell findest du hier noch keine einzelnen Studio-Profile.`
            : `${studios.length} Tattoo-Studios mit Adressen, direkten Links und hilfreichen Auswahlhinweisen – alphabetisch und ohne Rangliste.`}</p>
          <div className="studio-hero-actions">
            {studios.length ? <a className="button button-primary" href="#studio-auswahl">Studios vergleichen</a> : null}
            <a className="button button-secondary" href={studios.length ? "#auswahl-check" : "#tattoo-stile"}>{studios.length ? "Auswahl-Check ansehen" : "Stadtguide lesen"}</a>
          </div>
          <div className="studio-verification-line">
            <span aria-hidden="true">✓</span>
            <div><strong>Stand des Stadtguides</strong><time dateTime={guide.lastVerified}>{formatDate(guide.lastVerified, market)}</time></div>
          </div>
        </div>
        {imageUrl ? (
          <figure className="studio-city-hero-media">
            <Image src={imageUrl} alt={`${guide.cityName} als Standort des Tattoo-Studio-Guides`} width={1200} height={800} sizes="(max-width: 900px) 100vw, 50vw" unoptimized={market === "de"} priority />
            <figcaption>Foto: {guide.imageAttribution.creator} · {guide.imageAttribution.license}</figcaption>
          </figure>
        ) : null}
      </section>

      <section className="content-section studio-list-section" id="studio-auswahl" aria-labelledby="studio-auswahl-heading">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">Studio-Auswahl</span>
          <h2 id="studio-auswahl-heading">{studios.length ? `${studios.length} Tattoo-Studios in ${guide.cityName}` : `So findest du ein Tattoo-Studio in ${guide.cityName}`}</h2>
          <p>{studios.length
            ? "Alphabetische Auswahl, keine Rangliste. Öffne ein Profil für Kontaktangaben, Links und weitere Details."
            : "Vergleiche Portfolios, Stil, Beratung und Hygiene direkt bei den Studios. Der Stadtguide hilft dir mit den wichtigsten Fragen für deine Auswahl."}</p>
        </div>
        {studios.length ? (
          <div className="tattoo-studio-grid">
            {studios.map((studio) => {
              const sourceIsGuide = normalizeUrl(studio.sourceUrl) === normalizeUrl(guide.sourceUrl);
              return (
                <article className="tattoo-studio-card" key={studio.identity}>
                  <div className="tattoo-studio-card-mark" aria-hidden="true"><strong>{studio.name.slice(0, 2).toUpperCase()}</strong></div>
                  <div className="tattoo-studio-card-copy">
                    <div className="tattoo-studio-card-head"><span>{studio.styles.length ? "Stilhinweise vorhanden" : `Studio in ${guide.cityName}`}</span><h3>{studio.name}</h3></div>
                    <p>{studio.description}</p>
                    {studio.styles.length ? <div className="studio-style-row" aria-label="Öffentlich belegte Stilhinweise">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
                    <div className="studio-place-card">
                      <span className="studio-place-icon"><LocationPinIcon /></span>
                      <span className="studio-place-copy"><small>Standort in {guide.cityName}</small><strong>{studio.address}</strong></span>
                    </div>
                    <div className="studio-card-actions">
                      {sourceIsGuide && !studio.websiteUrl ? (
                        <span className="studio-card-source-missing">Keine eigene Studio-Webseite verfügbar</span>
                      ) : (
                        <a className="studio-card-source studio-card-action studio-card-action-secondary" href={studio.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                          {studio.websiteUrl && normalizeUrl(studio.websiteUrl) === normalizeUrl(studio.sourceUrl) ? "Webseite" : "Datenquelle"} <span aria-hidden="true">↗</span>
                        </a>
                      )}
                      <MarketLink className="studio-card-link studio-card-action studio-card-action-primary" targetMarket={market} pathname={`/tattoo-studio/${studio.slug}`}>
                        Studio-Profil ansehen <span aria-hidden="true">→</span>
                      </MarketLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel-card studio-rollout-empty-state">
            <strong>Noch keine Studio-Profile</strong>
            <p>Nutze bis dahin den Stadtguide und die Auswahl-Tipps, um passende Studios selbst zu vergleichen.</p>
          </div>
        )}
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
          {guide.legacyImageUrl ? (
            <figure className="studio-editorial-tattoo-image">
              <Image
                src={guide.legacyImageUrl}
                alt={guide.legacyImageAlt}
                width={guide.legacyImageWidth}
                height={guide.legacyImageHeight}
                loading="eager"
                sizes="(max-width: 900px) calc(100vw - 64px), 650px"
                unoptimized
              />
              <figcaption>
                Tattoo-Illustration aus dem Stadtguide
                {guide.legacyImageSourceUrl ? <>{" · "}<a href={guide.legacyImageSourceUrl} target="_blank" rel="noopener noreferrer nofollow">Originalbild</a></> : null}
              </figcaption>
            </figure>
          ) : null}
          <MarketHtmlContent html={guide.editorialHtml} market={market} />
        </article>
        <div className="studio-guide-sidebar">
          <aside className="studio-transparency-card">
            <span className="eyebrow">Deine Auswahl</span>
            <h2>So findest du das passende Studio</h2>
            <p>Sieh dir aktuelle Portfolios an, kläre offene Fragen im Beratungsgespräch und achte auf saubere, verständliche Abläufe.</p>
            {!isRollout ? <p><strong>Keine bezahlte Platzierung.</strong> Die Reihenfolge ist alphabetisch und keine Qualitätsbewertung.</p> : null}
            {sourceIsPage ? (
              <p className="studio-card-source-missing">Webseiten und Kontaktwege findest du direkt bei den Studios.</p>
            ) : (
              <a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Mehr zum Stadtguide</a>
            )}
          </aside>
          <aside className="studio-singles-card">
            <span className="eyebrow">Szene-Dating</span>
            <h2>Tattoo-Singles in {guide.cityName}</h2>
            <p>
              Studio gefunden? Dann lern Menschen kennen, die deine Begeisterung für Tattoos teilen —
              in {guide.cityName} und Umgebung.
            </p>
            <MarketLink
              className="studio-singles-card-link"
              targetMarket={market}
              pathname={tattooSinglesPath(market, guide.slug)}
            >
              <LocationPinIcon className="studio-singles-card-icon" />
              <span>Tattoo-Singles in {guide.cityName} entdecken</span>
            </MarketLink>
          </aside>
        </div>
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
