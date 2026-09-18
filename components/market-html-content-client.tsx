'use client';

import { useLayoutEffect, useRef } from "react";

import { isPreviewHost } from "@/lib/market-navigation";
import type { MarketCode } from "@/lib/markets";

type MarketHtmlContentClientProps = {
  html: string;
  market: MarketCode;
  className?: string;
};

export function MarketHtmlContentClient({ html, market, className }: MarketHtmlContentClientProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const anchors = content.querySelectorAll<HTMLAnchorElement>('a[data-dms-internal="true"]');
    const previewHost = isPreviewHost(window.location.hostname);
    const marketPrefix = `/${market}`;

    for (const anchor of anchors) {
      if (!previewHost) {
        const href = anchor.getAttribute("href") || "";
        if (href === marketPrefix) anchor.setAttribute("href", "/");
        else if (href.startsWith(`${marketPrefix}/`)) anchor.setAttribute("href", href.slice(marketPrefix.length));
      }
      anchor.removeAttribute("data-dms-internal");
    }
  }, [html, market]);

  return (
    <div
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
