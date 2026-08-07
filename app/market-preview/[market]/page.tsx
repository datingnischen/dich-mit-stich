import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { getMarket, isMarketCode, publicUrl, type MarketCode } from "@/lib/markets";

const AT_IMPORTANT_CITY_LINKS = [
  { slug: "wien", label: "Wien" },
  { slug: "graz", label: "Graz" },
  { slug: "salzburg", label: "Salzburg" },
  { slug: "linz", label: "Linz" },
  { slug: "klagenfurt", label: "Klagenfurt" },
  { slug: "villach", label: "Villach" },
  { slug: "wels", label: "Wels" },
  { slug: "sankt-poelten", label: "Sankt Pölten" },
  { slug: "wiener-neustadt", label: "Wiener Neustadt" },
  { slug: "dornbirn", label: "Dornbirn" },
] as const;

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ market: string }>;
};

function unavailableMarket(value: string): MarketCode {
  if (!isMarketCode(value) || value === "de") notFound();
  return value;
}

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const market = unavailableMarket((await params).market);
  const config = getMarket(market);

  return {
    title: `Dich mit Stich ${config.countryName}`,
    description: `Der eigene Dich-mit-Stich-Bereich für ${config.countryName} wird vorbereitet.`,
    alternates: { canonical: publicUrl(market) },
    robots: { index: false, follow: false },
  };
}

export default async function MarketPreviewPage({ params }: PageProps) {
  const market = unavailableMarket((await params).market);
  const config = getMarket(market);
  const showAustriaLinks = market === "at";

  return (
    <SiteFrame market={market}>
      <main className="shell shell-narrow">
        <section className="hero-card hero-magazine hero-magazine-editorial">
          <span className="eyebrow">Dich mit Stich {config.countryName}</span>
          <h1>{showAustriaLinks ? "Wichtige Einstiege für Österreich" : "Dieser Länderbereich wird gerade vorbereitet."}</h1>
          <p>
            {showAustriaLinks
              ? "Starte direkt in die Österreich-Übersicht, zur Registrierung oder in die wichtigsten Stadtseiten für Tattoo-Singles."
              : <>Inhalte, Städte und Registrierungswege werden erst veröffentlicht, wenn sie eindeutig {config.countryName} zugeordnet und vollständig geprüft sind. So erscheinen hier keine deutschen Inhalte oder Städte im falschen Markt.</>}
          </p>
          <div className="button-row" aria-label={showAustriaLinks ? "Wichtige Österreich-Einstiege" : "Verfügbare Ländervorschauen"}>
            {showAustriaLinks ? (
              <>
                <a className="button button-primary" href={publicUrl(market, "/tattoo-singles")}>Tattoo-Singles Österreich</a>
                <a className="button button-secondary" href={publicUrl(market, "/registration/")}>Kostenlos registrieren</a>
              </>
            ) : (
              <>
                <MarketLink className="button button-secondary" targetMarket="de">
                  Deutschland ansehen
                </MarketLink>
                <MarketLink className="button button-secondary" targetMarket="at">
                  Österreich
                </MarketLink>
                <MarketLink className="button button-secondary" targetMarket="ch">
                  Schweiz
                </MarketLink>
              </>
            )}
          </div>
          {showAustriaLinks ? (
            <div className="topic-card-grid" aria-label="Wichtige Stadtseiten in Österreich">
              {AT_IMPORTANT_CITY_LINKS.map((city) => (
                <article className="topic-card" key={city.slug}>
                  <h2>{city.label}</h2>
                  <p>Direkt zur Stadtseite für Tattoo-Singles in {city.label}.</p>
                  <MarketLink className="button button-secondary" targetMarket={market} pathname={`/tattoo-singles/${city.slug}`}>
                    {city.label} ansehen
                  </MarketLink>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </SiteFrame>
  );
}
