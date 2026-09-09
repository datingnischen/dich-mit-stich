import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutPageView, aboutPageMetadata } from "@/components/about-page";
import { getAboutPage } from "@/lib/about-pages";
import { isMarketCode } from "@/lib/markets";

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

function getPage(market: string) {
  if (!isMarketCode(market) || market === "de") return null;
  return getAboutPage(market, null);
}

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const page = getPage((await params).market);
  return page ? aboutPageMetadata(page) : {};
}

export default async function MarketUeberUnsPage({ params }: { params: Promise<{ market: string }> }) {
  const page = getPage((await params).market);
  if (!page) notFound();

  return <AboutPageView page={page} />;
}
