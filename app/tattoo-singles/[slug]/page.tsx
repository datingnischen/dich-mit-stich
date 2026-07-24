import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTattooCityPage, tattooCitySlugs } from "@/lib/tattoo-singles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
  const cityPage = await getTattooCityPage(slug);
  if (!cityPage) notFound();

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-city">
        <span className="eyebrow">Tattoo-Singles Stadtseite</span>
        <h1>{cityPage.h1}</h1>
        <p>{cityPage.metaDescription}</p>
        <div className="button-row">
          <Link className="button button-primary" href={cityPage.registrationUrl}>
            Kostenlos registrieren
          </Link>
          <Link className="button button-secondary" href="/tattoo-singles">
            Alle Städte ansehen
          </Link>
        </div>
      </section>

      <section className="content-section">
        <div className="panel-card sticky-cta-card">
          <span className="eyebrow">Dating-Einstieg</span>
          <h2>{cityPage.heroTitle}</h2>
          <p>
            Diese Stadtseite wird live aus dem bestehenden öffentlichen Bereich übernommen und in den neuen
            Vercel-Stack gezogen. Der Registrierungsflow bleibt dabei direkt erreichbar.
          </p>
          <Link className="button button-primary" href={cityPage.registrationUrl}>
            Zur Registrierung
          </Link>
        </div>
      </section>

      <section className="rich-content">
        <div dangerouslySetInnerHTML={{ __html: cityPage.contentHtml }} />
      </section>

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
