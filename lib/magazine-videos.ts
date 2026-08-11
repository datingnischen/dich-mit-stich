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
};

export function getMagazineVideo(slug: string): MagazineVideo | null {
  return magazineVideos[slug] ?? null;
}
