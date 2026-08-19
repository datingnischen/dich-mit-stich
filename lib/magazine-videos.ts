export type MagazineVideo = {
  videoId: string;
  title: string;
  description: string;
  embedTitle: string;
};

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
};

export function getMagazineVideo(slug: string): MagazineVideo | null {
  return magazineVideos[slug] ?? null;
}
