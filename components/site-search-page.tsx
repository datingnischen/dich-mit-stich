import type { Metadata } from "next";

import { MagazineBreadcrumb } from "@/components/magazine-breadcrumb";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { SiteSearchForm } from "@/components/site-search-form";
import { marketTitleSuffix, publicUrl, type MarketCode } from "@/lib/markets";
import { ABOUT_SEARCH_PATH, cleanSearchQuery, searchDocuments, SEARCH_RESULT_LIMIT } from "@/lib/site-search";
import { getSiteSearchDocuments } from "@/lib/site-search-index";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function siteSearchMetadata(market: MarketCode): Metadata {
  return {
    title: `Seite durchsuchen${marketTitleSuffix(market)}`,
    description: "Durchsuche Magazin, Tattoo-Lexikon, Stadtseiten und Studio-Guides von Dich mit Stich.",
    alternates: { canonical: publicUrl(market, ABOUT_SEARCH_PATH) },
    robots: { index: false, follow: true },
  };
}

const SUGGESTIONS = ["Berlin", "Tribal", "Septum", "Mandala", "Tattoo-Studio"];

export async function SiteSearchPage({ market, searchParams }: { market: MarketCode; searchParams: SearchParams }) {
  const query = cleanSearchQuery((await searchParams).q);
  const results = query ? searchDocuments(await getSiteSearchDocuments(market), query) : [];

  return (
    <SiteFrame market={market} sectionLive>
      <main className="shell about-shell site-search-shell">
        <MagazineBreadcrumb
          market={market}
          trail={[
            { name: "Startseite", pathname: "/" },
            { name: "Über uns", pathname: "/ueber-uns" },
            { name: "Suche", pathname: ABOUT_SEARCH_PATH },
          ]}
        />

        <header className="panel-card site-search-hero">
          <span className="eyebrow">Suche</span>
          <h1>Seite durchsuchen</h1>
          <p>Finde Artikel aus dem Magazin, Einträge im Tattoo-Lexikon, Stadtseiten und Studio-Guides.</p>
          <SiteSearchForm market={market} defaultValue={query} autoFocus={!query} />
        </header>

        <section className="content-section site-search-results" aria-live="polite" aria-labelledby="site-search-status">
          {!query ? (
            <div className="site-search-empty">
              <h2 id="site-search-status">Wonach suchst du?</h2>
              <p>Gib ein Motiv, eine Piercingart, eine Stadt oder ein Thema ein. Zum Beispiel:</p>
              <ul className="site-search-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <MarketLink targetMarket={market} pathname={`${ABOUT_SEARCH_PATH}?q=${encodeURIComponent(suggestion)}`}>
                      {suggestion}
                    </MarketLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="site-search-empty">
              <h2 id="site-search-status">Keine Treffer für „{query}“</h2>
              <p>
                Probier es mit einem anderen oder kürzeren Begriff, zum Beispiel nur mit dem Motiv oder dem Städtenamen.
                Einen Überblick findest du auch im Magazin und in der Städteübersicht.
              </p>
              <div className="button-row">
                <MarketLink className="button button-secondary" targetMarket={market} pathname={market === "de" ? "/magazin" : "/tattoo-studios"}>
                  {market === "de" ? "Zum Magazin" : "Zu den Tattoo-Studios"}
                </MarketLink>
                <MarketLink className="button button-secondary" targetMarket={market} pathname="/tattoo-singles">Zu den Städten</MarketLink>
              </div>
            </div>
          ) : (
            <>
              <h2 id="site-search-status" className="site-search-count">
                {results.length === SEARCH_RESULT_LIMIT ? `Die ${SEARCH_RESULT_LIMIT} besten Treffer` : `${results.length} Treffer`} für „{query}“
              </h2>
              <ol className="site-search-list">
                {results.map((result) => (
                  <li key={`${result.pathname}|${result.title}`}>
                    <MarketLink className="site-search-card" targetMarket={market} pathname={result.pathname}>
                      <span className="eyebrow">{result.area}</span>
                      <h3>{result.title}</h3>
                      {result.excerpt ? <p>{result.excerpt}</p> : null}
                    </MarketLink>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </main>
    </SiteFrame>
  );
}
