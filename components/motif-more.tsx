import { ArticleCardMedia } from "@/components/article-card-media";
import { MarketLink } from "@/components/market-link";
import { isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { PIERCING_HUB, TATTOO_HUB, getHubChildLinks } from "@/lib/magazine-hubs";
import { getMarketMagazineEntryBySlug } from "@/lib/market-magazine";
import type { MarketCode } from "@/lib/markets";
import { pickRelatedSlugs, type MotifTopic } from "@/lib/tattoo-motifs";

const MORE_COPY: Record<MotifTopic, { hub: typeof TATTOO_HUB; heading: string; intro: string; linkText: string }> = {
  tattoo: {
    hub: TATTOO_HUB,
    heading: "Mehr Motive mit Geschichte",
    intro: "Jedes Motiv hat seine eigene Herkunft – alle Stile und Symbole findest du im",
    linkText: "Tattoo-Lexikon",
  },
  piercing: {
    hub: PIERCING_HUB,
    heading: "Mehr Piercingarten",
    intro: "Vom Ohr bis zur Zunge – alle Piercings nach Körperstelle sortiert findest du in der",
    linkText: "Übersicht der Piercingarten",
  },
};

type MotifMoreProps = {
  market: MarketCode;
  slug: string;
  topic: MotifTopic;
  preferred: readonly string[];
};

/** Three more articles from the same hub, so readers move on to the next motif instead of leaving. */
export async function MotifMore({ market, slug, topic, preferred }: MotifMoreProps) {
  const copy = MORE_COPY[topic];
  const hubSlugs = (await getHubChildLinks(copy.hub))
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
        <span className="eyebrow">{copy.hub.label}</span>
        <h2 id="motif-more-title">{copy.heading}</h2>
        <p>
          {copy.intro}{" "}
          <MarketLink targetMarket={market} pathname={copy.hub.path}>{copy.linkText}</MarketLink>.
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
              fallbackLabel={copy.hub.label}
              fallbackTitle={entry.title}
              className="magazine-story-media"
              sizes="(max-width: 900px) 100vw, 320px"
            />
            <div className="magazine-story-copy">
              <span className="eyebrow eyebrow-muted">{copy.hub.label}</span>
              <h3>{entry.title}</h3>
            </div>
          </MarketLink>
        ))}
      </div>
    </section>
  );
}
