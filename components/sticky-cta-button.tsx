'use client';

import { usePathname } from 'next/navigation';
import { conversionUrl, type ConversionAid } from '@/lib/conversion-links';
import { publicUrl, type MarketCode } from '@/lib/markets';

// Demonym (adjective) per city slug, used to personalize the sticky CTA on a
// Tattoo-Singles or Tattoo-Studios city page ("Mannheimer Singles
// kennenlernen"). Cities without an entry fall back to the generic CTA text.
const CITY_ADJECTIVES: Record<string, string> = {
  berlin: 'Berliner',
  bochum: 'Bochumer',
  bonn: 'Bonner',
  bremen: 'Bremer',
  dortmund: 'Dortmunder',
  dresden: 'Dresdner',
  duesseldorf: 'Düsseldorfer',
  duisburg: 'Duisburger',
  essen: 'Essener',
  'frankfurt-am-main': 'Frankfurter',
  hamburg: 'Hamburger',
  hannover: 'Hannoveraner',
  karlsruhe: 'Karlsruher',
  koeln: 'Kölner',
  leipzig: 'Leipziger',
  mannheim: 'Mannheimer',
  muenchen: 'Münchner',
  muenster: 'Münsteraner',
  nuernberg: 'Nürnberger',
  stuttgart: 'Stuttgarter',
  wuppertal: 'Wuppertaler',
  dornbirn: 'Dornbirner',
  graz: 'Grazer',
  innsbruck: 'Innsbrucker',
  klagenfurt: 'Klagenfurter',
  linz: 'Linzer',
  salzburg: 'Salzburger',
  'sankt-poelten': 'St. Pöltner',
  villach: 'Villacher',
  wels: 'Welser',
  wien: 'Wiener',
  'wiener-neustadt': 'Wiener Neustädter',
  zuerich: 'Zürcher',
  winterthur: 'Winterthurer',
  'st-gallen': 'St. Galler',
  luzern: 'Luzerner',
  lugano: 'Luganeser',
  lausanne: 'Lausanner',
  genf: 'Genfer',
  'biel-bienne': 'Bieler',
  bern: 'Berner',
  basel: 'Basler',
};

function withoutMarketPrefix(pathname: string) {
  return pathname.replace(/^\/(?:de|at|ch)(?=\/|$)/, '') || '/';
}

function cityAdjectiveFromPathname(pathname: string) {
  const cityMatch = withoutMarketPrefix(pathname).match(/^\/tattoo-(?:singles|studios)\/([^/]+)\/?$/);
  return cityMatch ? CITY_ADJECTIVES[cityMatch[1]] : undefined;
}

function ctaFromPathname(pathname: string, market: MarketCode, aid?: ConversionAid) {
  if (aid === 'location' || withoutMarketPrefix(pathname).startsWith('/tattoo-singles')) {
    const cityAdjective = cityAdjectiveFromPathname(pathname);
    return {
      text: cityAdjective ? `${cityAdjective} Singles kennenlernen` : 'Jetzt kostenlos registrieren',
      href: conversionUrl(publicUrl(market), '/registration/', 'location'),
    };
  }

  const effectiveAid = aid || 'magazin';
  return {
    text: 'Jetzt kostenlos registrieren',
    href: conversionUrl(publicUrl(market), '/', effectiveAid),
  };
}

export function StickyCTAButton({ market = 'de', aid }: { market?: MarketCode; aid?: ConversionAid }) {
  const pathname = usePathname();
  const contentPathname = withoutMarketPrefix(pathname);

  if (contentPathname === '/') {
    return null;
  }

  const cta = ctaFromPathname(pathname, market, aid);

  return (
    <a href={cta.href} className="sticky-cta-button" aria-label={cta.text}>
      <span className="sticky-cta-text">{cta.text}</span>
      <span className="sticky-cta-icon" aria-hidden="true">→</span>
    </a>
  );
}
