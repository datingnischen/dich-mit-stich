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

export type SocialChannel = "facebook" | "instagram" | "youtube" | "pinterest";

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
  /** Bettet statt eines Links das ICONY-Kurzformular (PLZ, Ich bin, Ich suche) in die Kachel ein. */
  widget?: "icony-registration";
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
  {
    eyebrow: "Pinterest",
    title: "Dich mit Stich auf Pinterest",
    text: "Pinnwände voller Tattoo-Motive, Piercing-Ideen und Inspiration für deinen nächsten Stich.",
    icon: "P",
    channel: "pinterest",
    image: {
      src: "/social/dich-mit-stich-pinterest.webp",
      alt: "Frau mit bunten Blumen-Tattoos am Arm – Dich mit Stich auf Pinterest",
    },
    link: { label: "Pinterest öffnen", href: "https://de.pinterest.com/dichmitstich/", external: true },
  },
];

const expertCards: AboutCard[] = [
  {
    eyebrow: "Dating & Redaktion",
    title: "Christian M. Haas",
    text: "Datingexperte und Autor. Beschäftigt sich seit Jahren mit Online-Dating und Singlebörsen für besondere Zielgruppen.",
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
    text: "Schreibt über Tattoo-Motive, Stile und alles, was die Szene gerade bewegt.",
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
    eyebrow: "Betreiberin",
    title: "Icony GmbH",
    text: "Betreibt die Plattform. An sie wendest du dich bei Fragen zu Technik, Datenschutz und Rechtlichem.",
    icon: "⚙",
    image: {
      src: "/brand/icony-gmbh-logo.png",
      alt: "Icony GmbH",
      fit: "contain",
    },
    link: {
      label: "Icony GmbH besuchen",
      href: "https://www.icony.com/",
      external: true,
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
    text: "Andreas erzählt, wie er über Dich mit Stich Do kennengelernt hat.",
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
  linkLabel: string,
  image?: AboutCard["image"],
): AboutCard {
  return {
    eyebrow,
    title,
    text,
    icon,
    ...(image ? { image } : {}),
    link: { label: linkLabel, href: aboutPath(slug) },
  };
}

function rootPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: null,
    path: ABOUT_ROOT_PATH,
    eyebrow: "Hinter den Kulissen",
    title: "Über Dich mit Stich",
    description: `Wer steckt hinter Dich mit Stich ${countryPhrase[market]}? Das Team, echte Paare aus der Community und unsere Kanäle.`,
    lead: "Dich mit Stich ist die Singlebörse für Menschen mit Tattoos und Piercings. Hier erfährst du, wer dahintersteckt, welche Paare sich bei uns gefunden haben und wo du uns sonst noch triffst.",
    highlights: ["Das Team", "Echte Paare", "Facebook, Instagram & YouTube", "Direkter Kontakt"],
    sectionEyebrow: "Mehr über uns",
    sectionTitle: "Wo willst du weiterlesen?",
    sectionLead: "Such dir aus, was dich interessiert.",
    cards: [
      internalCard("expertenteam", "Das Team", "Unser Expertenteam", "Wer die Artikel im Magazin schreibt und wer die Plattform betreibt.", "✎", "Team kennenlernen", {
        src: "/about/dich-mit-stich-ueber-uns-expertenteam.webp",
        alt: "Datingexperte Christian M. Haas lächelt in die Kamera",
        bleed: true,
      }),
      internalCard("erfolgsgeschichten", "Echte Paare", "Erfolgsgeschichten", "Drei Paare erzählen, wie sie sich bei uns gefunden haben.", "♥", "Geschichten lesen", {
        src: "/about/dich-mit-stich-ueber-uns-erfolgsgeschichten.webp",
        alt: "Pascal und Stephanie, ein Paar aus der Dich-mit-Stich-Community",
        bleed: true,
      }),
      internalCard("social-media", "Folg uns", "Social Media", "Du findest uns auf Facebook, Instagram und YouTube.", "◎", "Zu unseren Kanälen", {
        src: "/about/dich-mit-stich-ueber-uns-social-media.webp",
        alt: "Tätowiertes Paar liegt lachend im Bett",
        bleed: true,
      }),
      internalCard("bewertungen", "Was andere sagen", "Bewertungen", "Was Mitglieder auf Trustpilot über uns schreiben.", "★", "Bewertungen ansehen", {
        src: "/about/dich-mit-stich-ueber-uns-bewertungen.webp",
        alt: "Zwei Hände mit Partner-Tattoos, Vogel und offener Käfig",
        bleed: true,
      }),
      internalCard("kooperationen", "Zusammenarbeit", "Kooperationen", "Du hast ein Studio, einen Kanal oder ein Magazin? Lass uns etwas zusammen machen.", "↗", "Mehr zu Kooperationen", {
        src: "/about/dich-mit-stich-ueber-uns-kooperationen.webp",
        alt: "Tätowiererin arbeitet in ihrem Studio an einem Tattoo",
        bleed: true,
      }),
    ],
    primaryCta: { label: "Lern das Team kennen", href: aboutPath("expertenteam") },
    secondaryCta: { label: "Kostenlos registrieren", href: locationRegistrationUrl(market), external: true },
  };
}

function expertPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "expertenteam",
    path: aboutPath("expertenteam"),
    eyebrow: "Das Team",
    title: "Unser Expertenteam",
    description: "Wer bei Dich mit Stich schreibt und wer die Plattform betreibt.",
    lead: "Hinter Dich mit Stich stecken echte Menschen: Christian schreibt übers Daten, Anne über Tattoos. Um Technik und Datenschutz kümmert sich die Icony GmbH.",
    highlights: ["Dating-Know-how", "Tattoo-Wissen", "Autorenprofile", "Betrieb: Icony GmbH"],
    sectionEyebrow: "Wer wir sind",
    sectionTitle: "Die Menschen hinter Dich mit Stich",
    sectionLead: "Zwei Stimmen im Magazin, eine Firma im Hintergrund.",
    cards: expertCards,
    primaryCta: { label: "Erfolgsgeschichten lesen", href: aboutPath("erfolgsgeschichten") },
    secondaryCta: { label: "Zurück zu Über uns", href: ABOUT_ROOT_PATH },
  };
}

function storiesPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "erfolgsgeschichten",
    path: aboutPath("erfolgsgeschichten"),
    eyebrow: "Echte Paare",
    title: "Erfolgsgeschichten bei Dich mit Stich",
    description: "Paare, die sich über Dich mit Stich gefunden haben, erzählen ihre Geschichte.",
    lead: "Erst ein Profil, dann die erste Nachricht, irgendwann das erste Date: Diese Paare erzählen, wie es bei ihnen angefangen hat.",
    highlights: ["Pascal & Stephanie", "Katharina & Philip", "Andreas & Do", "selbst erzählt"],
    sectionEyebrow: "Aus der Community",
    sectionTitle: "Drei Geschichten, drei eigene Wege",
    sectionLead: "Jede Liebesgeschichte läuft anders, eine Garantie gibt es beim Daten nicht. Aber diese drei zeigen, dass es klappen kann.",
    cards: storyCards,
    primaryCta: { label: "Jetzt kostenlos anmelden", href: locationRegistrationUrl(market), external: true },
    secondaryCta: { label: "Zurück zu Über uns", href: ABOUT_ROOT_PATH },
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
    sectionTitle: "Mit wem wir gern zusammenarbeiten",
    sectionLead: "Schreib uns kurz, wer du bist, wen du erreichst und was du dir vorstellst.",
    cards: [
      { eyebrow: "Vor Ort", title: "Tattoo- und Piercing-Studios", text: "Gemeinsame Aktionen, lokale Guides oder eine Empfehlung im Studio – Hauptsache, es passt zur Szene.", icon: "◆" },
      { eyebrow: "Reichweite", title: "Creator & Social Media", text: "Beiträge, Stories oder Videos rund um Tattoos, Piercings und Dating.", icon: "◎" },
      { eyebrow: "Inhalte", title: "Medien & Communities", text: "Interviews, Gastbeiträge und gemeinsame Themen für eure Leserinnen und Leser.", icon: "✦" },
    ],
    detailSections: [
      {
        eyebrow: "Wen wir suchen",
        title: "Partner aus der Tattoo- und Piercing-Szene",
        paragraphs: [
          "Dich mit Stich bringt tätowierte und gepiercte Singles zusammen. Dafür suchen wir Partner aus der Szene, deren Community etwas davon hat.",
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
          "35 % Provision pro Sale – das sind aktuell 13,96 bis 58,38 Euro pro vermittelter Premium-Mitgliedschaft.",
          "Lifetime-Provision: Auch bei Verlängerungen einer vermittelten Premium-Mitgliedschaft werden 35 % vergütet.",
          "Schnelle Freigabe: Provisionen werden in weniger als drei Tagen freigegeben.",
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
          "Nicht jede gute Idee passt in ein Partnerprogramm. Du hast ein Studio, einen Shop, ein Magazin, eine Fanseite oder einen Kanal? Dann schreib uns, was du vorhast und wen du damit erreichst.",
          "Wir melden uns und schauen gemeinsam, was daraus werden kann: eine Aktion, ein Artikel, ein Stadt-Guide oder etwas ganz anderes.",
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
    secondaryCta: { label: "Zurück zu Über uns", href: ABOUT_ROOT_PATH },
  };
}

function reviewsPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "bewertungen",
    path: aboutPath("bewertungen"),
    eyebrow: "Was andere sagen",
    title: "Bewertungen und Erfahrungen zu Dich mit Stich",
    description: "Was Mitglieder über Dich mit Stich sagen: Bewertungen auf Trustpilot und Geschichten aus der Community.",
    lead: "Statt hier Sterne abzudrucken, die morgen schon veraltet sind, schicken wir dich direkt zu Trustpilot. Dort liest du, was Mitglieder gerade über uns schreiben.",
    highlights: ["Trustpilot", "immer aktuell", "echte Paare", "kostenlos testen"],
    sectionEyebrow: "Mach dir selbst ein Bild",
    sectionTitle: "Drei Wege, uns kennenzulernen",
    sectionLead: "Lies, was andere schreiben, lies die Geschichten unserer Paare oder schau dich einfach selbst kostenlos um.",
    cards: [
      {
        eyebrow: "Trustpilot",
        title: "Bewertungen auf Trustpilot",
        text: "Hier schreiben Mitglieder, was ihnen gefällt – und was nicht. Lob gibt es vor allem für die Community-Atmosphäre, das Design und dass hier niemand schräg für seine Tattoos angeschaut wird.",
        icon: "★",
        image: {
          src: "/about/dich-mit-stich-bewertungen-trustpilot.webp",
          alt: "Lächelnde Frau mit Daumen hoch",
          bleed: true,
        },
        link: { label: "Trustpilot öffnen", href: "https://de.trustpilot.com/review/dich-mit-stich.de", external: true },
      },
      internalCard("erfolgsgeschichten", "Echte Paare", "Erfolgsgeschichten", "Drei Paare erzählen, wie sie sich bei uns gefunden haben.", "♥", "Geschichten lesen", {
        src: "/about/dich-mit-stich-ueber-uns-erfolgsgeschichten.webp",
        alt: "Pascal und Stephanie, ein Paar aus der Dich-mit-Stich-Community",
        bleed: true,
      }),
      {
        eyebrow: "Selbst ausprobieren",
        title: "Kostenlos umsehen",
        text: "Melde dich kostenlos an und schau, wer in deiner Nähe dabei ist.",
        icon: "→",
        widget: "icony-registration",
      },
      {
        eyebrow: "Vergleichsportal",
        title: "Empfohlen auf singleboersen-ueberblick.de",
        text: "Besonders hervorgehoben wird unsere Nischen-Zielgruppe: Menschen, die Tattoos lieben oder selbst tätowiert sind.",
        icon: "✓",
        image: {
          src: "/about/dich-mit-stich-bewertungen-siegel-singleboersen-ueberblick.webp",
          alt: "Empfehlungssiegel von singleboersen-ueberblick.de",
          fit: "contain",
        },
        link: { label: "Testbericht lesen", href: "https://singleboersen-ueberblick.de/partnersuche/dich-mit-stich/", external: true },
      },
      {
        eyebrow: "Vergleichsportal",
        title: "Bewertet auf singleboersen-vergleichen.de",
        text: "Als authentisch und bodenständig beschrieben – echtes Dating mit Leuten, die eine gemeinsame Leidenschaft teilen.",
        icon: "✓",
        image: {
          src: "/about/dich-mit-stich-bewertungen-siegel-singleboersen-vergleichen.webp",
          alt: "Bewertungssiegel von singleboersen-vergleichen.de",
          fit: "contain",
        },
        link: { label: "Bewertung lesen", href: "https://www.singleboersen-vergleichen.de/singleportal/dich-mit-stich/", external: true },
      },
    ],
    detailSections: [
      {
        eyebrow: "Warum sich eine Anmeldung lohnt",
        title: "Für tätowierte Singles gemacht",
        paragraphs: [
          "Tätowierte Singles haben es auf Mainstream-Dating-Plattformen oft schwer, weil nicht jeder ihre Leidenschaft versteht. Bei Dich mit Stich triffst du von Anfang an auf Menschen, die Tattoos feiern – egal, ob Old School, Blackwork oder Fine Line. Hier entstehen nicht nur Dates, sondern echte Verbindungen, aus denen Freundschaften oder Beziehungen werden können.",
          "Ein weiterer Vorteil ist die offene und kreative Community. Neben klassischen Flirts gibt es Foren und Gruppen zu Tattoo-Trends, Künstler-Empfehlungen oder Tattoo-Aftercare. Wer sich hier anmeldet, bekommt also nicht nur spannende Matches, sondern auch Input für das nächste Motiv.",
        ],
        cta: { label: "Kostenlos registrieren", href: locationRegistrationUrl(market), external: true },
      },
    ],
    primaryCta: { label: "Aktuelle Bewertungen ansehen", href: "https://de.trustpilot.com/review/dich-mit-stich.de", external: true },
    secondaryCta: { label: "Zurück zu Über uns", href: ABOUT_ROOT_PATH },
  };
}

function socialPage(market: MarketCode): AboutPage {
  return {
    market,
    slug: "social-media",
    path: aboutPath("social-media"),
    eyebrow: "Dich mit Stich auf Social Media",
    title: "Social Media von Dich mit Stich",
    description: "Die offiziellen Facebook-, Instagram-, YouTube- und Pinterest-Kanäle von Dich mit Stich.",
    lead: "Folge Dich mit Stich für Community-Einblicke, Tattoo- und Piercingthemen sowie neue Videos aus der Szene.",
    highlights: ["Facebook", "Instagram", "YouTube", "Pinterest"],
    sectionEyebrow: "Kanäle & Community",
    sectionTitle: "Hier findest du uns noch",
    sectionLead: "Ein Klick, und du bist auf unserem Profil.",
    cards: socialCards,
    primaryCta: { label: "Facebook öffnen", href: "https://www.facebook.com/dichmitstich/", external: true },
    secondaryCta: { label: "Zurück zu Über uns", href: ABOUT_ROOT_PATH },
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
