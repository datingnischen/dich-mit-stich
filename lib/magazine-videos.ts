export type MagazineVideo = {
  videoId: string;
  title: string;
  description: string;
  embedTitle: string;
};

/** Videos from the Dich-mit-Stich YouTube channel, pinned to the article that covers the same subject. */
const magazineVideos: Record<string, MagazineVideo> = {
  "christina-piercing": {
    videoId: "p4-qTtyMegM",
    title: "Christina-Piercing im Video erklärt",
    description:
      "Position, Schmerzen, Heilung, Pflege und mögliche Risiken kompakt zusammengefasst.",
    embedTitle: "Christina-Piercing: Schmerzen, Heilung, Pflege und Risiken",
  },
  "conch-piercing": {
    videoId: "r4n8QoYg9kk",
    title: "Conch-Piercing im Video erklärt",
    description:
      "Inner und Outer Conch, Schmerzen, Heilung, Pflege und Schmuck kompakt zusammengefasst.",
    embedTitle: "Conch-Piercing: Schmerzen, Heilung, Pflege und Schmuck",
  },
  "daith-piercing": {
    videoId: "nJKK6iryQMM",
    title: "Daith-Piercing im Video erklärt",
    description:
      "Ablauf beim Stechen, Heilungsdauer und die richtige Pflege der Knorpelfalte im Überblick.",
    embedTitle: "Daith-Piercing: Ablauf, Heilung und Pflege",
  },
  "geometric-sleeve-tattoo": {
    videoId: "_cDNxx51mYg",
    title: "Geometric Tattoos im Video erklärt",
    description:
      "Wie Linien, Symmetrie und geometrische Muster zu einem stimmigen Motiv zusammenfinden.",
    embedTitle: "Geometric Tattoos: Kunst, Mathematik und Symmetrie",
  },
  "helix-piercing": {
    videoId: "8lRrFRJQ2H4",
    title: "Helix-Piercing im Video erklärt",
    description:
      "Ablauf beim Stechen, Heilungsdauer und die richtige Pflege am äußeren Ohrknorpel.",
    embedTitle: "Helix-Piercing: Ablauf, Heilung und Pflege",
  },
  "industrial-piercing": {
    videoId: "hCaRdr5atyg",
    title: "Industrial-Piercing im Video erklärt",
    description:
      "Wie die beiden Stichkanäle verbunden werden, wie lange die Heilung dauert und worauf die Pflege achtet.",
    embedTitle: "Industrial-Piercing: Ablauf, Heilung und Pflege",
  },
  "japanische-tattoos": {
    videoId: "P5uKLhT7JHc",
    title: "Japanische Tattoos im Video erklärt",
    description:
      "Geschichte, typische Motive und die Bedeutung hinter der traditionellen japanischen Tätowierkunst.",
    embedTitle: "Japanische Tattoos: Geschichte, Motive und Bedeutung",
  },
  "neo-traditional-sleeve-tattoo": {
    videoId: "E9QDKjdBZIc",
    title: "Neo-Traditional Tattoos im Video erklärt",
    description:
      "Stilmerkmale, typische Motive und die Farbwelt des Neo-Traditional im Überblick.",
    embedTitle: "Neo-Traditional Tattoos: Stil, Motive und Farben",
  },
  "old-school-tattoos": {
    videoId: "KXMrJED2EGU",
    title: "Old-School Tattoos im Video erklärt",
    description:
      "Herkunft, Bildsprache und die Bedeutungen hinter den klassischen Old-School-Motiven.",
    embedTitle: "Old-School Tattoos: Geschichte, Stil und Bedeutungen",
  },
  "orbital-piercing": {
    videoId: "OGkd3VD4Ce0",
    title: "Orbital-Piercing im Video erklärt",
    description:
      "Ablauf beim Stechen, Heilungsdauer und die richtige Pflege der zwei verbundenen Stichkanäle.",
    embedTitle: "Orbital-Piercing: Ablauf, Heilung und Pflege",
  },
  "prinz-albert-piercing": {
    videoId: "xvE4QhRWWW8",
    title: "Prinz-Albert-Piercing im Video erklärt",
    description:
      "Ablauf beim Stechen, Heilungsdauer und die richtige Pflege des Intimpiercings.",
    embedTitle: "Prinz-Albert-Piercing: Ablauf, Heilung und Pflege",
  },
  "rook-piercing": {
    videoId: "q_mA5A7F4sE",
    title: "Rook-Piercing im Video erklärt",
    description:
      "Schmerzen, Heilungsdauer, Pflege und passender Schmuck für die innere Knorpelfalte.",
    embedTitle: "Rook-Piercing: Schmerzen, Heilung, Pflege und Schmuck",
  },
  "septum-piercing": {
    videoId: "vG8VdAVOWa0",
    title: "Septum-Piercing im Video erklärt",
    description:
      "Ablauf beim Stechen, Heilungsdauer und die richtige Pflege an der Nasenscheidewand.",
    embedTitle: "Septum-Piercing: Ablauf, Heilung und Pflege",
  },
  "tattoo-schriftzuege-schriftarten": {
    videoId: "sp49itXJwSQ",
    title: "Lettering Tattoos im Video erklärt",
    description:
      "Schriftarten, Platzierung und worauf du bei einem Schriftzug auf der Haut achten solltest.",
    embedTitle: "Lettering Tattoos: Bedeutung, Stil und Tipps",
  },
  "tragus-piercing": {
    videoId: "6GXf4hKS5WA",
    title: "Tragus-Piercing im Video erklärt",
    description:
      "Schmerzen, Heilungsdauer, Pflege und passender Schmuck für den kleinen Ohrknorpel.",
    embedTitle: "Tragus-Piercing: Schmerzen, Heilung, Pflege und Schmuck",
  },
  "trash-polka-sleeve-tattoo": {
    videoId: "1QCgdwijf5Y",
    title: "Trash Polka Tattoos im Video erklärt",
    description:
      "Wie Realismus, Schrift und grafische Elemente in Schwarz und Rot zusammenspielen.",
    embedTitle: "Trash Polka Tattoos: Der moderne Kunststil in Schwarz und Rot",
  },
  "watercolor-sleeve-tattoo": {
    videoId: "BjiwmwC8EOs",
    title: "Watercolor Tattoos im Video erklärt",
    description:
      "Wie der Aquarell-Look entsteht, welche Motive passen und was er für die Haltbarkeit bedeutet.",
    embedTitle: "Watercolor Tattoos: künstlerisch, leicht und kreativ",
  },
};

export function getMagazineVideo(slug: string): MagazineVideo | null {
  return magazineVideos[slug] ?? null;
}
