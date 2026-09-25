import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CitySearchFallback } from "@/components/city-search-fallback";
import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { conversionUrl } from "@/lib/conversion-links";
import { marketLanguageAlternates, publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";

export const revalidate = 300;

const FLIRTRADAR_IMAGE = staticAsset("/brand/flirtradar-umkreissuche.svg");

export const metadata: Metadata = {
  title: "Tattoo-Singles in Deutschland – Singles nach Stadt",
  description:
    "Finde tätowierte und gepiercte Singles in deiner Stadt: Stadtseiten von Berlin bis München, Flirtradar mit Umkreissuche und kostenloser Einstieg.",
  alternates: { canonical: publicUrl("de", "/tattoo-singles"), languages: marketLanguageAlternates("/tattoo-singles") },
};

export default async function TattooSinglesOverviewPage() {
  const [overview, atOverview, chOverview] = await Promise.all([
    getWordPressCityOverview("de"),
    getWordPressCityOverview("at"),
    getWordPressCityOverview("ch"),
  ]);
  const registrationUrl = conversionUrl(publicUrl("de"), "/registration/", "location");

  return (
    <main className="shell studio-guide-shell singles-overview">
      <section className="home-radar-section panel-card singles-overview-hero">
        <div className="home-radar-copy">
          <span className="eyebrow eyebrow-brand">Tattoo-Singles · Deutschland</span>
          <h1>{overview.title}</h1>
          <p>
            Tätowierte und gepiercte Singles gibt es überall – die Frage ist nur, wer in deiner Nähe wohnt. Wähle deine
            Stadt oder lass dir mit dem Flirtradar zeigen, wer deinen Stil teilt und nur wenige Kilometer entfernt ist.
          </p>
          <ul className="trust-points" aria-label="Vorteile für Tattoo-Singles">
            <li>{overview.cityLinks.length} Stadtseiten von Berlin bis München</li>
            <li>Umkreissuche nach Entfernung statt endlosem Wischen</li>
            <li>Kostenlos registrieren und in Ruhe umsehen</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={registrationUrl}>
              Kostenlos registrieren
            </a>
            <a className="button button-secondary" href="#staedte">
              Stadt wählen
            </a>
          </div>
        </div>

        <div className="home-radar-visual">
          <a className="home-radar-frame" href={registrationUrl}>
            <Image
              src={FLIRTRADAR_IMAGE}
              alt="Flirtradar mit Umkreissuche für Tattoo-Singles in Deutschland"
              width={320}
              height={480}
              sizes="(max-width: 900px) 80vw, 340px"
              unoptimized
              priority
            />
          </a>
        </div>
      </section>

      <nav className="content-section studio-guide-country-strip" aria-label="Tattoo-Singles nach Land">
        <MarketLink className="studio-guide-country-link" targetMarket="de" pathname="/tattoo-singles"><strong>Deutschland</strong><span>{overview.cityLinks.length} Städte</span></MarketLink>
        <MarketLink className="studio-guide-country-link" targetMarket="at" pathname="/tattoo-singles"><strong>Österreich</strong><span>{atOverview.cityLinks.length} Städte</span></MarketLink>
        <MarketLink className="studio-guide-country-link" targetMarket="ch" pathname="/tattoo-singles"><strong>Schweiz</strong><span>{chOverview.cityLinks.length} Städte</span></MarketLink>
      </nav>

      <section className="content-section singles-overview-cities" id="staedte" aria-labelledby="staedte-heading">
        <div className="section-header studio-guide-section-header">
          <span className="eyebrow">Stadtseiten</span>
          <h2 id="staedte-heading">Tattoo-Singles in deiner Stadt</h2>
          <p>
            Jede Stadtseite zeigt dir neue Singles aus der Region, Szene-Tipps und Tattoo-Studios vor Ort. Deine Stadt ist
            nicht dabei? Mit der individuellen Suche findest du trotzdem Singles in deiner Nähe.
          </p>
        </div>
        <div className="studio-city-grid">
          {overview.cityLinks.map((city) => (
            <Link key={city.slug} href={`/tattoo-singles/${city.slug}/`} className="studio-city-card">
              {city.imageUrl ? (
                <span className="studio-city-card-media">
                  <Image
                    src={staticAsset(city.imageUrl)}
                    alt={`Stadtansicht von ${city.label}`}
                    width={420}
                    height={280}
                    sizes="(max-width: 640px) 120px, 180px"
                  />
                </span>
              ) : null}
              <span className="studio-city-card-copy">
                <span>{city.region || "Deutschland"}</span>
                <span className="studio-city-card-title"><LocationPinIcon /><strong>{city.label}</strong></span>
                <small>Neue Singles, Szene-Tipps und Studios vor Ort</small>
                <b>Singles in {city.label} entdecken →</b>
              </span>
            </Link>
          ))}
        </div>
        <CitySearchFallback market="de" />
      </section>

      <section className="content-section studio-guide-principles" aria-labelledby="so-gehts-heading">
        <div className="section-header">
          <span className="eyebrow">So geht&apos;s</span>
          <h2 id="so-gehts-heading">In drei Schritten zu Singles mit Tinte</h2>
        </div>
        <div className="studio-principle-grid">
          <article><span>01</span><h3>Stadt wählen</h3><p>Öffne deine Stadtseite und schau dir an, wer aus deiner Region gerade neu dabei ist.</p></article>
          <article><span>02</span><h3>Kostenlos registrieren</h3><p>Profil anlegen, Fotos von deinen Tattoos und Piercings zeigen und in Ruhe umsehen.</p></article>
          <article><span>03</span><h3>Im Umkreis flirten</h3><p>Mit dem Flirtradar legst du den Suchradius selbst fest und findest Singles, die wirklich erreichbar sind.</p></article>
        </div>
        <p className="singles-overview-crosslink">
          Auf der Suche nach dem passenden Studio für dein nächstes Motiv? Im <Link href="/tattoo-studios/">Tattoo-Studio-Guide</Link>{" "}
          findest du Stadtguides mit Tipps zu Stil, Portfolio und Hygiene.
        </p>
      </section>
    </main>
  );
}
