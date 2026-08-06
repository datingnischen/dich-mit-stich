'use client';

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { shouldInterceptPreviewClick } from "@/lib/market-navigation";
import { marketPreviewPath, publicUrl, type MarketCode } from "@/lib/markets";

type MarketLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  targetMarket: MarketCode;
  pathname?: string;
};

export function MarketLink({
  targetMarket,
  pathname = "/",
  onClick,
  ...props
}: MarketLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!shouldInterceptPreviewClick({
      hostname: window.location.hostname,
      button: event.button,
      defaultPrevented: event.defaultPrevented,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      target: event.currentTarget.target,
      download: event.currentTarget.hasAttribute("download"),
    })) {
      return;
    }

    event.preventDefault();
    router.push(marketPreviewPath(targetMarket, pathname));
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
