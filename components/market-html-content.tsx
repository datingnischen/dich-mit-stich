'use client';

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { isPreviewHost } from "@/components/market-link";
import { marketPreviewPath, type MarketCode } from "@/lib/markets";

type MarketHtmlContentProps = {
  className?: string;
  html: string;
  market: MarketCode;
};

export function MarketHtmlContent({ className, html, market }: MarketHtmlContentProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !isPreviewHost(window.location.hostname) ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const anchor = event.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href?.startsWith("/") || href.startsWith("//") || anchor.hasAttribute("download")) return;
    if (anchor.target && anchor.target !== "_self") return;

    event.preventDefault();
    router.push(marketPreviewPath(market, href));
  }

  return <div className={className} onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
