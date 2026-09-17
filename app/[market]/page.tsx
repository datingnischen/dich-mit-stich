import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { isMarketCode, publicUrl } from "@/lib/markets";

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") return {};
  return {
    alternates: { canonical: publicUrl(market) },
    robots: { index: false, follow: true },
  };
}

export default async function MarketHomePage({ params }: { params: Promise<{ market: string }> }) {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") notFound();
  return <HomePage market={market} />;
}
