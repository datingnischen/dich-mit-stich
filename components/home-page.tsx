import Image from "next/image";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { MagazineTeaser } from "@/components/magazine-teaser";
import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { conversionUrl } from "@/lib/conversion-links";
import { getDatingExpertProfile } from "@/lib/expert-profile";
import { getMarketMagazineCatalog } from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { getWordPressCityOverview } from "@/lib/wordpress-cities";
import { staticAsset } from "@/lib/static-asset";
import { formatGermanDate } from "@/lib/wordpress";
import { getTattooSinglesOverview } from "@/lib/tattoo-singles";

const HOME_HERO_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");
const FLIRTRADAR_IMAGE = staticAsset("/brand/flirtradar-umkreissuche.png");

const HOME_MARKET_COPY = {
  de: { exampleCitySlug: "bremen", range: "Von Berlin bis München", country: "Deutschland", countryTitle: "Städte in Deutschland" },
  at: { exampleCitySlug: "wien", range: "Von Wien bis Graz", country: "Österreich", countryTitle: "Städte in Österreich" },
  ch: { exampleCitySlug: "zuerich", range: "Von Zürich bis Basel", country: "Schweiz", countryTitle: "Städte in der Schweiz" },
} as const;

export async function HomePage({ market }: { market: MarketCode }) {
  const [overview, magazineCatalog, expert] = await Promise.all([
    market === "de" ? getTattooSinglesOverview() : getWordPressCityOverview(market),
    getMarketMagazineCatalog(market),
    getDatingExpertProfile(),
  ]);
  const { posts, pages, categories } = magazineCatalog;

  const featuredPost = posts[0];
  const magazineStarts = [...posts.slice(1, 4), ...pages.slice(0, 1)];
  const secondaryOverviews = market === "de"
    ? await Promise.all([getWordPressCityOverview("at"), getWordPressCityOverview("ch")])
    : [];
  const [atOverview, chOverview] = secondaryOverviews;
  const allCountryCityEntrypoints = [
    {
      market: "de",
      countryLabel: "Deutschland",
      title: "Städte in Deutschland",
      description: overview.description,
      href: publicUrl("de", "/tattoo-singles"),
      sampleCities: overview.cityLinks.slice(0, 4),
    },
    {
      market: "at",
      countryLabel: "Österreich",
      title: "Städte in Österreich",
      description: (market === "at" ? overview : atOverview)?.description || "",
      href: publicUrl("at", "/tattoo-singles"),
      sampleCities: (market === "at" ? overview : atOverview)?.cityLinks.slice(0, 4) || [],
    },
    {
      market: "ch",
      countryLabel: "Schweiz",
      title: "Städte in der Schweiz",
      description: (market === "ch" ? overview : chOverview)?.description || "",
      href: publicUrl("ch", "/tattoo-singles"),
      sampleCities: (market === "ch" ? overview : chOverview)?.cityLinks.slice(0, 4) || [],
    },
  ] as const;
  const countryCityEntrypoints = market === "de"
    ? allCountryCityEntrypoints
    : allCountryCityEntrypoints.filter((entry) => entry.market === market);
  const copy = HOME_MARKET_COPY[market];

  return (
    <SiteFrame market={market}>
      <main className="shell">
      <section className="home-stage panel-card">
        <div className="home-stage-copy">
          <span className="eyebrow eyebrow-brand">Tattoo-, Piercing- & Szene-Dating</span>
          <h1>Finde kostenlos tätowierte Singles und echte Szene-Connections, die zu deinem Stil passen.</h1>
          <p>
            Dich mit Stich verbindet Dating, Community und Magazin in einer klaren Oberfläche: schnell orientieren,
            passende Singles entdecken und direkt kostenlos loslegen.
          </p>
          <ul className="trust-points" aria-label="Vertrauenssignale">
            <li>Über 20 Jahre Erfahrung im Online-Dating</li>
            <li>Keine versteckten Kosten beim Einstieg</li>
            <li>Szene-Fokus statt austauschbarer Massenbörse</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={conversionUrl(publicUrl(market), "/registration/", "location")}>
              Kostenlos registrieren
            </a>
            <MarketLink className="button button-secondary" targetMarket={market} pathname="/tattoo-singles">
              Städte entdecken
            </MarketLink>
          </div>
        </div>

        <div className="home-stage-visual">
          <div className="home-stage-picture">
            <Image
              src={HOME_HERO_IMAGE}
              alt="Dich mit Stich Startseitenmotiv"
              width={1200}
              height={675}
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="floating-entry-card">
            <span className="eyebrow">Schneller Einstieg</span>
            <h2>{overview.title}</h2>
            <p>{overview.description}</p>
            <MarketLink className="button button-primary" targetMarket={market} pathname={`/tattoo-singles/${copy.exampleCitySlug}`}>
              Beispiel-Stadt ansehen
            </MarketLink>
          </div>
        </div>
      </section>

      <section className="home-radar-section panel-card">
        <div className="home-radar-copy">
          <span className="eyebrow">Flirtradar & Umkreissuche</span>
          <h2>Sieh sofort, welche Tattoo-Singles ganz in deiner Nähe online sind.</h2>
          <p>
            Genau dafür ist die Umkreissuche stark: nicht endlos wischen, sondern direkt lokal schauen,
            wer zu deinem Stil passt und nur wenige Kilometer entfernt ist.
          </p>
          <ul className="trust-points" aria-label="Vorteile der Umkreissuche">
            <li>Singles nach Entfernung statt Zufall entdecken</li>
            <li>Schneller zu echten Treffen in deiner Region kommen</li>
            <li>Ideal für Szene-Dating mit lokalem Fokus</li>
          </ul>
          <div className="button-row">
            <a className="button button-primary" href={conversionUrl(publicUrl(market), "/registration/", "location")}>
              Kostenlos anmelden
            </a>
            <MarketLink className="button button-secondary" targetMarket={market} pathname="/tattoo-singles">
              Regionen ansehen
            </MarketLink>
          </div>
        </div>

        <div className="home-radar-visual">
          <div className="home-radar-frame">
            <Image
              src={FLIRTRADAR_IMAGE}
              alt="Flirtradar mit Umkreissuche für Tattoo-Singles in der Nähe"
              width={1200}
              height={675}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Länder & Stadtseiten</span>
          <h2>{market === "de" ? "Die wichtigsten Einsprünge zu den Stadtseiten je Land" : copy.countryTitle}</h2>
          <p>{market === "de" ? "Wähle direkt Deutschland, Österreich oder die Schweiz und springe von dort in die passenden Stadtseiten." : `Entdecke die passenden Stadtseiten für ${copy.country}.`}</p>
        </div>
        <div className="home-country-entry-grid">
          {countryCityEntrypoints.map((entry) => (
            <article key={entry.market} className="city-card home-country-entry-card">
              <span className="eyebrow">{entry.countryLabel}</span>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <ul className="link-list compact-list">
                {entry.sampleCities.map((city) => (
                  <li key={`${entry.market}-${city.slug}`}>
                    <MarketLink targetMarket={entry.market} pathname={`/tattoo-singles/${city.slug}`}>{city.label}</MarketLink>
                  </li>
                ))}
              </ul>
              <div className="button-row">
                <MarketLink className="button button-secondary" targetMarket={entry.market} pathname="/tattoo-singles">
                  {entry.title} ansehen
                </MarketLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid-two">
        <article className="panel-card">
          <span className="eyebrow">Tattoo-Singles nach Stadt</span>
          <h2>Starte direkt in der passenden Region</h2>
          <p>
            {copy.range}: Die Stadtseiten zeigen dir lokale Einstiege, Szene-Bezug und direkte Wege zu
            neuen Kontakten.
          </p>
          <ul className="link-list compact-list">
            {overview.cityLinks.slice(0, 8).map((city) => (
              <li key={city.slug}>
                <MarketLink targetMarket={market} pathname={`/tattoo-singles/${city.slug}`}>{city.label}</MarketLink>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <span className="eyebrow">Magazin & Geschichten</span>
          <h2>Ratgeber, Storys und wichtige Themen für Dating mit Persönlichkeit</h2>
          <p>
            Das Magazin liefert dir Inspiration, Orientierung und konkrete Dating-Impulse — von Erfolgsstorys bis zu
            Tattoo-spezifischen Tipps.
          </p>
          <ul className="stats-list">
            <li>
              <strong>{posts.length}</strong>
              <span>aktuelle Beiträge</span>
            </li>
            <li>
              <strong>{pages.length}</strong>
              <span>wichtige Infoseiten</span>
            </li>
            <li>
              <strong>{categories.length}</strong>
              <span>Magazin-Themen</span>
            </li>
          </ul>
        </article>
      </section>

      {expert ? (
        <section className="content-section">
          <ExpertTrustCard profile={expert} market={market} />
        </section>
      ) : null}

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Beliebte Themen</span>
          <h2>Womit willst du einsteigen?</h2>
        </div>
        <div className="chip-row">
          {categories.slice(0, 6).map((category) => (
            <MarketLink key={category.slug} className="chip" targetMarket={market} pathname={`/magazin/thema/${category.slug}`}>
              {category.name}
            </MarketLink>
          ))}
        </div>
      </section>

      <section className="grid-two home-reading-grid">
        {featuredPost ? (
          <article className="panel-card home-feature-card">
            <div className="section-header home-feature-header">
              <span className="eyebrow">Gerade beliebt</span>
              <h2>{featuredPost.title}</h2>
            </div>
            <MagazineTeaser entry={featuredPost} length={220} origin={publicUrl(market)} className="home-feature-excerpt" />
            <div className="meta-row home-feature-meta">
              {featuredPost.authorName ? <span>Von {featuredPost.authorName}</span> : null}
              {featuredPost.date ? <span>{formatGermanDate(featuredPost.date)}</span> : null}
            </div>
            <div className="button-row home-feature-actions">
              <MarketLink className="button button-primary" targetMarket={market} pathname={`/magazin/${featuredPost.slug}`}>
                Artikel lesen
              </MarketLink>
            </div>
          </article>
        ) : null}

        <article className="panel-card home-more-card">
          <div className="section-header home-more-header">
            <span className="eyebrow">Mehr aus dem Magazin</span>
            <h2>Weitere lesenswerte Einstiege</h2>
          </div>
          <div className="home-more-list">
            {magazineStarts.map((entry) => (
              <MarketLink key={`${entry.type}-${entry.id}`} targetMarket={market} pathname={`/magazin/${entry.slug}`} className="home-more-link">
                <div className="meta-row home-more-meta">
                  {entry.categories[0] ? <span>{entry.categories[0].name}</span> : null}
                  {entry.date ? <span>{formatGermanDate(entry.date)}</span> : null}
                </div>
                <h3>{entry.title}</h3>
                <MagazineTeaser entry={entry} length={145} origin={publicUrl(market)} />
              </MarketLink>
            ))}
          </div>
          <div className="button-row home-more-actions">
            <MarketLink className="button button-secondary" targetMarket={market} pathname="/magazin">
              Mehr im Magazin ansehen
            </MarketLink>
          </div>
        </article>
      </section>
      </main>
    </SiteFrame>
  );
}
