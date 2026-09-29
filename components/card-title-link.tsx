import { MarketLink } from "@/components/market-link";
import { splitCardTitle } from "@/lib/card-title";
import type { MarketCode } from "@/lib/markets";

type CardTitleLinkProps = {
  market: MarketCode;
  pathname: string;
  title: string;
};

/** Card title whose link covers only the short head of long WordPress titles; the card stays clickable via card-stretch. */
export function CardTitleLink({ market, pathname, title }: CardTitleLinkProps) {
  const [head, tail] = splitCardTitle(title);

  return (
    <>
      <MarketLink className="card-stretch-link" targetMarket={market} pathname={pathname}>{head}</MarketLink>
      {tail ? ` – ${tail}` : null}
    </>
  );
}
