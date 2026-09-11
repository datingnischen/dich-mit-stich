import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { isTattooStudioMarket } from "@/lib/tattoo-studio-guide";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ market: string }>;
};

export default async function MarketTattooStudioLayout({ children, params }: LayoutProps) {
  const { market } = await params;
  if (!isTattooStudioMarket(market)) notFound();
  return <SiteFrame market={market} sectionLive aid="location" stickyCta>{children}</SiteFrame>;
}
