import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { getDatingExpertProfile } from "@/lib/expert-profile";
import { publicUrl } from "@/lib/markets";
import { getWordPressCityPage, getWordPressCitySlugs } from "@/lib/wordpress-cities";

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
  const [cityPage, expert] = await Promise.all([getWordPressCityPage("de", slug), getDatingExpertProfile()]);
  if (!cityPage) notFound();

  const cityName = cityPage.cityName;

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
            <Link className="button button-primary" href={cityPage.registrationUrl}>
              Kostenlos registrieren
            </Link>
            <Link className="button button-secondary" href="/tattoo-singles">
              Alle Städte ansehen
            </Link>
          </div>
        </div>

        <div className="home-stage-visual city-stage-visual" data-city-hero-layout="stacked">
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
          <div className="floating-entry-card city-entry-card">
            <span className="eyebrow">Dating-Einstieg</span>
            <h2>{cityPage.heroTitle}</h2>
            <p>
              Entdecke neue Singles aus {cityName} und der Umgebung, die deinen Stil teilen und Lust auf echte
              Kontakte haben. Starte kostenlos und schau dir an, wer in deiner Region gerade aktiv ist.
            </p>
            <Link className="button button-primary" href={cityPage.registrationUrl}>
              Jetzt kostenlos starten
            </Link>
          </div>
        </div>
      </section>

      <section className="rich-content">
        <div dangerouslySetInnerHTML={{ __html: cityPage.contentHtml }} />
      </section>

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

      {expert ? (
        <section className="content-section">
          <ExpertTrustCard
            profile={expert}
            eyebrow="Begleitet von unserem Datingexperten"
            title={`Die Stadtseite für ${cityName} lehnt sich an den echten Dich-mit-Stich-Stil an und bleibt redaktionell begleitet.`}
          />
        </section>
      ) : null}

      {cityPage.relatedCities.length ? (
        <section className="content-section">
          <div className="section-header">
            <span className="eyebrow">Weitere Städte</span>
            <h2>Ähnliche Städte für tätowierte und gepiercte Singles</h2>
          </div>
          <div className="chip-row">
            {cityPage.relatedCities.map((city) => (
              <Link key={city.slug} className="chip" href={`/tattoo-singles/${city.slug}`}>
                {city.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
