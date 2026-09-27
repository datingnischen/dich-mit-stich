'use client';

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isPreviewHost } from "@/lib/market-navigation";
import { marketPreviewPath, publicUrl, type MarketCode } from "@/lib/markets";
import { ABOUT_SEARCH_PATH, SEARCH_QUERY_MAX_LENGTH } from "@/lib/site-search";

type SiteSearchFormProps = {
  market: MarketCode;
  defaultValue?: string;
  variant?: "page" | "menu";
  autoFocus?: boolean;
};

// Das Formular zielt wie MarketLink auf die öffentliche Landesdomain; auf Vercel-Vorschauen bleibt es im Marktpfad.
export function SiteSearchForm({ market, defaultValue = "", variant = "page", autoFocus = false }: SiteSearchFormProps) {
  const router = useRouter();
  const inputId = `site-search-${variant}-${market}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isPreviewHost(window.location.hostname)) return;
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    const target = marketPreviewPath(market, ABOUT_SEARCH_PATH);
    router.push(query ? `${target}?q=${encodeURIComponent(query)}` : target);
  }

  return (
    <form
      className={`site-search-form site-search-form-${variant}`}
      action={publicUrl(market, ABOUT_SEARCH_PATH)}
      method="get"
      role="search"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>Seite durchsuchen</label>
      <input
        id={inputId}
        className="site-search-input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={variant === "menu" ? "Seite durchsuchen …" : "Stadt, Motiv, Piercing, Thema …"}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
      <button className="button button-primary site-search-submit" type="submit">Suchen</button>
    </form>
  );
}
