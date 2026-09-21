import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketLink } from "@/components/market-link";
import { localizeFirstPartyText } from "@/lib/market-html";
import { getMarketMagazineCategoryBySlug, getMarketMagazineEntriesForCategory } from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { stripHtml } from "@/lib/wordpress";

export async function MagazineCategory({ market, slug }: { market: MarketCode; slug: string }) {
  const [category, entries] = await Promise.all([
    getMarketMagazineCategoryBySlug(market, slug),
    getMarketMagazineEntriesForCategory(market, slug),
  ]);

  if (!category) notFound();

  const featuredEntry = entries[0];
  const remainingEntries = entries.slice(1);

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine hero-magazine-editorial">
        <span className="eyebrow">Magazin-Thema</span>
        <h1>{category.name}</h1>
        <p>
          {localizeFirstPartyText(category.description ||
            `Hier findest du die wichtigsten Artikel, Storys und Szene-Ratgeber aus dem Bereich ${category.name}.`, publicUrl(market))}
        </p>
      </section>

      {featuredEntry ? (
        <section className="content-section">
          <MarketLink targetMarket={market} pathname={`/magazin/${featuredEntry.slug}`} className="editorial-feature-card">
            {featuredEntry.featuredImage ? (
              <div className="editorial-feature-media">
                <Image
                  src={featuredEntry.featuredImage}
                  alt={featuredEntry.featuredImageAlt || featuredEntry.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 900px) 100vw, 900px"
                  priority
                />
              </div>
            ) : null}
            <div className="editorial-feature-copy">
              <span className="eyebrow">Featured aus {category.name}</span>
              <h2>{featuredEntry.title}</h2>
              <p>{localizeFirstPartyText(stripHtml(featuredEntry.excerpt || featuredEntry.content).slice(0, 220), publicUrl(market))}…</p>
            </div>
          </MarketLink>
        </section>
      ) : null}

      <section className="content-section">
        <div className="stack-list">
          {remainingEntries.map((entry) => (
            <MarketLink key={entry.id} targetMarket={market} pathname={`/magazin/${entry.slug}`} className="article-card article-card-rich">
              {entry.featuredImage ? (
                <div className="article-card-media">
                  <Image
                    src={entry.featuredImage}
                    alt={entry.featuredImageAlt || entry.title}
                    width={720}
                    height={405}
                    sizes="(max-width: 760px) 100vw, 720px"
                  />
                </div>
              ) : null}
              <div className="article-card-copy">
                <h2>{entry.title}</h2>
                <p>{localizeFirstPartyText(stripHtml(entry.excerpt || entry.content).slice(0, 180), publicUrl(market))}…</p>
              </div>
            </MarketLink>
          ))}
        </div>
      </section>
    </main>
  );
}
