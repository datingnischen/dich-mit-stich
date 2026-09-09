import type { Metadata } from "next";

import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { buildAboutPageGraph, type AboutCard, type AboutLink, type AboutPage } from "@/lib/about-pages";
import { serializeJsonLd } from "@/lib/json-ld";
import { publicUrl } from "@/lib/markets";

function PageLink({ link, market, className }: { link: AboutLink; market: AboutPage["market"]; className?: string }) {
  if (link.external) {
    const opensNewTab = link.href.startsWith("http");
    return (
      <a
        className={className}
        href={link.href}
        {...(opensNewTab ? { target: "_blank" } : {})}
        rel="nofollow noopener noreferrer"
      >
        {link.label}
      </a>
    );
  }

  return (
    <MarketLink className={className} targetMarket={market} pathname={link.href}>
      {link.label}
    </MarketLink>
  );
}

function AboutCardView({ card, market }: { card: AboutCard; market: AboutPage["market"] }) {
  const content = (
    <>
      <span className="about-card-icon" aria-hidden="true">{card.icon}</span>
      <span className="eyebrow">{card.eyebrow}</span>
      <h2>{card.title}</h2>
      <p>{card.text}</p>
      {card.link ? <span className="about-card-action">{card.link.label}<span aria-hidden="true">→</span></span> : null}
    </>
  );

  if (!card.link) return <article className="about-topic-card">{content}</article>;
  if (card.link.external) {
    return (
      <a className="about-topic-card about-topic-card-linked" href={card.link.href} target="_blank" rel="nofollow noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <MarketLink className="about-topic-card about-topic-card-linked" targetMarket={market} pathname={card.link.href}>
      {content}
    </MarketLink>
  );
}

export function aboutPageMetadata(page: AboutPage): Metadata {
  const canonical = publicUrl(page.market, page.path);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: "Dich mit Stich",
      locale: page.market === "de" ? "de_DE" : page.market === "at" ? "de_AT" : "de_CH",
    },
  };
}

export function AboutPageView({ page }: { page: AboutPage }) {
  const graph = buildAboutPageGraph(page);
  const countryName = page.market === "de" ? "Deutschland" : page.market === "at" ? "Österreich" : "Schweiz";

  return (
    <SiteFrame market={page.market} sectionLive>
      <main className="shell about-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />

        {page.slug ? (
          <nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">
            <MarketLink targetMarket={page.market} pathname="/ueber-uns">Über uns</MarketLink>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{page.title}</span>
          </nav>
        ) : null}

        <header className="about-hero">
          <div className="about-hero-copy">
            <span className="eyebrow">{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p className="about-hero-lead">{page.lead}</p>
            <div className="about-highlight-row" aria-label="Das findest du hier">
              {page.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
            </div>
            <div className="button-row about-hero-actions">
              <PageLink className="button button-primary" link={page.primaryCta} market={page.market} />
              {page.secondaryCta ? <PageLink className="button button-secondary" link={page.secondaryCta} market={page.market} /> : null}
            </div>
          </div>
          <aside className="about-hero-mark" aria-label={`Dich mit Stich ${countryName}`}>
            <span>Dich</span>
            <strong>mit Stich</strong>
            <small>{countryName}</small>
          </aside>
        </header>

        <section className="content-section about-content-section" aria-labelledby="about-section-title">
          <div className="section-header">
            <span className="eyebrow">{page.sectionEyebrow}</span>
            <h2 id="about-section-title">{page.sectionTitle}</h2>
            <p>{page.sectionLead}</p>
          </div>
          <div className="about-topic-grid">
            {page.cards.map((card) => <AboutCardView card={card} market={page.market} key={card.title} />)}
          </div>
        </section>

        {page.slug === null ? (
          <section className="about-split-section">
            <article className="about-info-panel about-info-panel-dark">
              <span className="eyebrow">Plattform & Betrieb</span>
              <h2>Klare Rollen statt anonymer Markenfassade</h2>
              <p>
                Christian M. Haas und Anne Schweitzer stehen sichtbar für redaktionelle Inhalte. Die Icony GmbH
                betreibt die Dating-Plattform und ist Ansprechpartnerin für technische, rechtliche und datenschutzbezogene Plattformthemen.
              </p>
              <MarketLink targetMarket={page.market} pathname="/ueber-uns/expertenteam">Menschen und Rollen kennenlernen</MarketLink>
            </article>
            <article className="about-info-panel">
              <span className="eyebrow">Dein nächster Schritt</span>
              <h2>Erst informieren, dann selbst entscheiden</h2>
              <p>
                Lies Community-Geschichten, prüfe aktuelle externe Bewertungen oder schau dich kostenlos um – ohne Erfolgsversprechen und ohne festgeschriebene Sternezahl.
              </p>
              <MarketLink targetMarket={page.market} pathname="/ueber-uns/bewertungen">Bewertungen realistisch einordnen</MarketLink>
            </article>
          </section>
        ) : null}

        <section className="about-final-cta">
          <div>
            <span className="eyebrow">Dich mit Stich entdecken</span>
            <h2>Finde Menschen, die deinen Stil verstehen.</h2>
            <p>Starte kostenlos und entscheide selbst, wen du kennenlernen möchtest.</p>
          </div>
          <a className="button button-primary" href={publicUrl(page.market, "/registration/")}>Kostenlos registrieren</a>
        </section>
      </main>
    </SiteFrame>
  );
}
