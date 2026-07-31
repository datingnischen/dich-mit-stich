import Link from "next/link";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { getDatingExpertProfile } from "@/lib/expert-profile";
import { staticAsset } from "@/lib/static-asset";
import { formatGermanDate, getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";
import { getTattooSinglesOverview } from "@/lib/tattoo-singles";

const HOME_HERO_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");
const FLIRTRADAR_IMAGE = staticAsset("/brand/flirtradar-umkreissuche.png");

export default async function HomePage() {
  const [overview, posts, pages, categories, expert] = await Promise.all([
    getTattooSinglesOverview(),
    getMagazinePosts(),
    getMagazinePages(),
    getMagazineCategories(),
    getDatingExpertProfile(),
  ]);

  const featuredPost = posts[0];
  const magazineStarts = [...posts.slice(1, 4), ...pages.slice(0, 1)];

  return (
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
            <Link className="button button-primary" href="https://dich-mit-stich.de/registration/">
              Kostenlos registrieren
            </Link>
            <Link className="button button-secondary" href="/tattoo-singles">
              Städte entdecken
            </Link>
          </div>
        </div>

        <div className="home-stage-visual">
          <div className="home-stage-picture">
            <img src={HOME_HERO_IMAGE} alt="Dich mit Stich Startseitenmotiv" loading="eager" decoding="async" />
          </div>
          <div className="floating-entry-card">
            <span className="eyebrow">Schneller Einstieg</span>
            <h2>{overview.title}</h2>
            <p>{overview.description}</p>
            <Link className="button button-primary" href="/tattoo-singles/bremen">
              Beispiel-Stadt ansehen
            </Link>
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
            <Link className="button button-primary" href="https://dich-mit-stich.de/registration/">
              Kostenlos anmelden
            </Link>
            <Link className="button button-secondary" href="/tattoo-singles">
              Regionen ansehen
            </Link>
          </div>
        </div>

        <div className="home-radar-visual">
          <div className="home-radar-frame">
            <img
              src={FLIRTRADAR_IMAGE}
              alt="Flirtradar mit Umkreissuche für Tattoo-Singles in der Nähe"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel-card">
          <span className="eyebrow">Tattoo-Singles nach Stadt</span>
          <h2>Starte direkt in der passenden Region</h2>
          <p>
            Von Berlin bis München: Die Stadtseiten zeigen dir lokale Einstiege, Szene-Bezug und direkte Wege zu
            neuen Kontakten.
          </p>
          <ul className="link-list compact-list">
            {overview.cityLinks.slice(0, 8).map((city) => (
              <li key={city.slug}>
                <Link href={`/tattoo-singles/${city.slug}`}>{city.label}</Link>
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
          <ExpertTrustCard profile={expert} />
        </section>
      ) : null}

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Beliebte Themen</span>
          <h2>Womit willst du einsteigen?</h2>
        </div>
        <div className="chip-row">
          {categories.slice(0, 6).map((category) => (
            <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
              {category.name}
            </Link>
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
            <p className="home-feature-excerpt">{stripHtml(featuredPost.excerpt || featuredPost.content).slice(0, 220)}…</p>
            <div className="meta-row home-feature-meta">
              {featuredPost.authorName ? <span>Von {featuredPost.authorName}</span> : null}
              {featuredPost.date ? <span>{formatGermanDate(featuredPost.date)}</span> : null}
            </div>
            <div className="button-row home-feature-actions">
              <Link className="button button-primary" href={`/magazin/${featuredPost.slug}`}>
                Artikel lesen
              </Link>
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
              <Link key={`${entry.type}-${entry.id}`} href={`/magazin/${entry.slug}`} className="home-more-link">
                <div className="meta-row home-more-meta">
                  {entry.categories[0] ? <span>{entry.categories[0].name}</span> : null}
                  {entry.date ? <span>{formatGermanDate(entry.date)}</span> : null}
                </div>
                <h3>{entry.title}</h3>
                <p>{stripHtml(entry.excerpt || entry.content).slice(0, 145)}…</p>
              </Link>
            ))}
          </div>
          <div className="button-row home-more-actions">
            <Link className="button button-secondary" href="/magazin">
              Mehr im Magazin ansehen
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
