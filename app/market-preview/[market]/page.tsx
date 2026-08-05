import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/site-frame";
import { getMarket, isMarketCode, marketPreviewPath, publicUrl, type MarketCode } from "@/lib/markets";

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ market: string }>;
};

function unavailableMarket(value: string): MarketCode {
  if (!isMarketCode(value) || value === "de") notFound();
  return value;
}

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const market = unavailableMarket((await params).market);
  const config = getMarket(market);

  return {
    title: `Dich mit Stich ${config.countryName}`,
    description: `Der eigene Dich-mit-Stich-Bereich für ${config.countryName} wird vorbereitet.`,
    alternates: { canonical: publicUrl(market) },
    robots: { index: false, follow: false },
  };
}

export default async function MarketPreviewPage({ params }: PageProps) {
  const market = unavailableMarket((await params).market);
  const config = getMarket(market);

  return (
    <SiteFrame market={market}>
      <main className="shell shell-narrow">
        <section className="hero-card hero-magazine hero-magazine-editorial">
        <span className="eyebrow">Dich mit Stich {config.countryName}</span>
        <h1>Dieser Länderbereich wird gerade vorbereitet.</h1>
        <p>
          Inhalte, Städte und Registrierungswege werden erst veröffentlicht, wenn sie eindeutig {config.countryName}
          zugeordnet und vollständig geprüft sind. So erscheinen hier keine deutschen Inhalte oder Städte im falschen Markt.
        </p>
        <div className="button-row" aria-label="Verfügbare Ländervorschauen">
          <Link className="button button-secondary" href={marketPreviewPath("de")}>
            Deutschland ansehen
          </Link>
          <Link className="button button-secondary" href={marketPreviewPath("at")}>
            Österreich
          </Link>
          <Link className="button button-secondary" href={marketPreviewPath("ch")}>
            Schweiz
          </Link>
        </div>
        </section>
      </main>
    </SiteFrame>
  );
}
