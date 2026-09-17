'use client';

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { localizeFirstPartyHtmlLinks } from "@/lib/market-html";
import { isPrefixFreeInternalPath, shouldInterceptPreviewClick } from "@/lib/market-navigation";
import { marketPreviewPath, publicUrl, type MarketCode } from "@/lib/markets";

type MarketHtmlContentProps = {
  className?: string;
  html: string;
  market: MarketCode;
};

export function MarketHtmlContent({ className, html, market }: MarketHtmlContentProps) {
  const router = useRouter();
  const localizedHtml = localizeFirstPartyHtmlLinks(html, publicUrl(market));

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;

    const anchor = event.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;
    let previewPath = href;
    if (!isPrefixFreeInternalPath(previewPath)) {
      try {
        const target = new URL(previewPath);
        if (target.origin !== publicUrl(market)) return;
        previewPath = `${target.pathname}${target.search}${target.hash}`;
      } catch {
        return;
      }
    }
    if (!shouldInterceptPreviewClick({
      hostname: window.location.hostname,
      button: event.button,
      defaultPrevented: event.defaultPrevented,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      target: anchor.target,
      download: anchor.hasAttribute("download"),
    })) return;

    event.preventDefault();
    router.push(marketPreviewPath(market, previewPath));
  }

  return <div className={className} onClick={handleClick} dangerouslySetInnerHTML={{ __html: localizedHtml }} />;
}
