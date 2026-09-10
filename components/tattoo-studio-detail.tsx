import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { publicUrl, type MarketCode } from "@/lib/markets";
import type { TattooStudio as TattooStudioData, TattooStudioCityGuide } from "@/lib/tattoo-studio-guide";

type TattooStudioDetailProps = {
  studio: TattooStudioData;
  city: TattooStudioCityGuide;
  market: Extract<MarketCode, "de" | "ch">;
};

function formatDate(value: string, market: "de" | "ch") {
  return new Intl.DateTimeFormat(market === "ch" ? "de-CH" : "de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function hasCompleteStreetAddress(value: string) {
  return /\b\d+[a-zA-Z]?\s*,\s*\d{4,5}\b/.test(value);
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function TattooStudioDetail({ studio, city, market }: TattooStudioDetailProps) {
  const related = city.studios
    .filter((item) => item.slug !== studio.slug)
    .sort((left, right) => left.name.localeCompare(right.name, market === "ch" ? "de-CH" : "de"))
    .slice(0, 3);
  const sourceIsGuide = normalizeUrl(studio.sourceUrl) === normalizeUrl(city.sourceUrl);
  const pageUrl = publicUrl(market, `/tattoo-studio/${studio.slug}`);
  const cityUrl = publicUrl(market, `/tattoo-studios/${studio.citySlug}`);
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TattooParlor",
        "@id": `${pageUrl}#studio`,
        name: studio.name,
        description: studio.description,
        url: pageUrl,
        ...(studio.websiteUrl ? { sameAs: studio.websiteUrl } : {}),
        address: {
          "@type": "PostalAddress",
          ...(hasCompleteStreetAddress(studio.address) ? { streetAddress: studio.address } : {}),
          addressLocality: studio.cityName,
          addressCountry: studio.country,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: publicUrl(market, "/") },
          { "@type": "ListItem", position: 2, name: "Tattoo-Studio-Guide", item: publicUrl(market, "/tattoo-studios") },
          { "@type": "ListItem", position: 3, name: studio.cityName, item: cityUrl },
          { "@type": "ListItem", position: 4, name: studio.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="shell studio-guide-shell studio-detail-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav className="studio-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><MarketLink targetMarket={market} pathname="/">Startseite</MarketLink></li>
          <li><MarketLink targetMarket={market} pathname="/tattoo-studios">Studio-Guide</MarketLink></li>
          <li><MarketLink targetMarket={market} pathname={`/tattoo-studios/${studio.citySlug}`}>{studio.cityName}</MarketLink></li>
          <li aria-current="page">{studio.name}</li>
        </ol>
      </nav>

      <section className="studio-detail-hero">
        <div className="studio-detail-monogram" aria-hidden="true"><span>Studio</span><strong>{studio.name.slice(0, 2).toUpperCase()}</strong><small>{studio.cityName}</small></div>
        <div className="studio-detail-hero-copy">
          <span className="eyebrow studio-guide-eyebrow">Tattoo-Studio in {studio.cityName}</span>
          <h1>{studio.name}</h1>
          <p>{studio.description}</p>
          {studio.styles.length ? <div className="studio-style-row studio-detail-styles" aria-label="Öffentlich belegte Stilhinweise">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
          <div className="button-row">
            {studio.websiteUrl ? (
              <a className="button button-primary" href={studio.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">Website des Studios öffnen</a>
            ) : (
              <span className="button button-primary" aria-disabled="true">Keine verifizierte Website</span>
            )}
            <MarketLink className="button button-secondary" targetMarket={market} pathname={`/tattoo-studios/${studio.citySlug}`}>Weitere Studios in {studio.cityName}</MarketLink>
          </div>
        </div>
      </section>

      <section className="studio-detail-grid">
        <article className="panel-card studio-fact-card">
          <span className="eyebrow">Studio-Steckbrief</span>
          <dl>
            <div className="studio-detail-place"><dt><LocationPinIcon /> Standort</dt><dd><small>{studio.cityName}</small><strong>{studio.address}</strong></dd></div>
            <div><dt>Kontakt</dt><dd>{studio.contact || "Keine verifizierten Kontaktdaten"}</dd></div>
            <div><dt>Website</dt><dd>{studio.websiteUrl ? <a href={studio.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">{new URL(studio.websiteUrl).hostname}</a> : "Nicht belastbar bestätigt"}</dd></div>
            <div><dt>Datenstatus</dt><dd>Redaktionell erfasst</dd></div>
          </dl>
        </article>
        <aside className="panel-card studio-trust-card">
          <span className="eyebrow">Vertrauen & Aktualität</span>
          <h2>Transparent statt Sterne-Ranking</h2>
          <ul>
            <li>Zuletzt redaktionell geprüft: <strong>{formatDate(studio.lastVerified, market)}</strong></li>
            <li>Keine bezahlte Platzierung</li>
            <li>Angaben basieren auf öffentlich zugänglichen Studioinformationen</li>
          </ul>
          {sourceIsGuide ? (
            <MarketLink targetMarket={market} pathname={`/tattoo-studios/${studio.citySlug}`}>Redaktionelle Ausgangsseite öffnen →</MarketLink>
          ) : (
            <a href={studio.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">Redaktionelle Quelle öffnen →</a>
          )}
          <a href={publicUrl(market, "/kontakt/")}>Datenänderung melden →</a>
        </aside>
      </section>

      {related.length ? (
        <section className="content-section">
          <div className="section-header studio-guide-section-header"><span className="eyebrow">In der Nähe</span><h2>Weitere Studios in {studio.cityName}</h2></div>
          <div className="studio-related-grid">
            {related.map((item) => <MarketLink targetMarket={market} pathname={`/tattoo-studio/${item.slug}`} key={item.identity}><span>Studio-Profil</span><h3>{item.name}</h3><strong>Öffnen →</strong></MarketLink>)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
