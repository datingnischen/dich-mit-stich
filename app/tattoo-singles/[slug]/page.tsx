import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CitySceneGuide } from "@/components/city-scene-guide";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { IconySinglesWidget } from "@/components/icony-singles-widget";
import { MagazineDatingCta } from "@/components/magazine-dating-cta";
import { conversionUrl } from "@/lib/conversion-links";
import { getDatingExpertProfile } from "@/lib/expert-profile";
import { getIconyCityWidgetConfig } from "@/lib/icony-city-widgets";
import { publicUrl } from "@/lib/markets";
import { getWordPressCityOverview, getWordPressCityPage, getWordPressCitySlugs } from "@/lib/wordpress-cities";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getWordPressCitySlugs("de")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityPage = await getWordPressCityPage("de", slug);
  if (!cityPage) return {};

  return {
    title: cityPage.title,
    description: cityPage.metaDescription,
    alternates: { canonical: publicUrl("de", `/tattoo-singles/${slug}`) },
  };
}

export default async function TattooSinglesCityPage({ params }: PageProps) {
  const { slug } = await params;
  const [cityPage, expert, overview] = await Promise.all([
    getWordPressCityPage("de", slug),
    getDatingExpertProfile(),
    getWordPressCityOverview("de"),
  ]);
  if (!cityPage) notFound();

  const cityName = cityPage.cityName;
  const widgetConfig = getIconyCityWidgetConfig("de", slug);
  const registrationUrl = conversionUrl(publicUrl("de"), "/registration/", "location");

  return (
    <main className="shell shell-narrow">
      <section className="home-stage city-stage panel-card">
        <div className="home-stage-copy">
          <span className="eyebrow eyebrow-brand">Tattoo-Singles in {cityName}</span>
          <h1>{cityPage.h1}</h1>
          <p>{cityPage.metaDescription}</p>
          <ul className="trust-points" aria-label="Vorteile für Tattoo-Singles in der Stadt">
            <li>Schneller Einstieg für Singles aus {cityName} und Umgebung</li>
            <li>Szene-naher Ton statt generischer Dating-Floskeln</li>
            <li>Direkter Weg zur kostenlosen Registrierung</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={registrationUrl}>
              Kostenlos registrieren
            </a>
            <Link className="button button-secondary" href="/tattoo-singles">
              Alle Städte ansehen
            </Link>
          </div>
        </div>

        <div className="home-stage-visual city-stage-visual" data-city-hero-layout="stacked">
          {cityPage.imageUrl ? (
            <div className="home-stage-picture">
              <Image
                src={cityPage.imageUrl}
                alt={`Stadtansicht von ${cityName} für Dich mit Stich`}
                width={1200}
                height={675}
                sizes="(max-width: 900px) 100vw, 50vw"
                priority
              />
            </div>
          ) : null}
          <div className="floating-entry-card city-entry-card">
            <span className="eyebrow">Dating-Einstieg</span>
            <h2>{cityPage.heroTitle}</h2>
            <p>
              Entdecke neue Singles aus {cityName} und der Umgebung, die deinen Stil teilen und Lust auf echte
              Kontakte haben. Starte kostenlos und schau dir an, wer in deiner Region gerade aktiv ist.
            </p>
            <a className="button button-primary" href={registrationUrl}>
              Jetzt kostenlos starten
            </a>
          </div>
        </div>
      </section>

      {widgetConfig ? (
        <IconySinglesWidget
          market="de"
          cityName={cityName}
          projectKey={widgetConfig.projectKey}
          postalCode={widgetConfig.postalCode}
          />
      ) : null}

      <CitySceneGuide
        market="de"
        slug={slug}
        cityName={cityName}
        html={cityPage.contentHtml}
        cities={overview.cityLinks}
      />

      {cityPage.imageAttribution ? (
        <section
          className="content-section"
          aria-label="Bildquelle des Stadtfotos"
          data-image-attribution-version="licensed-v1"
        >
          <p>
            <strong>Bildquelle</strong>: {cityPage.imageAttribution.label}.{" "}
            {cityPage.imageAttribution.sourceUrl ? (
              <a href={cityPage.imageAttribution.sourceUrl} rel="license noreferrer" target="_blank">
                Originalquelle
              </a>
            ) : null}
            {cityPage.imageAttribution.licenseLabel && cityPage.imageAttribution.licenseUrl ? (
              <>
                {" · "}
                <a href={cityPage.imageAttribution.licenseUrl} rel="license noreferrer" target="_blank">
                  {cityPage.imageAttribution.licenseLabel}
                </a>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <MagazineDatingCta market="de" cityName={cityName} />

      {expert ? (
        <section className="content-section">
          <ExpertTrustCard
            profile={expert}
            aid="location"
            variant="compact"
            eyebrow={`Tipps für ${cityName} geprüft von`}
          />
        </section>
      ) : null}
    </main>
  );
}
