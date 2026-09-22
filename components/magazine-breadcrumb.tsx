import { MarketLink } from "@/components/market-link";
import type { BreadcrumbTrailItem } from "@/lib/piercing-hub";
import type { MarketCode } from "@/lib/markets";

export function MagazineBreadcrumb({ market, trail }: { market: MarketCode; trail: BreadcrumbTrailItem[] }) {
  if (trail.length === 0) return null;

  return (
    <nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">
      <ol>
        {trail.map((item, index) => {
          const isCurrent = index === trail.length - 1;
          return (
            <li key={item.pathname} aria-current={isCurrent ? "page" : undefined}>
              {isCurrent ? item.name : (
                <MarketLink targetMarket={market} pathname={item.pathname}>{item.name}</MarketLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
