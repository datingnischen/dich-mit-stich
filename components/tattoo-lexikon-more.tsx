import { ArticleCardMedia } from "@/components/article-card-media";
import { MarketLink } from "@/components/market-link";
import { isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { TATTOO_HUB, getHubChildLinks } from "@/lib/magazine-hubs";
import { getMarketMagazineEntryBySlug } from "@/lib/market-magazine";
import type { MarketCode } from "@/lib/markets";
import { pickRelatedSlugs } from "@/lib/tattoo-motifs";

type TattooLexikonMoreProps = {
  market: MarketCode;
  slug: string;
  preferred: readonly string[];
};

/** Three more lexicon articles, so readers move on to the next motif instead of leaving. */
export async function TattooLexikonMore({ market, slug, preferred }: TattooLexikonMoreProps) {
  const hubSlugs = (await getHubChildLinks(TATTOO_HUB))
    .map((link) => link.slug)
    .filter((candidate) => !isMagazineArticleQuarantined(candidate));
  const entries = (
    await Promise.all(
      pickRelatedSlugs(slug, hubSlugs, preferred).map((candidate) =>
        getMarketMagazineEntryBySlug(market, candidate).catch(() => null),
      ),
    )
  ).filter((entry) => entry !== null);
  if (!entries.length) return null;

  return (
    <section className="content-section motif-more" aria-labelledby="motif-more-title">
      <div className="section-header magazine-section-heading">
        <span className="eyebrow">{TATTOO_HUB.label}</span>
        <h2 id="motif-more-title">Mehr Motive mit Geschichte</h2>
        <p>
          Jedes Motiv hat seine eigene Herkunft – alle Stile und Symbole findest du im{" "}
          <MarketLink targetMarket={market} pathname={TATTOO_HUB.path}>{TATTOO_HUB.label}</MarketLink>.
        </p>
      </div>
      <div className="motif-more-grid">
        {entries.map((entry) => (
          <MarketLink
            key={entry.slug}
            targetMarket={market}
            pathname={`/magazin/${entry.slug}`}
            className="article-card magazine-story-card"
          >
            <ArticleCardMedia
              imageUrl={entry.featuredImage}
              alt={entry.featuredImageAlt || entry.title}
              fallbackLabel={TATTOO_HUB.label}
              fallbackTitle={entry.title}
              className="magazine-story-media"
              sizes="(max-width: 900px) 100vw, 320px"
            />
            <div className="magazine-story-copy">
              <span className="eyebrow eyebrow-muted">{TATTOO_HUB.label}</span>
              <h3>{entry.title}</h3>
            </div>
          </MarketLink>
        ))}
      </div>
    </section>
  );
}
