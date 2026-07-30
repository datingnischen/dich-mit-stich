import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { getDatingExpertProfile } from "@/lib/expert-profile";
import { staticAsset } from "@/lib/static-asset";
import { getTattooCityPage, tattooCitySlugs } from "@/lib/tattoo-singles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const HOME_HERO_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");

export const revalidate = 300;

export async function generateStaticParams() {
  return tattooCitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityPage = await getTattooCityPage(slug);
  if (!cityPage) return {};

  return {
    title: cityPage.title,
    description: cityPage.metaDescription,
  };
}

export default async function TattooSinglesCityPage({ params }: PageProps) {
  const { slug } = await params;
  const [cityPage, expert] = await Promise.all([getTattooCityPage(slug), getDatingExpertProfile()]);
  if (!cityPage) notFound();

  const cityName = cityPage.h1.replace(/^Tattoo-Singles in\s+/i, "").replace(/:.*$/, "").trim();

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

        <div className="home-stage-visual city-stage-visual">
          <div className="home-stage-picture">
            <img src={HOME_HERO_IMAGE} alt={`Szene-Dating Einstieg für ${cityName}`} loading="eager" decoding="async" />
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
