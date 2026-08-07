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
      'bremen': '28195',
      'dortmund': '44135',
      'dresden': '01067',
      'duesseldorf': '40210',
      'essen': '45127',
      'frankfurt-am-main': '60308',
      'hamburg': '20038',
      'hannover': '30159',
      'koeln': '50667',
      'leipzig': '04103',
      'mannheim': '68159',
      'muenchen': '80339',
      'nuernberg': '90402',
      'stuttgart': '70173',
    },
  },
  at: {
    projectKey: 'dichmitstichat',
    legacyCounter: '43',
    postalCodes: {
      'dornbirn': '6850',
      'graz': '8010',
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

export function getIconyCityWidgetConfig(market: MarketCode, slug: string): IconyCityWidgetConfig | null {
  const marketConfig = MARKET_WIDGET_CONFIG[market];
  const postalCode = marketConfig.postalCodes[slug];
  if (!postalCode) return null;
  return { projectKey: marketConfig.projectKey, postalCode, legacyCounter: marketConfig.legacyCounter };
}

export function listIconyWidgetCities(market: MarketCode): string[] {
  return Object.keys(MARKET_WIDGET_CONFIG[market].postalCodes).sort();
}
