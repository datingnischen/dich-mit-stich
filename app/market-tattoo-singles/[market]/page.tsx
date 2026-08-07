import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MarketLink } from "@/components/market-link";
import { type MarketCode, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";

export const dynamic = "force-static";

type PageProps = { params: Promise<{ market: string }> };

type AtOverview = {
  market: "at";
  eyebrow: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionLead: string;
  registrationUrl: string;
  cityLabels: string[];
  image: {
    path: string;
    alt: string;
    width: number;
    height: number;
    assetKey: string;
    sourceUrl: string;
  };
};

const atOverview: AtOverview = {
  market: "at",
  eyebrow: "Österreichische Tattoo-Szene",
  title: "Tattoo Singles Österreich",
  description: "Finde jetzt tätowierte Singles aus Österreich und entdecke als Erstes unsere Städte- und Szenenübersicht.",
  sectionTitle: "Tattoo-Singles in Österreich",
  sectionLead: "Diese Städte stammen aus der bisherigen Österreich-Übersicht und werden als Nächstes Schritt für Schritt als eigene Guides aufbereitet.",
  registrationUrl: publicUrl("at", "/registration/"),
  cityLabels: [
    "Wien",
    "Linz",
    "Dornbirn",
    "Graz",
    "Salzburg",
    "Klagenfurt",
    "Villach",
    "Wels",
    "Sankt Pölten",
    "Wiener Neustadt",
  ],
  image: {
    path: "/images/at/dich-mit-stich-at-overview-hero.webp",
    alt: "Finde jetzt tätowierte Singles aus Österreich",
    width: 1170,
    height: 659,
    assetKey: "legacy-icony-at-home-hero",
    sourceUrl:
      "https://static2.icony-hosting.de/dyncontentbf91b1bc561a9d20d467d3270352d3e5/img/generic2021/frontpage-v4/backgrounds/frontpage-visual-dichmitstich.webp",
  },
};

function isSupportedMarket(value: string): value is MarketCode {
  return value === "at" || value === "ch";
}

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const market = (await params).market;

  if (!isSupportedMarket(market)) {
    notFound();
  }

  if (market === "at") {
    return {
      title: "Tattoo Singles aus Österreich",
      description: atOverview.description,
      alternates: { canonical: publicUrl("at", "/tattoo-singles") },
    };
  }

  return {
    title: "Tattoo Singles aus der Schweiz",
    description: "Finde dein Perfect Tattoo Match in der Schweiz. Wir verbinden tätowierte Singles.",
    alternates: { canonical: publicUrl("ch", "/tattoo-singles") },
  };
}

function AttributionCaption({ sourceUrl }: { sourceUrl: string }) {
  return (
    <figcaption>
      <strong>Bild:</strong> Dich mit Stich. Für das Dich-mit-Stich-Projektportfolio freigegeben.{" "}
      <a href={sourceUrl} rel="noreferrer">
        Originaldatei
      </a>
    </figcaption>
  );
}

function AtOverviewSection() {
  return (
    <>
      <section className="hero-card hero-city">
        <span className="eyebrow">{atOverview.eyebrow}</span>
        <h1>{atOverview.title}</h1>
        <p>{atOverview.description}</p>
        <figure className="market-overview-asset" data-market-overview-asset={atOverview.image.assetKey}>
          <Image
            src={staticAsset(atOverview.image.path)}
            alt={atOverview.image.alt}
            width={atOverview.image.width}
            height={atOverview.image.height}
            priority
            sizes="(max-width: 760px) 100vw, 980px"
          />
          <AttributionCaption sourceUrl={atOverview.image.sourceUrl} />
        </figure>
        <div className="button-row">
          <a className="button button-primary" href={atOverview.registrationUrl}>
            Kostenlos registrieren
          </a>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Verfügbare Städte</span>
          <h2>{atOverview.sectionTitle}</h2>
          <p>{atOverview.sectionLead}</p>
        </div>
        <div className="city-grid">
          {atOverview.cityLabels.map((city) => (
            <article key={city} className="city-card">
              <span>{city}</span>
              <strong>Stadt-Guide folgt</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ChOverviewSection({ overview }: Awaited<ReturnType<typeof getWordPressCityOverview>> extends infer T ? { overview: T } : never) {
  return (
    <>
      <section className="hero-card hero-city">
        <span className="eyebrow">Schweizer Städte &amp; Szene</span>
        <h1>{overview.title}</h1>
        <p>{overview.description}</p>
        <figure className="market-overview-asset" data-market-overview-asset="legacy-icony-3506">
          <Image
            src={staticAsset("/images/ch/dich-mit-stich-ch-partnersuche.jpg")}
            alt="Tattoo-Singles nach Region in der Schweiz"
            width={1000}
            height={563}
            priority
            sizes="(max-width: 760px) 100vw, 980px"
          />
          <AttributionCaption sourceUrl="https://static-cms.icony-hosting.de/cms/639CB037D8430757BEE61CDBFF2A243E7794CCCBA1E5242CB0B73A56AB076DB4/1000/dich-mit-stich-ch-partnersuche.jpg" />
        </figure>
        <div className="button-row">
          <a className="button button-primary" href={publicUrl("ch", "/registration/")}>
            Kostenlos registrieren
          </a>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Verfügbare Städte</span>
          <h2>Tattoo-Singles in der Schweiz</h2>
        </div>
        <div className="city-grid">
          {overview.cityLinks.map((city) => (
            <MarketLink
              key={city.slug}
              targetMarket="ch"
              pathname={`/tattoo-singles/${city.slug}`}
              className="city-card city-card-with-media"
            >
              {city.imageUrl ? (
                <div className="city-card-media">
                  <Image
                    src={staticAsset(city.imageUrl)}
                    alt={`Tattoo-Singles in ${city.label}`}
                    width={1000}
                    height={667}
                    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                </div>
              ) : null}
              <div className="city-card-copy">
                <span>{city.label}</span>
                <strong>Jetzt Stadt-Guide öffnen</strong>
              </div>
            </MarketLink>
          ))}
        </div>
      </section>
    </>
  );
}

export default async function MarketTattooSinglesOverviewPage({ params }: PageProps) {
  const market = (await params).market;

  if (!isSupportedMarket(market)) {
    notFound();
  }

  const overview = market === "ch" ? await getWordPressCityOverview("ch") : null;

  return <main className="shell shell-narrow">{market === "at" ? <AtOverviewSection /> : <ChOverviewSection overview={overview!} />}</main>;
}
