import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleCardMedia } from "@/components/article-card-media";
import { MagazineTeaser } from "@/components/magazine-teaser";
import { MarketLink } from "@/components/market-link";
import { conversionUrl } from "@/lib/conversion-links";
import { localizeFirstPartyText } from "@/lib/market-html";
import {
  getMarketMagazineCategories,
  getMarketMagazineCategoryBySlug,
  getMarketMagazineEntriesForCategory,
} from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { formatGermanDate } from "@/lib/wordpress";

export async function MagazineCategory({ market, slug }: { market: MarketCode; slug: string }) {
  const [category, entries, categories] = await Promise.all([
    getMarketMagazineCategoryBySlug(market, slug),
    getMarketMagazineEntriesForCategory(market, slug),
    getMarketMagazineCategories(market),
  ]);

  if (!category) notFound();

  const origin = publicUrl(market);
  const featuredEntry = entries[0];
  const remainingEntries = entries.slice(1);
  const latestDate = entries.find((entry) => entry.date)?.date;

  return (
    <main className="shell magazine-overview-shell">
      <nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">
        <MarketLink targetMarket={market} pathname="/magazin">Magazin</MarketLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{category.name}</span>
      </nav>

      <section className="hero-card hero-magazine hero-magazine-editorial magazine-intro-card">
        <span className="eyebrow">Magazin-Thema</span>
        <h1>{category.name}</h1>
        <p>
          {localizeFirstPartyText(category.description ||
            `Hier findest du die wichtigsten Artikel, Storys und Szene-Ratgeber aus dem Bereich ${category.name}.`, origin)}
        </p>
        <div className="meta-row magazine-topic-meta">
          <span>{entries.length} Artikel</span>
          {latestDate ? <span>Zuletzt aktualisiert {formatGermanDate(latestDate)}</span> : null}
        </div>
        <div className="button-row">
          {remainingEntries.length ? (
            <MarketLink className="button button-primary" targetMarket={market} pathname={`/magazin/thema/${slug}#alle`}>
              Alle Artikel ansehen
            </MarketLink>
          ) : null}
          <a className="button button-secondary" href={conversionUrl(origin, "/", "magazin")}>
            Flirtradar kostenlos nutzen
          </a>
        </div>
      </section>

      {featuredEntry ? (
        <section className="content-section magazine-feature-section">
          <MarketLink targetMarket={market} pathname={`/magazin/${featuredEntry.slug}`} className="editorial-feature-card">
            {featuredEntry.featuredImage ? (
              <div className="editorial-feature-media">
                <Image
                  src={featuredEntry.featuredImage}
                  alt={featuredEntry.featuredImageAlt || featuredEntry.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 900px) 100vw, 560px"
                  preload
                />
              </div>
            ) : null}
            <div className="editorial-feature-copy">
              <span className="eyebrow">Aktuellster Beitrag</span>
              <h2>{featuredEntry.title}</h2>
              <MagazineTeaser entry={featuredEntry} length={220} origin={origin} />
              <div className="meta-row">
                {featuredEntry.authorName ? <span>Von {featuredEntry.authorName}</span> : null}
                {featuredEntry.date ? <span>{formatGermanDate(featuredEntry.date)}</span> : null}
              </div>
              <span className="editorial-text-link">Artikel lesen <span aria-hidden="true">→</span></span>
            </div>
          </MarketLink>
        </section>
      ) : null}

      {categories.length > 1 ? (
        <nav className="content-section magazine-topic-nav" aria-labelledby="magazine-topic-switch">
          <div className="section-header">
            <span className="eyebrow">Themenwelten</span>
            <h2 id="magazine-topic-switch">Stöbere in den anderen Themen</h2>
          </div>
          <div className="chip-row">
            {categories.map((topic) => (
              <MarketLink
                key={topic.slug}
                className={topic.slug === category.slug ? "chip chip-active" : "chip"}
                aria-current={topic.slug === category.slug ? "page" : undefined}
                targetMarket={market}
                pathname={`/magazin/thema/${topic.slug}`}
              >
                {topic.name}
              </MarketLink>
            ))}
          </div>
        </nav>
      ) : null}

      {remainingEntries.length ? (
        <section className="content-section" id="alle">
          <div className="section-header magazine-section-heading">
            <span className="eyebrow">Alle Beiträge</span>
            <h2>Weitere Artikel aus {category.name}</h2>
            <p>Chronologisch sortiert – vom neuesten Beitrag bis zu den Klassikern.</p>
          </div>
          <div className="magazine-story-grid magazine-topic-grid">
            {remainingEntries.map((entry) => (
              <MarketLink
                key={entry.id}
                targetMarket={market}
                pathname={`/magazin/${entry.slug}`}
                className="article-card magazine-story-card"
              >
                <ArticleCardMedia
                  imageUrl={entry.featuredImage}
                  alt={entry.featuredImageAlt || entry.title}
                  fallbackLabel={category.name}
                  fallbackTitle={entry.title}
                  className="magazine-story-media"
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 340px"
                />
                <div className="magazine-story-copy">
                  <h3>{entry.title}</h3>
                  <div className="meta-row magazine-story-meta">
                    {entry.authorName ? <span>Von {entry.authorName}</span> : null}
                    {entry.date ? <span>{formatGermanDate(entry.date)}</span> : null}
                  </div>
                </div>
              </MarketLink>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
