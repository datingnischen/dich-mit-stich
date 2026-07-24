import Link from "next/link";
import { getTattooSinglesOverview } from "@/lib/tattoo-singles";

export const revalidate = 300;

export default async function TattooSinglesOverviewPage() {
  const overview = await getTattooSinglesOverview();

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
            <Link key={city.slug} href={`/tattoo-singles/${city.slug}`} className="city-card">
              <span>{city.label}</span>
              <strong>Jetzt Stadt-Guide öffnen</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
