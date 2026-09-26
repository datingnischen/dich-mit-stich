import type { Metadata } from "next";
import { MagazineAuthor } from "@/components/magazine-author";
import { getAuthorProfile, getKnownAuthorSlugs } from "@/lib/author-profiles";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { publicUrl } from "@/lib/markets";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const slugs = await getKnownAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAuthorProfile(slug);
  if (!profile) return {};
  return {
    title: `${profile.name}: Beiträge im Tattoo-Magazin`,
    description: profile.bio.slice(0, 155),
    alternates: { canonical: publicUrl("de", profile.profileUrl) },
    robots: marketEditorialRobots("de"),
  };
}

export default async function MagazineAuthorPage({ params }: PageProps) {
  return <MagazineAuthor market="de" slug={(await params).slug} />;
}
