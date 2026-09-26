import type { Metadata } from "next";
import { MagazineDetail } from "@/components/magazine-detail";
import { getAuthorProfilePage } from "@/lib/author-profile-pages";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { getAnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { getMagazineQuarantineDescription, isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { getMagazineEditorialOverride } from "@/lib/magazine-editorial-overrides";
import { magazineMetaTitle } from "@/lib/magazine-seo";
import { publicUrl } from "@/lib/markets";
import { getMagazineEntryBySlug, getMagazineRouteEntries, teaserText } from "@/lib/wordpress";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const entries = await getMagazineRouteEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) return {};
  const quarantined = isMagazineArticleQuarantined(slug);
  const editorialOverride = getMagazineEditorialOverride(slug);
  const answerEngineEntry = getAnswerEnginePilotEntry(slug);
  const authorProfilePage = getAuthorProfilePage(slug);
  return {
    title: magazineMetaTitle(entry),
    description: quarantined
      ? getMagazineQuarantineDescription()
      : authorProfilePage?.lead ?? entry.seoDescription ?? answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? teaserText(entry, 155),
    alternates: { canonical: publicUrl("de", `/magazin/${slug}`) },
    robots: marketEditorialRobots("de", quarantined),
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  return <MagazineDetail market="de" slug={(await params).slug} />;
}
