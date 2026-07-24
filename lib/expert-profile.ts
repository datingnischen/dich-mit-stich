import { cache } from "react";
import { getMagazineEntryBySlug, stripHtml } from "@/lib/wordpress";

export type ExpertProfile = {
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
  profileUrl: string;
  facts: string[];
};

function firstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() || "";
}

export const getDatingExpertProfile = cache(async (): Promise<ExpertProfile | null> => {
  const entry = await getMagazineEntryBySlug("unser-datingexperte");
  if (!entry) return null;

  const role = stripHtml(firstMatch(entry.content, /<h2[^>]*>([\s\S]*?)<\/h2>/i)) || "Datingexperte für tätowierte Singles";
  const imageUrl = firstMatch(entry.content, /<img[^>]+src="([^"]+)"/i) || undefined;
  const bio = stripHtml(entry.excerpt || entry.content).slice(0, 260);

  return {
    name: entry.title || "Christian M. Haas",
    role,
    bio,
    imageUrl,
    profileUrl: "/magazin/unser-datingexperte",
    facts: [
      "Über 20 Jahre Erfahrung im Online-Dating",
      "Fokus auf Zielgruppen-Communities und echte Kontakte",
      "Begleitet Dich mit Stich als Experte und Berater",
    ],
  };
});
