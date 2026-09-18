import { MarketHtmlContentClient } from "@/components/market-html-content-client";
import { marketizeSanitizedHtml } from "@/lib/market-html";
import type { MarketCode } from "@/lib/markets";

type MarketHtmlContentProps = {
  html: string;
  market: MarketCode;
  className?: string;
};

export function MarketHtmlContent({ html, market, className }: MarketHtmlContentProps) {
  return (
    <MarketHtmlContentClient
      className={className}
      html={marketizeSanitizedHtml(html, market)}
      market={market}
    />
  );
}
