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
import { motifProfile, type MotifTopic } from "@/lib/tattoo-motifs";
import type { MagazineEntry } from "@/lib/wordpress";

type CardGroup = { id: string; heading: string; intro?: string; links: LexikonLink[] };

const OVERVIEW_COPY: Record<MotifTopic, { navLabel: string; fallbackLabel: string; untitledGroup: string; bandTitle: string; bandText: string }> = {
  tattoo: {
    navLabel: "Bereiche des Tattoo-Lexikons",
    fallbackLabel: "Tattoo-Lexikon",
    untitledGroup: "Weitere Themen",
    bandTitle: "Dein Motiv ist dabei?",
    bandText: "Bei Dich mit Stich zeigen Singles ihre Tattoos im Profil – finde jemanden, der dein Motiv versteht, statt es zu erklären.",
  },
  piercing: {
    navLabel: "Piercingarten nach Körperstelle",
    fallbackLabel: "Piercingarten",
    untitledGroup: "Körperpiercings",
    bandTitle: "Dein Piercing ist dabei?",
    bandText: "Bei Dich mit Stich zeigen Singles ihre Piercings und Tattoos im Profil – hier fällt dein Schmuck auf, ohne dass du ihn erklären musst.",
  },
};

function HubCards({ market, topic, group, entries }: { market: MarketCode; topic: MotifTopic; group: CardGroup; entries: Map<string, MagazineEntry> }) {
  return (
    <div className="lexikon-card-grid" id={group.id}>
      {group.links.map((link) => {
        const entry = entries.get(link.slug);
        const chips = motifProfile(topic, link.slug)?.facts[0]?.items.slice(0, 3) ?? [];
        return (
          <MarketLink key={link.slug} className="lexikon-card" targetMarket={market} pathname={`/magazin/${link.slug}`}>
            <ArticleCardMedia
              imageUrl={entry?.featuredImage}
              alt={entry?.featuredImageAlt || link.label}
              fallbackLabel={OVERVIEW_COPY[topic].fallbackLabel}
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

function HubDatingBand({ market, topic }: { market: MarketCode; topic: MotifTopic }) {
  const copy = OVERVIEW_COPY[topic];
  return (
    <aside className="lexikon-dating-band" aria-label="Singles bei Dich mit Stich">
      <div>
        <strong>{copy.bandTitle}</strong>
        <p>{copy.bandText}</p>
      </div>
      <div className="lexikon-dating-actions">
        <a className="lexikon-dating-primary" href={conversionUrl(publicUrl(market), "/", "magazin")}>
          Kostenlos umsehen
        </a>
        <MarketLink className="lexikon-dating-secondary" targetMarket={market} pathname="/tattoo-singles">
          Singles nach Stadt
        </MarketLink>
      </div>
    </aside>
  );
}

type MagazineHubOverviewProps = { market: MarketCode; html: string; topic: MotifTopic };

/**
 * A hub page (Tattoo-Lexikon, Piercingarten) with its link lists shown as picture cards. Its prose
 * stays as WordPress wrote it; the Tattoo-Lexikon also gets the Tribal and Sleeve series, which
 * the page does not list, after its last group.
 */
export async function MagazineHubOverview({ market, html, topic }: MagazineHubOverviewProps) {
  const copy = OVERVIEW_COPY[topic];
  const blocks = parseLexikonBlocks(html);
  const { posts, pages } = await getMarketMagazineCatalog(market);
  const entries = new Map([...posts, ...pages].map((entry) => [entry.slug, entry]));

  const groups: CardGroup[] = blocks.flatMap((block, index) => {
    if (block.kind !== "links") return [];
    const heading = block.heading || copy.untitledGroup;
    return [{ id: lexikonAnchor(heading, index), heading, links: block.links }];
  });
  const seriesGroups: CardGroup[] = topic === "tattoo"
    ? TATTOO_LEXIKON_SERIES.map((series, index) => ({
        id: lexikonAnchor(series.heading, groups.length + index),
        heading: series.heading,
        intro: series.intro,
        links: series.slugs.flatMap((slug) => {
          const entry = entries.get(slug);
          return entry ? [{ slug, label: seriesLabel(entry.title) }] : [];
        }),
      })).filter((group) => group.links.length)
    : [];

  const largestGroup = groups.reduce<CardGroup | null>((largest, group) => (!largest || group.links.length > largest.links.length ? group : largest), null);
  const lastLinksIndex = blocks.findLastIndex((block) => block.kind === "links");
  const articleCount = new Set([...groups, ...seriesGroups].flatMap((group) => group.links.map((link) => link.slug))).size;
  let groupIndex = 0;

  return (
    <>
      <nav className="lexikon-jump" aria-label={copy.navLabel}>
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
            <HubCards market={market} topic={topic} group={group} entries={entries} />
            {group === largestGroup ? <HubDatingBand market={market} topic={topic} /> : null}
            {index === lastLinksIndex
              ? seriesGroups.map((series) => (
                  <section key={series.id} className="lexikon-series" aria-labelledby={`${series.id}-title`}>
                    <h3 id={`${series.id}-title`}>{series.heading}</h3>
                    {series.intro ? <p>{series.intro}</p> : null}
                    <HubCards market={market} topic={topic} group={series} entries={entries} />
                  </section>
                ))
              : null}
          </Fragment>
        );
      })}
    </>
  );
}
