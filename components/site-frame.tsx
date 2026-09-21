import type { ReactNode } from "react";
import { SiteFooter, SiteHeader, type ConversionAid } from "@/components/site-shell";
import { StickyCTAButton } from "@/components/sticky-cta-button";
import { getMarket, type MarketCode } from "@/lib/markets";

type SiteFrameProps = {
  children: ReactNode;
  market?: MarketCode;
  sectionLive?: boolean;
  stickyCta?: boolean;
  aid?: ConversionAid;
};

export function SiteFrame({ children, market = "de", sectionLive = false, stickyCta = false, aid = "location" }: SiteFrameProps) {
  const config = getMarket(market);
  const showStickyCta = config.contentEnabled || (sectionLive && stickyCta);

  return (
    <>
      <SiteHeader market={market} sectionLive={sectionLive} aid={aid} />
      {children}
      <SiteFooter market={market} sectionLive={sectionLive} stickyCta={showStickyCta} aid={aid} />
      {showStickyCta ? <StickyCTAButton market={market} aid={aid} /> : null}
    </>
  );
}
