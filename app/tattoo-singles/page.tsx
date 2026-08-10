import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/markets";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: publicUrl("de", "/tattoo-singles") },
};

export default async function TattooSinglesOverviewPage() {
  const overview = await getWordPressCityOverview("de");

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-city">
        <span className="eyebrow">Städte & Szene</span>
        <h1>{overview.title}</h1>
        <p>{overview.description}</p>
        <div className="button-row">
          <Link className="button button-primary" href="/registration/">
            Kostenlos registrieren
          </Link>
          <Link className="button button-secondary" href="/magazin">
            Magazin ansehen
          </Link>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Verfügbare Städte</span>
          <h2>Tattoo-Singles in deiner Stadt</h2>
        </div>
        <div className="city-grid">
          {overview.cityLinks.map((city) => (
            <Link key={city.slug} href={`/tattoo-singles/${city.slug}`} className="city-card city-card-with-media">
              {city.imageUrl ? (
                <div className="city-card-media">
                  <Image
                    src={city.imageUrl}
                    alt={`Tattoo-Singles in ${city.label}`}
                    width={1200}
                    height={675}
                    sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                </div>
              ) : null}
              <div className="city-card-copy">
                <strong>{city.label}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
