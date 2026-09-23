import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqPageView } from "@/components/faq-page";
import { FAQ_PATH } from "@/lib/faq";
import { isMarketCode, marketDescription, marketLanguageAlternates, marketTitleSuffix, publicUrl } from "@/lib/markets";

const title = "Häufig gestellte Fragen zu Dich mit Stich";
const description = "Antworten zu Anmeldung, Mitgliedschaft, Kosten, Funktionen, Sicherheit, Datenschutz und Support bei Dich mit Stich.";

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

function getMarketCode(value: string): "at" | "ch" | null {
  return isMarketCode(value) && value !== "de" ? value : null;
}

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const market = getMarketCode((await params).market);
  if (!market) return {};

  const canonical = publicUrl(market, FAQ_PATH);
  const marketTitle = `${title}${marketTitleSuffix(market)}`;
  const marketDescriptionText = marketDescription(market, description);
  return {
    title: marketTitle,
    description: marketDescriptionText,
    alternates: { canonical, languages: marketLanguageAlternates(FAQ_PATH) },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: marketTitle,
      description: marketDescriptionText,
      url: canonical,
      siteName: "Dich mit Stich",
      locale: market === "at" ? "de_AT" : "de_CH",
    },
  };
}

export default async function MarketFaqPage({ params }: { params: Promise<{ market: string }> }) {
  const market = getMarketCode((await params).market);
  if (!market) notFound();

  return <FaqPageView market={market} />;
}
