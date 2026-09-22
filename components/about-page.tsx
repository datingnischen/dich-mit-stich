import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";

import { MagazineBreadcrumb } from "@/components/magazine-breadcrumb";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { buildAboutPageGraph, type AboutCard, type AboutLink, type AboutPage, type SocialChannel } from "@/lib/about-pages";
import { conversionUrl } from "@/lib/conversion-links";
import { serializeJsonLd } from "@/lib/json-ld";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

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

const channelLogo: Record<SocialChannel, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.6" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.6" cy="6.4" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.9a3 3 0 0 0-2.12-2.12C19.5 4.27 12 4.27 12 4.27s-7.5 0-9.38.51A3 3 0 0 0 .5 6.9 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.1 3 3 0 0 0 2.12 2.12c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.1ZM9.6 15.6V8.4L15.84 12Z" />
    </svg>
  ),
};

function AboutCardView({ card, market }: { card: AboutCard; market: AboutPage["market"] }) {
  const bleed = Boolean(card.channel || card.image?.bleed);
  const imageClassName = [
    "about-card-image",
    card.image?.fit === "contain" ? "about-card-image-contain" : null,
    bleed ? "about-card-image-bleed" : null,
    card.channel ? `about-card-image-channel about-card-image-${card.channel}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {card.image ? (
        <span className={imageClassName}>
          <Image
            src={staticAsset(card.image.src)}
            alt={card.image.alt}
            fill
            sizes={bleed
              ? "(max-width: 560px) calc(100vw - 22px), (max-width: 900px) calc(100vw - 34px), (max-width: 1200px) 33vw, 380px"
              : "(max-width: 900px) calc(100vw - 76px), (max-width: 1200px) 28vw, 300px"}
            unoptimized={card.image.fit === "contain"}
          />
          {bleed ? (
            <span className="about-card-channel-badge" aria-hidden="true">
              {card.channel ? channelLogo[card.channel] : card.icon}
            </span>
          ) : null}
        </span>
      ) : null}
      {card.image?.fit === "contain" || bleed ? null : <span className="about-card-icon" aria-hidden="true">{card.icon}</span>}
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
          <MagazineBreadcrumb
            market={page.market}
            trail={[
              { name: "Startseite", pathname: "/" },
              { name: "Über uns", pathname: "/ueber-uns" },
              { name: page.title, pathname: `/ueber-uns/${page.slug}` },
            ]}
          />
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

        {page.detailSections ? (
          <section className="about-detail-sections" aria-label="Kooperationen im Überblick">
            {page.detailSections.map((section) => (
              <article className="about-detail-section" key={section.title}>
                <span className="eyebrow">{section.eyebrow}</span>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
                {section.cta ? <PageLink className="button button-primary" link={section.cta} market={page.market} /> : null}
              </article>
            ))}
          </section>
        ) : null}

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
          <a className="button button-primary" href={conversionUrl(publicUrl(page.market), "/registration/", "location")}>Kostenlos registrieren</a>
        </section>
      </main>
    </SiteFrame>
  );
}
