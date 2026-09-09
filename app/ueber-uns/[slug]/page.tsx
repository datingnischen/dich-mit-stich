import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutPageView, aboutPageMetadata } from "@/components/about-page";
import { ABOUT_SLUGS, getAboutPage } from "@/lib/about-pages";

export function generateStaticParams() {
  return ABOUT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getAboutPage("de", slug);
  return page ? aboutPageMetadata(page) : {};
}

export default async function UeberUnsSubpage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getAboutPage("de", slug);
  if (!page) notFound();

  return <AboutPageView page={page} />;
}
