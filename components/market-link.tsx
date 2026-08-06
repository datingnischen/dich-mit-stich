'use client';

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marketPreviewPath, publicUrl, type MarketCode } from "@/lib/markets";

type MarketLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  targetMarket: MarketCode;
  pathname?: string;
};

export function isPreviewHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app");
}

export function MarketLink({
  targetMarket,
  pathname = "/",
  onClick,
  ...props
}: MarketLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (isPreviewHost(window.location.hostname)) {
      event.preventDefault();
      router.push(marketPreviewPath(targetMarket, pathname));
    }
  }

  return (
    <Link
      {...props}
      href={publicUrl(targetMarket, pathname)}
      onClick={handleClick}
      prefetch={false}
    />
  );
}
