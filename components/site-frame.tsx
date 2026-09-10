import type { ReactNode } from "react";
import { SiteFooter, SiteHeader, type ConversionAid } from "@/components/site-shell";
import { StickyCTAButton } from "@/components/sticky-cta-button";
import { getMarket, type MarketCode } from "@/lib/markets";

type SiteFrameProps = {
  children: ReactNode;
  market?: MarketCode;
  sectionLive?: boolean;
  aid?: ConversionAid;
};

export function SiteFrame({ children, market = "de", sectionLive = false, aid }: SiteFrameProps) {
  const config = getMarket(market);

  return (
    <>
      <SiteHeader market={market} sectionLive={sectionLive} aid={aid} />
      {children}
      <SiteFooter market={market} sectionLive={sectionLive} aid={aid} />
      {config.contentEnabled ? <StickyCTAButton market={market} aid={aid} /> : null}
    </>
  );
}
