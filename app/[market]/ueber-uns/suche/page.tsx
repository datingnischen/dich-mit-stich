import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteSearchPage, siteSearchMetadata, type SearchParams } from "@/components/site-search-page";
import { isMarketCode } from "@/lib/markets";

type PageProps = { params: Promise<{ market: string }>; searchParams: SearchParams };

function searchMarket(market: string) {
  return isMarketCode(market) && market !== "de" ? market : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const market = searchMarket((await params).market);
  return market ? siteSearchMetadata(market) : {};
}

export default async function MarketUeberUnsSuchePage({ params, searchParams }: PageProps) {
  const market = searchMarket((await params).market);
  if (!market) notFound();

  return <SiteSearchPage market={market} searchParams={searchParams} />;
}
