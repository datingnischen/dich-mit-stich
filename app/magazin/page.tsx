import Image from "next/image";
import Link from "next/link";
import { formatGermanDate, getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";

export const revalidate = 900;

function ArticleCardMedia({ imageUrl, alt, fallbackLabel, fallbackTitle }: { imageUrl?: string; alt: string; fallbackLabel: string; fallbackTitle: string }) {
  if (imageUrl) {
    return (
      <div className="article-card-media">
        <Image
          src={imageUrl}
          alt={alt}
          width={720}
          height={405}
          sizes="(max-width: 760px) 100vw, 420px"
        />
      </div>
    );
  }

  return (
    <div className="article-card-media article-card-media-fallback" aria-hidden="true">
      <span>{fallbackLabel}</span>
      <strong>{fallbackTitle}</strong>
    </div>
  );
}

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
        <span className="eyebrow">Tattoo-, Piercing- & Szene-Magazin</span>
        <h1>Ratgeber, Erfolgsgeschichten und Szene-Wissen für Datinginteressierte mit eigenem Stil.</h1>
        <p>
          Hier findest du Tattoo-Ideen, Piercing-Wissen, echte Lovestorys und direkte Einstiege für alle, die beim Dating
          Menschen mit Persönlichkeit suchen.
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
            <span className="eyebrow">Gerade beliebt</span>
            <h2>Direkt aus dem Magazin</h2>
          </div>
          <Link href={`/magazin/${featuredPost.slug}`} className="editorial-feature-card">
            {featuredPost.featuredImage ? (
              <div className="editorial-feature-media">
                <Image
                  src={featuredPost.featuredImage}
                  alt={featuredPost.featuredImageAlt || featuredPost.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 900px) 100vw, 900px"
                  priority
                />
              </div>
            ) : null}
            <div className="editorial-feature-copy">
              <span className="eyebrow">{featuredPost.categories[0]?.name || "Magazin"}</span>
              <h3>{featuredPost.title}</h3>
              <p>{stripHtml(featuredPost.excerpt || featuredPost.content).slice(0, 220)}…</p>
              <div className="meta-row">
                {featuredPost.authorName ? <span>Von {featuredPost.authorName}</span> : null}
                {featuredPost.date ? <span>{formatGermanDate(featuredPost.date)}</span> : null}
              </div>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="content-section">
        <div className="section-header">
          <span className="eyebrow">Themenwelten</span>
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
            <span className="eyebrow">Neue Artikel</span>
            <h2>Aktuelle Magazinbeiträge für deinen Einstieg</h2>
          </div>
          <div className="stack-list">
            {spotlightPosts.map((post) => (
              <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card article-card-rich">
                <ArticleCardMedia
                  imageUrl={post.featuredImage}
                  alt={post.featuredImageAlt || post.title}
                  fallbackLabel="Tattoo-, Piercing- & Szene-Magazin"
                  fallbackTitle={post.title}
                />
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
            <span className="eyebrow">Mehr Wissen</span>
            <h2>Beliebte Ratgeber und wichtige Themen auf einen Blick</h2>
          </div>
          <div className="stack-list">
            {spotlightPages.map((page) => (
              <Link key={page.id} href={`/magazin/${page.slug}`} className="article-card article-card-rich">
                <ArticleCardMedia
                  imageUrl={page.featuredImage}
                  alt={page.featuredImageAlt || page.title}
                  fallbackLabel="Tattoo- & Piercingwissen"
                  fallbackTitle={page.title}
                />
                <div className="article-card-copy">
                  <span className="eyebrow eyebrow-muted">Ratgeber & Wissen</span>
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
