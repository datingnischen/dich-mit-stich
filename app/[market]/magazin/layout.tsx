import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/site-frame";
import { isMarketCode } from "@/lib/markets";

export default async function MarketMagazineLayout({ children, params }: { children: ReactNode; params: Promise<{ market: string }> }) {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") notFound();
  return <SiteFrame market={market} aid="magazin">{children}</SiteFrame>;
}
