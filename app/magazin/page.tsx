import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/markets";
import { formatGermanDate, getMagazineCategories, getMagazinePages, getMagazinePosts, stripHtml } from "@/lib/wordpress";

export const revalidate = 900;

export const metadata: Metadata = {
  alternates: { canonical: publicUrl("de", "/magazin") },
};

type ArticleCardMediaProps = {
  imageUrl?: string;
  alt: string;
  fallbackLabel: string;
  fallbackTitle: string;
  className?: string;
};

function ArticleCardMedia({ imageUrl, alt, fallbackLabel, fallbackTitle, className = "" }: ArticleCardMediaProps) {
  const mediaClassName = `article-card-media ${className}`.trim();

  if (imageUrl) {
    return (
      <div className={mediaClassName}>
        <Image src={imageUrl} alt={alt} width={720} height={405} sizes="(max-width: 760px) 100vw, 520px" />
      </div>
    );
  }

  return (
    <div className={`${mediaClassName} article-card-media-fallback`} aria-hidden="true">
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
    <main className="shell magazine-overview-shell">
      <section className="hero-card hero-magazine hero-magazine-editorial magazine-intro-card">
        <span className="eyebrow">Tattoo-, Piercing- & Szene-Magazin</span>
        <h1>Tattoo-Wissen und echte Geschichten für Menschen mit eigenem Stil.</h1>
        <p>
          Entdecke Motive und ihre Bedeutung, fundiertes Piercing-Wissen, Szene-Persönlichkeiten und Lovestorys aus der
          Dich-mit-Stich-Community.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="#aktuell">
            Neue Artikel entdecken
          </Link>
          <Link className="button button-secondary" href="https://dich-mit-stich.de/registration/?AID=magazin">
            Tattoo-Singles kennenlernen
          </Link>
        </div>
      </section>

      {featuredPost ? (
        <section className="content-section magazine-feature-section">
          <div className="section-header">
            <span className="eyebrow">Titelstory</span>
            <h2>Eine Geschichte, die gerade bewegt</h2>
          </div>
          <Link href={`/magazin/${featuredPost.slug}`} className="editorial-feature-card">
            {featuredPost.featuredImage ? (
              <div className="editorial-feature-media">
                <Image
                  src={featuredPost.featuredImage}
                  alt={featuredPost.featuredImageAlt || featuredPost.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 900px) 100vw, 560px"
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
              <span className="editorial-text-link">Titelstory lesen <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        </section>
      ) : null}

      <nav className="content-section magazine-topic-nav" aria-labelledby="magazine-topics-title">
        <div className="section-header">
          <span className="eyebrow">Themenwelten</span>
          <h2 id="magazine-topics-title">Womit möchtest du einsteigen?</h2>
        </div>
        <div className="chip-row">
          {categories.map((category) => (
            <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      <section className="content-section magazine-latest-section" id="aktuell">
        <div className="section-header magazine-section-heading">
          <span className="eyebrow">Neu im Magazin</span>
          <h2>Frische Storys, Motive und Szene-Wissen</h2>
          <p>Große Bilder, klare Themen und genug Raum, damit du auf einen Blick findest, was dich interessiert.</p>
        </div>
        <div className="magazine-story-grid">
          {spotlightPosts.map((post) => (
            <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card magazine-story-card">
              <ArticleCardMedia
                imageUrl={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                fallbackLabel="Dich mit Stich Magazin"
                fallbackTitle={post.title}
                className="magazine-story-media"
              />
              <div className="magazine-story-copy">
                <span className="eyebrow eyebrow-muted">{post.categories[0]?.name || "Magazin"}</span>
                <h3>{post.title}</h3>
                <div className="meta-row magazine-story-meta">
                  {post.authorName ? <span>Von {post.authorName}</span> : null}
                  {post.date ? <span>{formatGermanDate(post.date)}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section magazine-guides-section">
        <div className="section-header magazine-section-heading">
          <span className="eyebrow">Tattoo & Piercing verstehen</span>
          <h2>Beliebte Grundlagen kompakt erklärt</h2>
          <p>Von Motivbedeutungen bis Piercingarten: bewährte Ratgeber für deine nächste Idee.</p>
        </div>
        <div className="magazine-guide-grid">
          {spotlightPages.map((page) => (
            <Link key={page.id} href={`/magazin/${page.slug}`} className="article-card magazine-guide-card">
              <ArticleCardMedia
                imageUrl={page.featuredImage}
                alt={page.featuredImageAlt || page.title}
                fallbackLabel="Tattoo- & Piercingwissen"
                fallbackTitle={page.title}
              />
              <div className="magazine-guide-copy">
                <span className="eyebrow eyebrow-muted">Ratgeber & Wissen</span>
                <h3>{page.title}</h3>
                <span className="editorial-text-link">Ratgeber lesen <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
