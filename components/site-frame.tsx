import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { StickyCTAButton } from "@/components/sticky-cta-button";
import { getMarket, type MarketCode } from "@/lib/markets";

type SiteFrameProps = {
  children: ReactNode;
  market?: MarketCode;
};

export function SiteFrame({ children, market = "de" }: SiteFrameProps) {
  const config = getMarket(market);

  return (
    <>
      <SiteHeader market={market} />
      {children}
      <SiteFooter market={market} />
      {config.contentEnabled ? <StickyCTAButton market={market} /> : null}
    </>
  );
}
