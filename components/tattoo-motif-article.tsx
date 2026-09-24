import { Fragment } from "react";

import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { conversionUrl } from "@/lib/conversion-links";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { planArticleSlots, splitArticleSections, type TattooMotifSpotlight } from "@/lib/tattoo-motifs";

type TattooMotifArticleProps = {
  market: MarketCode;
  html: string;
  spotlight: TattooMotifSpotlight;
};

/**
 * The lexicon article with quiet inserts between its chapters: a flirt hook after the second,
 * a pull quote further down and a scene line at the end. The WordPress text stays untouched.
 */
export function TattooMotifArticle({ market, html, spotlight }: TattooMotifArticleProps) {
  const sections = splitArticleSections(html);
  const { hookAfter, quoteAfter } = planArticleSlots(sections.length);
  const registrationHref = conversionUrl(publicUrl(market), "/", "magazin");

  return (
    <>
      {sections.map((section, index) => (
        <Fragment key={index}>
          <MarketHtmlContent market={market} html={section} />

          {index + 1 === hookAfter ? (
            <aside className="motif-hook" aria-label="Flirt-Tipp">
              <span className="motif-hook-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <path
                    d="M4 5h16v10H9l-5 4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <strong className="motif-hook-title">{spotlight.flirtHook.title}</strong>
                <p>{spotlight.flirtHook.text}</p>
                <MarketLink className="motif-hook-link" targetMarket={market} pathname="/tattoo-singles">
                  {spotlight.hookLinkLabel}
                </MarketLink>
              </div>
            </aside>
          ) : null}

          {index + 1 === quoteAfter && spotlight.pullQuote ? (
            <blockquote className="motif-pullquote">
              <p>{spotlight.pullQuote}</p>
            </blockquote>
          ) : null}
        </Fragment>
      ))}

      {sections.length > 1 ? (
        <aside className="motif-scene" aria-label="Dich mit Stich">
          <p>{spotlight.sceneLine}</p>
          <a className="motif-scene-link" href={registrationHref}>
            Kostenlos umsehen
          </a>
        </aside>
      ) : null}
    </>
  );
}
