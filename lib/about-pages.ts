import { conversionUrl } from "./conversion-links.ts";
import { getMarket, publicUrl, type MarketCode } from "./markets.ts";

export const ABOUT_ROOT_PATH = "/ueber-uns";
export const ABOUT_SLUGS = [
  "expertenteam",
  "erfolgsgeschichten",
  "kooperationen",
  "bewertungen",
  "social-media",
] as const;

export type AboutSlug = (typeof ABOUT_SLUGS)[number];
export type AboutRouteSlug = AboutSlug | null;

export const ABOUT_PATHS = [
  ABOUT_ROOT_PATH,
  ...ABOUT_SLUGS.map((slug) => `${ABOUT_ROOT_PATH}/${slug}`),
] as const;

export type AboutLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SocialChannel = "facebook" | "instagram" | "youtube";

export type AboutCard = {
  eyebrow: string;
  title: string;
  text: string;
  icon: string;
  channel?: SocialChannel;
  image?: {
    src: string;
    alt: string;
    fit?: "cover" | "contain";
    /** Randloses Titelbild mit Markenverlauf; das Icon sitzt als Chip im Bild. */
    bleed?: boolean;
  };
  link?: AboutLink;
};

export type AboutDetailSection = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  cta?: AboutLink;
};

export type AboutPage = {
  market: MarketCode;
  slug: AboutRouteSlug;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  lead: string;
  highlights: string[];
  cards: AboutCard[];
  sectionEyebrow: string;
  sectionTitle: string;
  sectionLead: string;
  detailSections?: AboutDetailSection[];
  primaryCta: AboutLink;
  secondaryCta?: AboutLink;
};

const countryPhrase: Record<MarketCode, string> = {
  de: "in Deutschland",
  at: "in Österreich",
  ch: "in der Schweiz",
};

function locationRegistrationUrl(market: MarketCode) {
  return conversionUrl(publicUrl(market), "/registration/", "location");
}

const socialCards: AboutCard[] = [
  {
    eyebrow: "Facebook",
    title: "Dich mit Stich auf Facebook",
    text: "Beiträge, Community-Einblicke und neue Kontakte rund um tätowierte und gepiercte Singles.",
    icon: "f",
    channel: "facebook",
    image: {
      src: "/social/dich-mit-stich-facebook.webp",
      alt: "Tätowiertes Paar liegt lachend im Bett – Dich mit Stich auf Facebook",
    },
    link: { label: "Facebook-Seite öffnen", href: "https://www.facebook.com/dichmitstich/", external: true },
  },
  {
    eyebrow: "Instagram",
    title: "@dichmitstich auf Instagram",
    text: "Bilder, Reels und Profile aus der Community – direkt im offiziellen Instagram-Kanal.",
    icon: "◎",
    channel: "instagram",
    image: {
      src: "/social/dich-mit-stich-instagram.webp",
      alt: "Lachendes Paar mit tätowiertem Unterarm – Dich mit Stich auf Instagram",
    },
    link: { label: "Instagram öffnen", href: "https://www.instagram.com/dichmitstich/", external: true },
  },
  {
    eyebrow: "YouTube",
    title: "Dich mit Stich auf YouTube",
    text: "Videos zu Tattoo-Kultur, Piercings und Dating für Menschen mit eigenem Stil.",
    icon: "▶",
    channel: "youtube",
    image: {
      src: "/social/dich-mit-stich-youtube.webp",
      alt: "Nahaufnahme eines farbigen Tattoo-Sleeves – Dich mit Stich auf YouTube",
    },
    link: { label: "YouTube-Kanal öffnen", href: "https://www.youtube.com/@Dich-mit-Stich", external: true },
  },
];

const expertCards: AboutCard[] = [
  {
    eyebrow: "Dating & Redaktion",
    title: "Christian M. Haas",
    text: "Datingexperte und Autor mit langjähriger Erfahrung in Nischen-Singlebörsen und Online-Dating.",
    icon: "✍",
    image: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/08/Christian-M-Haas-200x300.png",
      alt: "Christian M. Haas",
    },
    link: {
      label: "Expertenprofil lesen",
      href: "/magazin/unser-datingexperte",
    },
  },
  {
    eyebrow: "Tattoo-Magazin",
    title: "Anne Schweitzer",
    text: "Autorin für Tattoo-Motive, Stilfragen und verwandte Themen aus der Tattoo-Szene.",
    icon: "✦",
    image: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/09/Anne-Schweitzer-Tattoo-Expertin-300x300.jpg",
      alt: "Anne Schweitzer",
    },
    link: {
      label: "Autorenprofil lesen",
      href: "/magazin/author/anne-schweitzer",
    },
  },
  {
    eyebrow: "Plattformbetrieb",
    title: "Icony GmbH",
    text: "Die Icony GmbH betreibt die Dating-Plattform und ist Ansprechpartnerin für Technik, Datenschutz und rechtliche Plattformthemen.",
    icon: "⚙",
    image: {
      src: "/brand/icony-gmbh-logo.png",
      alt: "Icony GmbH",
      fit: "contain",
    },
  },
];

const storyCards: AboutCard[] = [
  {
    eyebrow: "Community-Geschichte",
    title: "Pascal & Stephanie",
    text: "Eine Liebesgeschichte, die in der Dich-mit-Stich-Facebook-Gruppe begann.",
    icon: "♥",
    image: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/12/foto.jpeg",
      alt: "Pascal und Stephanie",
    },
    link: {
      label: "Geschichte lesen",
      href: "/magazin/pascal-und-stephanie",
    },
  },
  {
    eyebrow: "Kennenlernen",
    title: "Katharina & Philip",
    text: "Katharina und Philip erzählen, wie sie sich über Dich mit Stich kennenlernten.",
    icon: "♥",
    image: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/10/Katharina-Phillip-Dich-mit-Stich-Lovestory.jpg",
      alt: "Katharina und Philip",
    },
    link: {
      label: "Geschichte lesen",
      href: "/magazin/katharina-und-philip",
    },
  },
  {
    eyebrow: "Erfahrung",
    title: "Andreas fand sein Gegenstück",
    text: "Andreas berichtet über seine Partnersuche und die Begegnung, die daraus entstand.",
    icon: "♥",
    image: {
      src: "https://dich-mit-stich.de/magazin/wp-content/uploads/2025/10/erfolgsgeschichte.png",
      alt: "Andreas und Do",
    },
    link: {
      label: "Geschichte lesen",
      href: "/magazin/andreas-und-do",
    },
  },
];

function aboutPath(slug: AboutRouteSlug) {
  return slug ? `${ABOUT_ROOT_PATH}/${slug}` : ABOUT_ROOT_PATH;
}

function internalCard(
  slug: AboutSlug,
  eyebrow: string,
  title: string,
  text: string,
  icon: string,
  image?: AboutCard["image"],
): AboutCard {
  return {
    eyebrow,
    title,
    text,
    icon,
    ...(image ? { image } : {}),
    link: { label: `${title} öffnen`, href: aboutPath(slug) },
  };
}

function rootPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: null,
    path: ABOUT_ROOT_PATH,
    eyebrow: "Hinter den Kulissen",
    title: "Über Dich mit Stich",
    description: `Lerne die Menschen, Geschichten und Kanäle hinter Dich mit Stich ${countryPhrase[market]} kennen.`,
    lead: "Dich mit Stich verbindet Tattoo- und Piercing-Singles und ergänzt die Partnersuche mit Stadtseiten, Magazinwissen und echten Geschichten aus der Community.",
    highlights: ["Menschen hinter der Marke", "echte Community-Geschichten", "offizielle Kanäle", "klare Ansprechpartner"],
    sectionEyebrow: "Mehr über uns",
    sectionTitle: "Die wichtigsten Hintergrundseiten auf einen Blick",
    sectionLead: "Öffne direkt den Bereich, über den du mehr erfahren möchtest.",
    cards: [
      internalCard("expertenteam", "Menschen & Rollen", "Unser Expertenteam", "Wer Inhalte prägt und wer die Plattform im Hintergrund betreibt.", "✍", {
        src: "/about/dich-mit-stich-ueber-uns-expertenteam.webp",
        alt: "Datingexperte Christian M. Haas lächelt in die Kamera",
        bleed: true,
      }),
      internalCard("erfolgsgeschichten", "Echte Begegnungen", "Erfolgsgeschichten", "Drei veröffentlichte Geschichten aus der Dich-mit-Stich-Community.", "♥", {
        src: "/about/dich-mit-stich-ueber-uns-erfolgsgeschichten.webp",
        alt: "Pascal und Stephanie, ein Paar aus der Dich-mit-Stich-Community",
        bleed: true,
      }),
      internalCard("social-media", "Offizielle Kanäle", "Social Media", "Facebook, Instagram und YouTube von Dich mit Stich.", "◎", {
        src: "/about/dich-mit-stich-ueber-uns-social-media.webp",
        alt: "Tätowiertes Paar liegt lachend im Bett",
        bleed: true,
      }),
      internalCard("bewertungen", "Erfahrungen & Vertrauen", "Bewertungen", "Externe Bewertungen, Community-Geschichten und dein eigener Eindruck.", "★", {
        src: "/about/dich-mit-stich-ueber-uns-bewertungen.webp",
        alt: "Zwei Hände mit Partner-Tattoos, Vogel und offener Käfig",
        bleed: true,
      }),
      internalCard("kooperationen", "Gemeinsam aktiv", "Kooperationen", "Möglichkeiten für Studios, Creator, Medien und Szene-Communities.", "↗", {
        src: "/about/dich-mit-stich-ueber-uns-kooperationen.webp",
        alt: "Tätowiererin arbeitet in ihrem Studio an einem Tattoo",
        bleed: true,
      }),
    ],
    primaryCta: { label: "Expertenteam kennenlernen", href: aboutPath("expertenteam") },
    secondaryCta: { label: "Kostenlos registrieren", href: locationRegistrationUrl(market), external: true },
  };
}

function expertPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "expertenteam",
    path: aboutPath("expertenteam"),
    eyebrow: "Menschen & Verantwortung",
    title: "Unser Expertenteam",
    description: "Die redaktionellen Stimmen und der Plattformbetrieb hinter Dich mit Stich.",
    lead: "Hier siehst du, wer Dating- und Tattoo-Themen redaktionell begleitet und wer für den Betrieb der Plattform verantwortlich ist.",
    highlights: ["klare Rollen", "sichtbare Autorenprofile", "Tattoo- und Datingthemen", "rechtlicher Plattformbetrieb"],
    sectionEyebrow: "Das Team",
    sectionTitle: "Menschen und Rollen hinter Dich mit Stich",
    sectionLead: "Autorenprofile und Plattformbetrieb werden bewusst getrennt dargestellt.",
    cards: expertCards,
    primaryCta: { label: "Erfolgsgeschichten lesen", href: aboutPath("erfolgsgeschichten") },
    secondaryCta: { label: "Zur Über-uns-Übersicht", href: ABOUT_ROOT_PATH },
  };
}

function storiesPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "erfolgsgeschichten",
    path: aboutPath("erfolgsgeschichten"),
    eyebrow: "Echte Begegnungen",
    title: "Erfolgsgeschichten bei Dich mit Stich",
    description: "Veröffentlichte Geschichten von Menschen, die über Dich mit Stich zueinandergefunden haben.",
    lead: "Hinter Profilen und Nachrichten stehen echte Menschen. Diese veröffentlichten Geschichten zeigen persönliche Wege vom ersten Kontakt bis zum Kennenlernen.",
    highlights: ["persönliche Geschichten", "direkt nachlesbar", "aus der Community", "ohne Erfolgsversprechen"],
    sectionEyebrow: "Aus der Community",
    sectionTitle: "Drei Geschichten, drei eigene Wege",
    sectionLead: "Die Beiträge erzählen individuelle Erfahrungen und sind kein Versprechen für einen bestimmten Ausgang deiner Partnersuche.",
    cards: storyCards,
    primaryCta: { label: "Kostenlos selbst starten", href: locationRegistrationUrl(market), external: true },
    secondaryCta: { label: "Zur Über-uns-Übersicht", href: ABOUT_ROOT_PATH },
  };
}

function cooperationPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "kooperationen",
    path: aboutPath("kooperationen"),
    eyebrow: "Kooperationen mit Dich mit Stich",
    title: "Kooperationen mit Dich mit Stich",
    description: "Kooperationsmöglichkeiten mit Dich mit Stich für Studios, Creator, Medien und Szene-Communities.",
    lead: "Du betreibst ein Tattoo-Studio, einen passenden Kanal, ein Magazin oder eine Community? Dann beschreibe uns kurz deine Zielgruppe und deine Idee.",
    highlights: ["Tattoo- und Piercing-Szene", "Studios & Creator", "Medien & Communities", "direkter Kontakt"],
    sectionEyebrow: "Zusammenarbeit",
    sectionTitle: "Welche Kooperation zu dir passen kann",
    sectionLead: "Eine Anfrage sollte nachvollziehbar machen, wer du bist, wen du erreichst und welchen Nutzen die Zusammenarbeit für die Community hat.",
    cards: [
      { eyebrow: "Vor Ort", title: "Tattoo- und Piercing-Studios", text: "Für gemeinsame Inhalte, lokale Guides oder andere nachvollziehbare Ideen mit echtem Szene-Bezug.", icon: "◆" },
      { eyebrow: "Reichweite", title: "Creator & Social Media", text: "Für passende Formate rund um Tattoo-Kultur, Piercings, Singles und Community.", icon: "◎" },
      { eyebrow: "Inhalte", title: "Medien & Communities", text: "Für Interviews, redaktionelle Kooperationen und gemeinsame Themen mit klarer Zielgruppe.", icon: "✦" },
    ],
    detailSections: [
      {
        eyebrow: "Wen wir suchen",
        title: "Partner aus der Tattoo- und Piercing-Szene",
        paragraphs: [
          "Dich mit Stich bringt tätowierte und gepiercte Singles zusammen. Dafür suchen wir Partner, die zur Szene passen und ihrer Community einen echten Mehrwert bieten möchten.",
        ],
        items: [
          "Tattoo- und Piercing-Studios, die Dich mit Stich auf ihrer Website, im Studio oder über einen QR-Code empfehlen möchten.",
          "Tätowierte Creator und Influencer mit einer aktiven Community auf Instagram, Facebook, TikTok oder anderen passenden Kanälen.",
          "Betreiber von Tattoo-Fanseiten, Magazinen und Community-Angeboten, die gemeinsame Inhalte oder Aktionen umsetzen möchten.",
          "Tattoo-Shops und weitere Szene-Anbieter, deren Angebot zu unserer Community passt.",
          "Social-Media-Profis, die Erfahrung mit Community-Management und dem Aufbau eigener Kanäle haben.",
        ],
      },
      {
        eyebrow: "Partnerprogramm",
        title: "35 % Provision und Beteiligung an Verlängerungen",
        paragraphs: [
          "Für Studios und Creator gibt es ein gemeinsames Partnerprogramm über Adcell. Ein personalisierter Partnerlink ordnet vermittelte Premium-Mitgliedschaften eindeutig zu.",
        ],
        items: [
          "35 % Provision pro Sale – auf den bestehenden Partnerseiten werden derzeit 13,96 bis 58,38 Euro pro erfolgreicher Premium-Mitgliedschaft genannt.",
          "Lifetime-Provision: Auch bei Verlängerungen einer vermittelten Premium-Mitgliedschaft werden 35 % vergütet.",
          "Schnelle Freigabe: Die vorhandenen Partnerinformationen nennen eine Provisionsfreigabe in weniger als drei Tagen.",
          "Transparente Auswertung: Klicks, Registrierungen und Umsätze lassen sich im Adcell-Konto nachvollziehen.",
        ],
        cta: {
          label: "Jetzt beim Partnerprogramm anmelden",
          href: "https://www.adcell.de/partnerprogramme/7003/",
          external: true,
        },
      },
      {
        eyebrow: "So funktioniert es",
        title: "In vier Schritten zur Kooperation",
        paragraphs: [
          "Studios können den Partnerlink auf ihrer Website einbinden oder als QR-Code im Studio und auf Flyern einsetzen. Creator teilen ihn in Beiträgen, Stories oder dauerhaft im Profil.",
        ],
        items: [
          "Bei Adcell für das Dich-mit-Stich-Partnerprogramm registrieren und das eigene Studio, die Website oder das Social-Media-Profil angeben.",
          "Nach der Freischaltung den personalisierten Partnerlink erhalten.",
          "Den Link passend zur eigenen Community online, in Social Media oder vor Ort teilen.",
          "Vermittelte Premium-Mitgliedschaften und die daraus entstehende Vergütung im Adcell-Konto verfolgen.",
        ],
        cta: {
          label: "Partnerprogramm bei Adcell öffnen",
          href: "https://www.adcell.de/partnerprogramme/7003/",
          external: true,
        },
      },
      {
        eyebrow: "Weitere Ideen",
        title: "Gemeinsame Inhalte, Aktionen und Community-Projekte",
        paragraphs: [
          "Nicht jede gute Zusammenarbeit passt in ein klassisches Partnerprogramm. Wenn du ein Studio, einen Shop, ein Magazin, eine Fanseite oder einen passenden Kanal betreibst, schick uns deine Idee mit einem kurzen Hinweis zu Zielgruppe, Reichweite und geplantem Format.",
          "Wir prüfen, ob daraus eine gemeinsame Aktion, ein redaktioneller Beitrag, ein lokaler Guide oder eine andere sinnvolle Kooperation für die Tattoo- und Piercing-Community entstehen kann.",
        ],
        cta: {
          label: "Kooperationsidee per E-Mail senden",
          href: "mailto:christian@datingnischen.de?subject=Kooperationsanfrage%20Dich%20mit%20Stich",
          external: true,
        },
      },
    ],
    primaryCta: {
      label: "Kooperationsanfrage senden",
      href: "mailto:christian@datingnischen.de?subject=Kooperationsanfrage%20Dich%20mit%20Stich",
      external: true,
    },
    secondaryCta: { label: "Zur Über-uns-Übersicht", href: ABOUT_ROOT_PATH },
  };
}

function reviewsPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "bewertungen",
    path: aboutPath("bewertungen"),
    eyebrow: "Erfahrungen & Vertrauen",
    title: "Bewertungen und Erfahrungen zu Dich mit Stich",
    description: "Externe Bewertungen und veröffentlichte Community-Erfahrungen zu Dich mit Stich.",
    lead: "Bewertungen verändern sich. Deshalb verlinken wir auf den aktuellen Stand bei der externen Quelle und trennen ihn von unseren eigenen veröffentlichten Erfolgsgeschichten.",
    highlights: ["externe Quelle", "keine festgeschriebene Sternezahl", "Community-Geschichten", "kostenlos selbst ansehen"],
    sectionEyebrow: "Realistisch einordnen",
    sectionTitle: "So kannst du dir ein eigenes Bild machen",
    sectionLead: "Nutze mehrere Perspektiven: aktuelle externe Bewertungen, persönliche Geschichten und einen eigenen kostenlosen Blick auf die Plattform.",
    cards: [
      {
        eyebrow: "Externe Bewertungen",
        title: "Aktueller Stand bei Trustpilot",
        text: "Öffne Trustpilot direkt, um den jeweils aktuellen Bewertungsstand und einzelne Erfahrungsberichte zu lesen.",
        icon: "★",
        link: { label: "Trustpilot öffnen", href: "https://de.trustpilot.com/review/dich-mit-stich.de", external: true },
      },
      internalCard("erfolgsgeschichten", "Veröffentlichte Erfahrungen", "Erfolgsgeschichten", "Lies drei persönliche Geschichten aus der Dich-mit-Stich-Community.", "♥"),
      {
        eyebrow: "Eigener Eindruck",
        title: "Kostenlos umsehen",
        text: "Starte kostenlos und entscheide selbst, ob Zielgruppe, Profile und Funktionen zu dir passen.",
        icon: "→",
        link: { label: "Kostenlos registrieren", href: locationRegistrationUrl(market), external: true },
      },
    ],
    primaryCta: { label: "Aktuelle Bewertungen ansehen", href: "https://de.trustpilot.com/review/dich-mit-stich.de", external: true },
    secondaryCta: { label: "Zur Über-uns-Übersicht", href: ABOUT_ROOT_PATH },
  };
}

function socialPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "social-media",
    path: aboutPath("social-media"),
    eyebrow: "Dich mit Stich auf Social Media",
    title: "Social Media von Dich mit Stich",
    description: "Die offiziellen Facebook-, Instagram- und YouTube-Kanäle von Dich mit Stich.",
    lead: "Folge Dich mit Stich für Community-Einblicke, Tattoo- und Piercingthemen sowie neue Videos aus der Szene.",
    highlights: ["Facebook", "Instagram", "YouTube", "offizielle Kanäle"],
    sectionEyebrow: "Kanäle & Community",
    sectionTitle: "Dich mit Stich auch außerhalb der Plattform",
    sectionLead: "Alle Links führen direkt zu den jeweiligen öffentlichen Profilen.",
    cards: socialCards,
    primaryCta: { label: "Facebook öffnen", href: "https://www.facebook.com/dichmitstich/", external: true },
    secondaryCta: { label: "Zur Über-uns-Übersicht", href: ABOUT_ROOT_PATH },
  };
}

export function isAboutSlug(value: string): value is AboutSlug {
  return ABOUT_SLUGS.includes(value as AboutSlug);
}

export function buildAboutPageGraph(page: AboutPage) {
  const canonical = publicUrl(page.market, page.path);
  const siteRoot = publicUrl(page.market);
  const ids = {
    website: `${siteRoot}#website`,
    brand: `${siteRoot}#brand`,
    operator: `${siteRoot}#operator`,
    page: `${canonical}#webpage`,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ids.operator,
        name: "Icony GmbH",
        url: siteRoot,
      },
      {
        "@type": "Brand",
        "@id": ids.brand,
        name: "Dich mit Stich",
        url: siteRoot,
      },
      {
        "@type": "WebSite",
        "@id": ids.website,
        name: "Dich mit Stich",
        url: siteRoot,
        inLanguage: getMarket(page.market).locale,
        provider: { "@id": ids.operator },
        about: { "@id": ids.brand },
      },
      {
        "@type": "AboutPage",
        "@id": ids.page,
        url: canonical,
        name: page.title,
        description: page.description,
        inLanguage: getMarket(page.market).locale,
        isPartOf: { "@id": ids.website },
        about: { "@id": ids.brand },
      },
    ],
  };
}

export function getAboutPage(market: MarketCode, slug: string | null): AboutPage | null {
  if (slug === null) return rootPage(market);
  if (!isAboutSlug(slug)) return null;

  switch (slug) {
    case "expertenteam": return expertPage(market);
    case "erfolgsgeschichten": return storiesPage(market);
    case "kooperationen": return cooperationPage(market);
    case "bewertungen": return reviewsPage(market);
    case "social-media": return socialPage(market);
  }
}
