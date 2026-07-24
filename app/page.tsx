import Link from "next/link";
import { getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";
import { getTattooSinglesOverview } from "@/lib/tattoo-singles";

export default async function HomePage() {
  const [overview, posts, pages, categories] = await Promise.all([
    getTattooSinglesOverview(),
    getMagazinePosts(),
    getMagazinePages(),
    getMagazineCategories(),
  ]);

  return (
    <main className="shell">
      <section className="hero-card hero-brand">
        <span className="eyebrow">dich-mit-stich.de auf Vercel</span>
        <h1>Tattoo- und Piercing-Magazin plus Städte-Guides ziehen jetzt in ein sauberes Headless-Frontend um.</h1>
        <p>
          Diese erste Migrationsstufe verbindet bereits zwei echte Quellsysteme: das WordPress-Magazin
          unter /magazin und die Tattoo-Singles-Städte aus dem aktuellen öffentlichen ICONY-Bereich unter
          /tattoo-singles.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/tattoo-singles">
            Zu den Städte-Seiten
          </Link>
          <Link className="button button-secondary" href="/magazin">
            Zum Magazin
          </Link>
        </div>
      </section>

      <section className="grid-two">
        <article className="panel-card">
          <span className="eyebrow">Städte aus ICONY</span>
          <h2>{overview.title}</h2>
          <p>{overview.description}</p>
          <ul className="link-list compact-list">
            {overview.cityLinks.slice(0, 8).map((city) => (
              <li key={city.slug}>
                <Link href={`/tattoo-singles/${city.slug}`}>{city.label}</Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <span className="eyebrow">Magazin aus WordPress</span>
          <h2>Magazin, Kategorien und Evergreen-Seiten sind bereits als echte Datenquelle angebunden.</h2>
          <p>
            Der erste Vercel-Schnitt nutzt die WordPress REST API direkt und erhält dadurch Posts,
            Seiten und Kategorie-Archive ohne zusätzlichen CMS-Umzug.
          </p>
          <ul className="stats-list">
            <li>
              <strong>{posts.length}</strong>
              <span>Magazin-Posts</span>
            </li>
            <li>
              <strong>{pages.length}</strong>
              <span>WordPress-Seiten</span>
            </li>
            <li>
              <strong>{categories.length}</strong>
              <span>Kategorien</span>
            </li>
          </ul>
        </article>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Sofort nutzbare Einstiege</span>
          <h2>Wichtige Magazin-Kategorien</h2>
        </div>
        <div className="chip-row">
          {categories.slice(0, 5).map((category) => (
            <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid-two">
        <article className="panel-card">
          <div className="section-header">
            <span className="eyebrow">Neueste Artikel</span>
            <h2>Aktuelle Magazin-Inhalte</h2>
          </div>
          <div className="stack-list">
            {posts.slice(0, 5).map((post) => (
              <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card">
                <h3>{post.title}</h3>
                <p>{stripHtml(post.excerpt).slice(0, 150)}…</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-header">
            <span className="eyebrow">Wichtige Magazin-Seiten</span>
            <h2>Evergreen- und Info-Seiten aus WordPress</h2>
          </div>
          <div className="stack-list">
            {pages.slice(0, 6).map((page) => (
              <Link key={page.id} href={`/magazin/${page.slug}`} className="article-card">
                <h3>{page.title}</h3>
                <p>{stripHtml(page.excerpt || page.content).slice(0, 150)}…</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
