import type { MarketCode } from './markets';

export type IconyCityWidgetConfig = {
  projectKey: string;
  postalCode: string;
  legacyCounter: string;
};

const MARKET_WIDGET_CONFIG: Record<MarketCode, { projectKey: string; legacyCounter: string; postalCodes: Record<string, string> }> = {
  de: {
    projectKey: 'dichmitstich',
    legacyCounter: '49',
    postalCodes: {
      'berlin': '10115',
      'bochum': '44787',
      'bonn': '53111',
      'bremen': '28195',
      'dortmund': '44135',
      'dresden': '01067',
      'duisburg': '47051',
      'duesseldorf': '40210',
      'essen': '45127',
      'frankfurt-am-main': '60308',
      'hamburg': '20038',
      'hannover': '30159',
      'karlsruhe': '76133',
      'koeln': '50667',
      'leipzig': '04103',
      'mannheim': '68159',
      'muenchen': '80339',
      'muenster': '48143',
      'nuernberg': '90402',
      'stuttgart': '70173',
      'wuppertal': '42103',
    },
  },
  at: {
    projectKey: 'dichmitstichat',
    legacyCounter: '43',
    postalCodes: {
      'dornbirn': '6850',
      'graz': '8010',
      'innsbruck': '6020',
      'klagenfurt': '9020',
      'linz': '4020',
      'salzburg': '5020',
      'sankt-poelten': '3100',
      'villach': '9500',
      'wels': '4600',
      'wien': '1010',
      'wiener-neustadt': '2700',
    },
  },
  ch: {
    projectKey: 'dichmitstichch',
    legacyCounter: '41',
    postalCodes: {
      'basel': '4000',
      'bern': '3000',
      'biel-bienne': '2500',
      'genf': '1200',
      'lausanne': '1000',
      'lugano': '6900',
      'luzern': '6000',
      'st-gallen': '9000',
      'winterthur': '8400',
      'zuerich': '8000',
    },
  },
};

export function getIconyProjectKey(market: MarketCode): string {
  return MARKET_WIDGET_CONFIG[market].projectKey;
}

/** ICONY's country code (49 DE, 43 AT, 41 CH); without it the API mixes in singles from other countries. */
export function getIconyCountryCode(market: MarketCode): number {
  return Number(MARKET_WIDGET_CONFIG[market].legacyCounter);
}

export function getIconyCityWidgetConfig(market: MarketCode, slug: string): IconyCityWidgetConfig | null {
  const marketConfig = MARKET_WIDGET_CONFIG[market];
  const postalCode = marketConfig.postalCodes[slug];
  if (!postalCode) return null;
  assertIconyPostcode(market, postalCode);
  return { projectKey: marketConfig.projectKey, postalCode, legacyCounter: marketConfig.legacyCounter };
}

export function assertIconyPostcode(market: MarketCode, postalCode: string): void {
  const pattern = market === 'de' ? /^\d{5}$/ : /^\d{4}$/;
  if (!pattern.test(postalCode)) {
    throw new Error(`Invalid postcode for ${market}: ${postalCode}`);
  }
}

export function buildIconyCitySearchPath(market: MarketCode, postalCode: string): string {
  assertIconyPostcode(market, postalCode);
  return `/suche/?plz=${postalCode}&AID=location`;
}

export function listIconyWidgetCities(market: MarketCode): string[] {
  return Object.keys(MARKET_WIDGET_CONFIG[market].postalCodes).sort();
}
