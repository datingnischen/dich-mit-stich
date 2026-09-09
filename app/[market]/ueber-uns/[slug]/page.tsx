import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutPageView, aboutPageMetadata } from "@/components/about-page";
import { ABOUT_SLUGS, getAboutPage } from "@/lib/about-pages";
import { isMarketCode } from "@/lib/markets";

export function generateStaticParams() {
  return ["at", "ch"].flatMap((market) => ABOUT_SLUGS.map((slug) => ({ market, slug })));
}

function getPage(market: string, slug: string) {
  if (!isMarketCode(market) || market === "de") return null;
  return getAboutPage(market, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; slug: string }>;
}): Promise<Metadata> {
  const { market, slug } = await params;
  const page = getPage(market, slug);
  return page ? aboutPageMetadata(page) : {};
}

export default async function MarketUeberUnsSubpage({
  params,
}: {
  params: Promise<{ market: string; slug: string }>;
}) {
  const { market, slug } = await params;
  const page = getPage(market, slug);
  if (!page) notFound();

  return <AboutPageView page={page} />;
}
