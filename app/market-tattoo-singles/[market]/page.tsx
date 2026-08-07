import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MarketLink } from "@/components/market-link";
import { type MarketCode, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";

export const dynamic = "force-static";

type PageProps = { params: Promise<{ market: string }> };

const AT_OVERVIEW_HERO = {
  eyebrow: "Österreichische Tattoo-Szene",
  title: "Tattoo Singles Österreich",
  description: "Finde jetzt tätowierte Singles aus Österreich und entdecke als Erstes unsere Städte- und Szenenübersicht.",
  sectionTitle: "Tattoo-Singles in Österreich",
  sectionLead: "Wähle deine Stadt und öffne direkt den passenden Tattoo-Singles-Guide mit Bild, Szene-Tipps und lokalem Einstieg.",
  registrationUrl: publicUrl("at", "/registration/"),
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
      description: AT_OVERVIEW_HERO.description,
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

function AtOverviewSection({ overview }: Awaited<ReturnType<typeof getWordPressCityOverview>> extends infer T ? { overview: T } : never) {
  return (
    <>
      <section className="hero-card hero-city">
        <span className="eyebrow">{AT_OVERVIEW_HERO.eyebrow}</span>
        <h1>{AT_OVERVIEW_HERO.title}</h1>
        <p>{AT_OVERVIEW_HERO.description}</p>
        <figure className="market-overview-asset" data-market-overview-asset={AT_OVERVIEW_HERO.image.assetKey}>
          <Image
            src={staticAsset(AT_OVERVIEW_HERO.image.path)}
            alt={AT_OVERVIEW_HERO.image.alt}
            width={AT_OVERVIEW_HERO.image.width}
            height={AT_OVERVIEW_HERO.image.height}
            priority
            sizes="(max-width: 760px) 100vw, 980px"
          />
          <AttributionCaption sourceUrl={AT_OVERVIEW_HERO.image.sourceUrl} />
        </figure>
        <div className="button-row">
          <a className="button button-primary" href={AT_OVERVIEW_HERO.registrationUrl}>
            Kostenlos registrieren
          </a>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Verfügbare Städte</span>
          <h2>{AT_OVERVIEW_HERO.sectionTitle}</h2>
          <p>{AT_OVERVIEW_HERO.sectionLead}</p>
        </div>
        <div className="city-grid">
          {overview.cityLinks.map((city) => (
            <MarketLink
              key={city.slug}
              targetMarket="at"
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

  const overview = await getWordPressCityOverview(market);

  return <main className="shell shell-narrow">{market === "at" ? <AtOverviewSection overview={overview} /> : <ChOverviewSection overview={overview} />}</main>;
}
