import { permanentRedirect } from "next/navigation";

import { getTattooStudio } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ slug: string }> };

// Studio-Detailseiten sind seit 2026-09-28 abgeschaltet (nginx leitet /tattoo-studio/ nicht an Vercel,
// live lieferten alle 191 Profile 404). Alte Adressen führen auf den Stadt-Guide des Studios.
export default async function RetiredTattooStudioPage({ params }: PageProps) {
  const { slug } = await params;
  const studio = getTattooStudio("de", slug);
  permanentRedirect(studio ? `/tattoo-studios/${studio.citySlug}/` : "/tattoo-studios/");
}
