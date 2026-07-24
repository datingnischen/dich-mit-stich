import Link from "next/link";
import { getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";

export const revalidate = 300;

export default async function MagazineOverviewPage() {
  const [posts, pages, categories] = await Promise.all([
    getMagazinePosts(),
    getMagazinePages(),
    getMagazineCategories(),
  ]);

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine">
        <span className="eyebrow">Tattoo-Magazin</span>
        <h1>Alle Tattoo-, Piercing- und Szene-Inhalte aus dem WordPress-Magazin jetzt in einer Vercel-Schicht.</h1>
        <p>
          Diese Übersicht zieht echte Posts, Pages und Kategorien aus WordPress. So bleiben die redaktionellen
          Inhalte CMS-basiert, während das Frontend schrittweise auf den neuen Stack umzieht.
        </p>
      </section>

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Kategorien</span>
          <h2>Magazin-Themen</h2>
        </div>
        <div className="chip-row">
          {categories.map((category) => (
            <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid-two">
        <article className="panel-card">
          <div className="section-header">
            <span className="eyebrow">Posts</span>
            <h2>Aktuelle Beiträge</h2>
          </div>
          <div className="stack-list">
            {posts.map((post) => (
              <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card">
                <h3>{post.title}</h3>
                <p>{stripHtml(post.excerpt).slice(0, 180)}…</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-header">
            <span className="eyebrow">Pages</span>
            <h2>Magazin-Seiten und Evergreen-Inhalte</h2>
          </div>
          <div className="stack-list">
            {pages.map((page) => (
              <Link key={page.id} href={`/magazin/${page.slug}`} className="article-card">
                <h3>{page.title}</h3>
                <p>{stripHtml(page.excerpt || page.content).slice(0, 180)}…</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
