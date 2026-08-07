import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { isMarketCode } from "@/lib/markets";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ market: string }>;
};

export default async function MarketTattooSinglesLayout({ children, params }: LayoutProps) {
  const { market } = await params;

  if (!isMarketCode(market) || market === "de") {
    notFound();
  }

  return <SiteFrame market={market} sectionLive>{children}</SiteFrame>;
}
