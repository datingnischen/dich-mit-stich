import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { getWordPressCityPage, getWordPressCitySlugs } from "@/lib/wordpress-cities";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ market: string; slug: string }>;
};

export async function generateStaticParams() {
  return (await getWordPressCitySlugs("ch")).map((slug) => ({ market: "ch", slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (market !== "ch") return { robots: { index: false, follow: false } };
  const city = await getWordPressCityPage("ch", slug);
  if (!city) return { robots: { index: false, follow: false } };

  return {
    title: city.title,
    description: city.metaDescription,
    alternates: { canonical: publicUrl("ch", `/tattoo-singles/${slug}`) },
  };
}

export default async function ChTattooSinglesCityPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (market !== "ch") notFound();
  const city = await getWordPressCityPage("ch", slug);
  if (!city) notFound();

  return (
    <main className="shell shell-narrow">
      <section className="home-stage city-stage panel-card">
        <div className="home-stage-copy">
          <span className="eyebrow eyebrow-brand">Tattoo-Singles in {city.cityName}</span>
          <h1>{city.h1}</h1>
          <p>{city.metaDescription}</p>
          <ul className="trust-points" aria-label={`Vorteile für Tattoo-Singles in ${city.cityName}`}>
            <li>Schneller Einstieg für Singles aus {city.cityName} und Umgebung</li>
            <li>Schweizer Stadt-Guide für Tattoo-, Piercing- und Alternative-Szene</li>
            <li>Direkter Weg zur kostenlosen Registrierung</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={city.registrationUrl}>Kostenlos registrieren</a>
            <MarketLink className="button button-secondary" targetMarket="ch" pathname="/tattoo-singles">
              Alle Schweizer Städte
            </MarketLink>
          </div>
        </div>

        <div className="home-stage-visual city-stage-visual">
          <div className="home-stage-picture">
            <Image
              src={staticAsset(city.imageUrl)}
              alt={city.imageAlt}
              width={1000}
              height={667}
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="floating-entry-card city-entry-card">
            <span className="eyebrow">Dating-Einstieg Schweiz</span>
            <h2>{city.heroTitle}</h2>
            <p>Entdecke tätowierte und gepiercte Singles aus {city.cityName} und der Umgebung.</p>
            <a className="button button-primary" href={city.registrationUrl}>Jetzt kostenlos starten</a>
          </div>
        </div>
      </section>

      <MarketHtmlContent className="rich-content" market="ch" html={city.contentHtml} />

      <section className="content-section" aria-label="Bildquelle des Stadtfotos">
        <p>
          <strong>Bildquelle</strong>: {city.imageAttribution.label}.{" "}
          {city.imageAttribution.sourceUrl ? (
            <a href={city.imageAttribution.sourceUrl} rel="license noreferrer" target="_blank">Originalquelle</a>
          ) : null}
        </p>
      </section>
    </main>
  );
}
