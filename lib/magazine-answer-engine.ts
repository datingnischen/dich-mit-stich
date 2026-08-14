export type EditorialSource = {
  name: string;
  url: string;
};

export type AnswerEnginePilotEntry = {
  cmsId: number;
  slug: string;
  cluster: "tattoo" | "piercing";
  priority: number;
  revisionMode: "strengthen" | "substantial-revision";
  why: string;
  heading: string;
  directAnswer: string;
  keyFacts: string[];
  reviewedAt: string;
  reviewedAtLabel: string;
  sources: EditorialSource[];
};

const PIERCING_SOURCES: EditorialSource[] = [
  {
    name: "Association of Professional Piercers: Pflegehinweise für Körperpiercings",
    url: "https://safepiercing.org/aftercare/",
  },
  {
    name: "Association of Professional Piercers: Schmuck für neue Piercings",
    url: "https://safepiercing.org/jewelry-for-initial-piercings/",
  },
  {
    name: "NHS: Entzündete Piercings – Warnzeichen und medizinische Hilfe",
    url: "https://www.nhs.uk/conditions/infected-piercings/",
  },
];

const TATTOO_SAFETY_SOURCES: EditorialSource[] = [
  {
    name: "FDA: Think Before You Ink – Tattoo Safety",
    url: "https://www.fda.gov/consumers/consumer-updates/think-you-ink-tattoo-safety",
  },
  {
    name: "FDA: Tattoos & Permanent Makeup – Fact Sheet",
    url: "https://www.fda.gov/cosmetics/cosmetic-products/tattoos-permanent-makeup-fact-sheet",
  },
];

const TATTOO_REMOVAL_SOURCE: EditorialSource = {
  name: "FDA: Tattoo Removal – Options and Results",
  url: "https://www.fda.gov/consumers/consumer-updates/tattoo-removal-options-and-results",
};

const REVIEWED_AT = "2026-08-14";
const REVIEWED_AT_LABEL = "14.08.2026";

const pilotEntries: AnswerEnginePilotEntry[] = [
  {
    cmsId: 848,
    slug: "anti-eyebrow-piercing",
    cluster: "piercing",
    priority: 1,
    revisionMode: "substantial-revision",
    why: "Bereits fachlich überarbeiteter Piercing-Pilot und Referenz für sichere Gesundheitskommunikation.",
    heading: "Anti-Eyebrow-Piercing kurz erklärt",
    directAnswer:
      "Ein Anti-Eyebrow-Piercing ist ein Oberflächenpiercing unterhalb des äußeren Augenbereichs. Ob die Platzierung sinnvoll ist, hängt von der individuellen Anatomie, geeignetem Erstschmuck und einer professionellen Nachsorge ab.",
    keyFacts: [
      "Die Position muss vor Ort anatomisch beurteilt werden.",
      "Schmuckform und Maße gehören in die Hände eines qualifizierten Studios.",
      "Zunehmende Schmerzen, Wärme, Rötung oder eitrige Sekretion sollten medizinisch abgeklärt werden.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: PIERCING_SOURCES,
  },
  {
    cmsId: 1187,
    slug: "industrial-piercing",
    cluster: "piercing",
    priority: 2,
    revisionMode: "strengthen",
    why: "Starke konkrete Suchintention mit hohem Bedarf an anatomischer Einordnung und sicherer Nachsorge.",
    heading: "Industrial Piercing kurz erklärt",
    directAnswer:
      "Bei einem Industrial Piercing verbindet ein Schmuckstab meist zwei Stichkanäle am Ohr. Entscheidend sind eine passende Ohranatomie, druckfreier Erstschmuck und eine Pflege, die unnötige Bewegung und Reibung vermeidet.",
    keyFacts: [
      "Nicht jede Ohrform bietet genügend Platz für eine sichere Ausrichtung.",
      "Beide Stichkanäle müssen ohne anhaltenden Druck verbunden werden können.",
      "Auffällige Entzündungszeichen gehören professionell beurteilt.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: PIERCING_SOURCES,
  },
  {
    cmsId: 509,
    slug: "christina-piercing",
    cluster: "piercing",
    priority: 3,
    revisionMode: "strengthen",
    why: "Reichweitenstarker Intimpiercing-Ratgeber mit besonderem Bedarf an diskreter, anatomiebezogener Orientierung.",
    heading: "Christina-Piercing kurz erklärt",
    directAnswer:
      "Das Christina-Piercing ist ein oberflächlich gesetztes Intimpiercing am Venushügel. Es eignet sich nicht für jede Anatomie und sollte erst nach persönlicher Beurteilung durch ein erfahrenes Studio geplant werden.",
    keyFacts: [
      "Die anatomische Eignung lässt sich nicht anhand eines Fotos sicher beurteilen.",
      "Passender Erstschmuck muss Platzierung und mögliche Schwellung berücksichtigen.",
      "Reibung, Druck und auffällige Veränderungen sollten frühzeitig besprochen werden.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: PIERCING_SOURCES,
  },
  {
    cmsId: 374,
    slug: "septum-piercing",
    cluster: "piercing",
    priority: 4,
    revisionMode: "strengthen",
    why: "Zentrale Piercingart mit breiter Suchintention und häufig pauschal dargestellten Schmerz- und Platzierungsfragen.",
    heading: "Septum-Piercing kurz erklärt",
    directAnswer:
      "Ein Septum-Piercing verläuft durch geeignetes Gewebe an der Nasenscheidewand. Die genaue Position ist anatomieabhängig und sollte von einem qualifizierten Piercingstudio markiert und beurteilt werden.",
    keyFacts: [
      "Die korrekte Position ist wichtiger als eine pauschale Schmerzeinschätzung.",
      "Erstschmuck und Pflege müssen zur individuellen Platzierung passen.",
      "Zunehmende Beschwerden oder Infektionszeichen erfordern fachlichen Rat.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: PIERCING_SOURCES,
  },
  {
    cmsId: 520,
    slug: "rook-piercing",
    cluster: "piercing",
    priority: 5,
    revisionMode: "strengthen",
    why: "Beliebte Ohrpiercing-Suche, bei der Anatomie, Druckbelastung und alltagstaugliche Pflege entscheidend sind.",
    heading: "Rook Piercing kurz erklärt",
    directAnswer:
      "Das Rook Piercing sitzt in einer inneren Knorpelfalte des Ohrs. Ob dort sicher gepierct werden kann, hängt von der Ausprägung dieser Falte, der geplanten Ausrichtung und geeignetem Schmuck ab.",
    keyFacts: [
      "Die Ohrfalte muss ausreichend ausgeprägt und individuell beurteilt werden.",
      "Druck durch Schlafen, Kopfhörer oder ungeeigneten Schmuck kann die Stelle reizen.",
      "Pflege bedeutet vor allem saubere Hände und möglichst wenig unnötige Bewegung.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: PIERCING_SOURCES,
  },
  {
    cmsId: 202,
    slug: "erste-tattoo-stechen-lassen",
    cluster: "tattoo",
    priority: 6,
    revisionMode: "strengthen",
    why: "Zentraler Einstieg für neue Tattoo-Interessierte und glaubwürdiger Knoten für Planung, Studio und Nachsorge.",
    heading: "Das erste Tattoo kurz geplant",
    directAnswer:
      "Vor dem ersten Tattoo sollten Motiv, Körperstelle, Studio und Nachsorge gemeinsam geplant werden. Eine seriöse Entscheidung berücksichtigt, dass Tätowierungen dauerhaft sind und Hautreaktionen oder Infektionen trotz guter Vorbereitung nicht vollständig ausgeschlossen werden können.",
    keyFacts: [
      "Lass dir Hygiene, verwendete Farben und Nachsorge verständlich erklären.",
      "Plane Motiv und Platzierung ohne Zeitdruck.",
      "Bei ungewöhnlichen oder stärker werdenden Hautreaktionen ist medizinischer Rat sinnvoll.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: TATTOO_SAFETY_SOURCES,
  },
  {
    cmsId: 571,
    slug: "tattoo-studio",
    cluster: "tattoo",
    priority: 7,
    revisionMode: "strengthen",
    why: "Hohe Entscheidungsnähe und direkter Bezug zur nachweisbaren eigenen Tattoo-Studio-Guide-Kompetenz der Marke.",
    heading: "Ein gutes Tattoo-Studio erkennen",
    directAnswer:
      "Ein gutes Tattoo-Studio arbeitet nachvollziehbar hygienisch, berät ehrlich zu Motiv und Platzierung und erklärt Farben, Ablauf sowie Nachsorge. Portfolio und Stil müssen zum Wunschmotiv passen; Zeitdruck oder ausweichende Antworten sind schlechte Entscheidungsgrundlagen.",
    keyFacts: [
      "Frage nach Hygieneablauf, Farben und schriftlicher Nachsorge.",
      "Prüfe verheilte Arbeiten, nicht nur frisch fotografierte Tattoos.",
      "Eine seriöse Beratung benennt Grenzen und mögliche Risiken.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: TATTOO_SAFETY_SOURCES,
  },
  {
    cmsId: 239,
    slug: "tattoo-entfernen",
    cluster: "tattoo",
    priority: 8,
    revisionMode: "substantial-revision",
    why: "Medizinisch sensible Evergreen-Frage mit hohem Zitierpotenzial und klarer offizieller FDA-Primärquelle.",
    heading: "Tattoo entfernen kurz erklärt",
    directAnswer:
      "Laserbehandlungen sind die häufigste medizinische Methode, um permanente Tattoos aufzuhellen oder zu entfernen. Meist sind mehrere Sitzungen nötig; das Ergebnis hängt unter anderem von Farben, Größe und Tiefe ab, und eine vollständige Entfernung ist nicht immer möglich.",
    keyFacts: [
      "Unterschiedliche Farben können unterschiedliche Laser erfordern.",
      "Mögliche Risiken sind unter anderem Narben, Infektionen und Pigmentveränderungen.",
      "Die FDA hat keine Tattoo-Entfernungscremes oder DIY-Kits zugelassen.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: [TATTOO_REMOVAL_SOURCE],
  },
  {
    cmsId: 879,
    slug: "wie-gefaehrlich-tattoo",
    cluster: "tattoo",
    priority: 9,
    revisionMode: "substantial-revision",
    why: "Sicherheitskritische Kernfrage, die eine nüchterne Risikoabwägung statt alarmistischer Pauschalaussagen benötigt.",
    heading: "Tattoo-Risiken realistisch eingeordnet",
    directAnswer:
      "Tätowieren verletzt die Hautbarriere und ist deshalb nicht völlig risikofrei. Mögliche Probleme reichen von Infektionen und allergischen Reaktionen bis zu unerwünschten Narben; hygienisches Arbeiten und nachvollziehbare Farben reduzieren Risiken, beseitigen sie aber nicht vollständig.",
    keyFacts: [
      "Achte auf ein hygienisch arbeitendes Studio und transparente Produktangaben.",
      "Bekannte Allergien oder Hauterkrankungen sollten vorab medizinisch besprochen werden.",
      "Stärkere oder anhaltende Reaktionen gehören professionell abgeklärt.",
    ],
    reviewedAt: REVIEWED_AT,
    reviewedAtLabel: REVIEWED_AT_LABEL,
    sources: TATTOO_SAFETY_SOURCES,
  },
];

const pilotBySlug = new Map(pilotEntries.map((entry) => [entry.slug, entry]));

export function getAnswerEnginePilotEntry(slug: string): AnswerEnginePilotEntry | null {
  return pilotBySlug.get(slug) ?? null;
}

export function getAnswerEnginePilotEntries(): readonly AnswerEnginePilotEntry[] {
  return pilotEntries;
}
