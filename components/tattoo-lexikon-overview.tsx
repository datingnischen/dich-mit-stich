import { Fragment } from "react";

import { ArticleCardMedia } from "@/components/article-card-media";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { conversionUrl } from "@/lib/conversion-links";
import { getMarketMagazineCatalog } from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import {
  TATTOO_LEXIKON_SERIES,
  lexikonAnchor,
  parseLexikonBlocks,
  seriesLabel,
  type LexikonLink,
} from "@/lib/tattoo-lexikon-overview";
import { TATTOO_MOTIF_PROFILES } from "@/lib/tattoo-motifs";
import type { MagazineEntry } from "@/lib/wordpress";

type CardGroup = { id: string; heading: string; intro?: string; links: LexikonLink[] };

function LexikonCards({ market, group, entries }: { market: MarketCode; group: CardGroup; entries: Map<string, MagazineEntry> }) {
  return (
    <div className="lexikon-card-grid" id={group.id}>
      {group.links.map((link) => {
        const entry = entries.get(link.slug);
        const chips = TATTOO_MOTIF_PROFILES[link.slug]?.facts[0]?.items.slice(0, 3) ?? [];
        return (
          <MarketLink key={link.slug} className="lexikon-card" targetMarket={market} pathname={`/magazin/${link.slug}`}>
            <ArticleCardMedia
              imageUrl={entry?.featuredImage}
              alt={entry?.featuredImageAlt || link.label}
              fallbackLabel="Tattoo-Lexikon"
              fallbackTitle={link.label}
              className="lexikon-card-media"
              sizes="(max-width: 560px) 50vw, 240px"
            />
            <span className="lexikon-card-copy">
              <strong>{link.label}</strong>
              {chips.length ? (
                <span className="lexikon-card-chips">
                  {chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </span>
              ) : null}
            </span>
          </MarketLink>
        );
      })}
    </div>
  );
}

function LexikonDatingBand({ market }: { market: MarketCode }) {
  return (
    <aside className="lexikon-dating-band" aria-label="Tattoo-Singles">
      <div>
        <strong>Dein Motiv ist dabei?</strong>
        <p>Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – finde jemanden, der dein Motiv versteht, statt es zu erklären.</p>
      </div>
      <div className="lexikon-dating-actions">
        <a className="lexikon-dating-primary" href={conversionUrl(publicUrl(market), "/", "magazin")}>
          Kostenlos umsehen
        </a>
        <MarketLink className="lexikon-dating-secondary" targetMarket={market} pathname="/tattoo-singles">
          Tattoo-Singles nach Stadt
        </MarketLink>
      </div>
    </aside>
  );
}

/**
 * The lexicon page with its link lists shown as picture cards. Its prose stays as WordPress
 * wrote it; the Tribal and Sleeve series, which the page does not list, follow the last group.
 */
export async function TattooLexikonOverview({ market, html }: { market: MarketCode; html: string }) {
  const blocks = parseLexikonBlocks(html);
  const { posts, pages } = await getMarketMagazineCatalog(market);
  const entries = new Map([...posts, ...pages].map((entry) => [entry.slug, entry]));

  const groups: CardGroup[] = blocks.flatMap((block, index) =>
    block.kind === "links" ? [{ id: lexikonAnchor(block.heading, index), heading: block.heading, links: block.links }] : [],
  );
  const seriesGroups: CardGroup[] = TATTOO_LEXIKON_SERIES.map((series, index) => ({
    id: lexikonAnchor(series.heading, groups.length + index),
    heading: series.heading,
    intro: series.intro,
    links: series.slugs.flatMap((slug) => {
      const entry = entries.get(slug);
      return entry ? [{ slug, label: seriesLabel(entry.title) }] : [];
    }),
  })).filter((group) => group.links.length);

  const largestGroup = groups.reduce<CardGroup | null>((largest, group) => (!largest || group.links.length > largest.links.length ? group : largest), null);
  const lastLinksIndex = blocks.findLastIndex((block) => block.kind === "links");
  const articleCount = new Set([...groups, ...seriesGroups].flatMap((group) => group.links.map((link) => link.slug))).size;
  let groupIndex = 0;

  return (
    <>
      <nav className="lexikon-jump" aria-label="Bereiche des Tattoo-Lexikons">
        <span className="lexikon-jump-count">{articleCount} Artikel</span>
        <ul>
          {[...groups, ...seriesGroups].map((group) => (
            <li key={group.id}>
              <a href={`#${group.id}`}>{group.heading.replace(/^Inspirationen: /, "")}</a>
            </li>
          ))}
        </ul>
      </nav>

      {blocks.map((block, index) => {
        if (block.kind === "html") return <MarketHtmlContent key={index} market={market} html={block.html} />;

        const group = groups[groupIndex++];
        return (
          <Fragment key={index}>
            <LexikonCards market={market} group={group} entries={entries} />
            {group === largestGroup ? <LexikonDatingBand market={market} /> : null}
            {index === lastLinksIndex
              ? seriesGroups.map((series) => (
                  <section key={series.id} className="lexikon-series" aria-labelledby={`${series.id}-title`}>
                    <h3 id={`${series.id}-title`}>{series.heading}</h3>
                    {series.intro ? <p>{series.intro}</p> : null}
                    <LexikonCards market={market} group={series} entries={entries} />
                  </section>
                ))
              : null}
          </Fragment>
        );
      })}
    </>
  );
}
