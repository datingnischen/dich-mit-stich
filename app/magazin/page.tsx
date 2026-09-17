import type { Metadata } from "next";
import { MagazineOverview } from "@/components/magazine-overview";
import { publicUrl } from "@/lib/markets";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Flirtradar: Tattoo-, Piercing- & Szene-Magazin",
  description: "Tattoo-Wissen, Piercing-Ratgeber, Motive und echte Geschichten: Entdecke fundierte Artikel für Menschen mit eigenem Stil.",
  alternates: { canonical: publicUrl("de", "/magazin") },
};

export default function MagazineOverviewPage() {
  return <MagazineOverview market="de" />;
}
