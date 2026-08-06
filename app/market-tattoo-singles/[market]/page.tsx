import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChTattooSinglesOverview } from "@/lib/ch-tattoo-singles";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tattoo Singles aus der Schweiz",
  description: "Finde dein Perfect Tattoo Match in der Schweiz. Wir verbinden tätowierte Singles.",
  alternates: { canonical: publicUrl("ch", "/tattoo-singles") },
};

type PageProps = { params: Promise<{ market: string }> };

export function generateStaticParams() {
  return [{ market: "ch" }];
}

export default async function ChTattooSinglesOverviewPage({ params }: PageProps) {
  if ((await params).market !== "ch") notFound();
  const overview = getChTattooSinglesOverview();

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-city">
        <span className="eyebrow">Schweizer Städte &amp; Szene</span>
        <h1>{overview.title}</h1>
        <p>{overview.description}</p>
        <div className="button-row">
          <a className="button button-primary" href={publicUrl("ch", "/registration/")}>Kostenlos registrieren</a>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Verfügbare Städte</span>
          <h2>Tattoo-Singles in der Schweiz</h2>
        </div>
        <div className="city-grid">
          {overview.cityLinks.map((city) => (
            <Link key={city.slug} href={`/tattoo-singles/${city.slug}`} className="city-card city-card-with-media">
              <div className="city-card-media">
                <Image
                  src={staticAsset(city.imageUrl)}
                  alt={`Tattoo-Singles in ${city.label}`}
                  width={1000}
                  height={667}
                  sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
              </div>
              <div className="city-card-copy">
                <span>{city.label}</span>
                <strong>Jetzt Stadt-Guide öffnen</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
