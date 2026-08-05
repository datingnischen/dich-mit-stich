'use client';

import { usePathname } from 'next/navigation';
import { publicUrl, type MarketCode } from '@/lib/markets';

function withoutMarketPrefix(pathname: string) {
  return pathname.replace(/^\/(?:de|at|ch)(?=\/|$)/, '') || '/';
}

function ctaFromPathname(pathname: string, market: MarketCode) {
  if (withoutMarketPrefix(pathname).startsWith('/tattoo-singles')) {
    return {
      text: 'Tattoo-Singles in deiner Stadt finden',
      href: `${publicUrl(market)}?AID=location`,
    };
  }

  return {
    text: 'Jetzt kostenlos registrieren',
    href: `${publicUrl(market)}?AID=magazin`,
  };
}

export function StickyCTAButton({ market = 'de' }: { market?: MarketCode }) {
  const pathname = usePathname();
  const contentPathname = withoutMarketPrefix(pathname);

  if (contentPathname === '/') {
    return null;
  }

  const cta = ctaFromPathname(pathname, market);

  return (
    <a href={cta.href} className="sticky-cta-button" aria-label={cta.text}>
      <span className="sticky-cta-text">{cta.text}</span>
      <span className="sticky-cta-icon" aria-hidden="true">→</span>
    </a>
  );
}
