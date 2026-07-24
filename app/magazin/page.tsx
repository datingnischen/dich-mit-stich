import Link from "next/link";
import { getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";

export const revalidate = 300;

export default async function MagazineOverviewPage() {
  const [posts, pages, categories] = await Promise.all([
    getMagazinePosts(),
    getMagazinePages(),
    getMagazineCategories(),
  ]);

  const featuredPost = posts[0];
  const spotlightPosts = posts.slice(1, 7);
  const spotlightPages = pages.slice(0, 4);

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine hero-magazine-editorial">
        <span className="eyebrow">Tattoo-Magazin</span>
        <h1>Szene-Stories, Tattoo-Ratgeber und echte Erfolgsstorys jetzt in einer deutlich stärkeren Magazin-Oberfläche.</h1>
        <p>
          Dich mit Stich bekommt hier endlich wieder einen sichtbaren Rahmen: mit Header, Footer, echter Magazin-Navigation
          und WordPress-Inhalten, die nicht mehr wie ein nackter Daten-Import aussehen.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="https://dich-mit-stich.de/registration/">
            Kostenlos registrieren
          </Link>
          <Link className="button button-secondary" href="/tattoo-singles">
            Tattoo-Singles Städte ansehen
          </Link>
        </div>
      </section>

      {featuredPost ? (
        <section className="content-section">
          <div className="section-header">
            <span className="eyebrow">Featured Story</span>
            <h2>Direkt aus dem Magazin</h2>
          </div>
          <Link href={`/magazin/${featuredPost.slug}`} className="editorial-feature-card">
            {featuredPost.featuredImage ? (
              <div className="editorial-feature-media">
                <img src={featuredPost.featuredImage} alt={featuredPost.featuredImageAlt || featuredPost.title} loading="eager" decoding="async" />
              </div>
            ) : null}
            <div className="editorial-feature-copy">
              <span className="eyebrow">{featuredPost.categories[0]?.name || "Magazin"}</span>
              <h3>{featuredPost.title}</h3>
              <p>{stripHtml(featuredPost.excerpt || featuredPost.content).slice(0, 220)}…</p>
              <div className="meta-row">
                {featuredPost.authorName ? <span>Von {featuredPost.authorName}</span> : null}
                {featuredPost.date ? <span>{featuredPost.date.slice(0, 10)}</span> : null}
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Kategorien</span>
          <h2>Magazin-Themen mit Szene-Fokus</h2>
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
            <h2>Aktuelle Beiträge mit Bild, Hook und Einstieg</h2>
          </div>
          <div className="stack-list">
            {spotlightPosts.map((post) => (
              <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card article-card-rich">
                {post.featuredImage ? (
                  <div className="article-card-media">
                    <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} loading="lazy" decoding="async" />
                  </div>
                ) : null}
                <div className="article-card-copy">
                  <span className="eyebrow eyebrow-muted">{post.categories[0]?.name || "Magazin"}</span>
                  <h3>{post.title}</h3>
                  <p>{stripHtml(post.excerpt || post.content).slice(0, 180)}…</p>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-header">
            <span className="eyebrow">Pages</span>
            <h2>Evergreen- und Info-Seiten aus WordPress</h2>
          </div>
          <div className="stack-list">
            {spotlightPages.map((page) => (
              <Link key={page.id} href={`/magazin/${page.slug}`} className="article-card article-card-rich">
                {page.featuredImage ? (
                  <div className="article-card-media">
                    <img src={page.featuredImage} alt={page.featuredImageAlt || page.title} loading="lazy" decoding="async" />
                  </div>
                ) : null}
                <div className="article-card-copy">
                  <span className="eyebrow eyebrow-muted">WordPress-Seite</span>
                  <h3>{page.title}</h3>
                  <p>{stripHtml(page.excerpt || page.content).slice(0, 180)}…</p>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
