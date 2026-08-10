import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ market: string }>;
};

export default async function MarketTattooStudioLayout({ children, params }: LayoutProps) {
  if ((await params).market !== "ch") notFound();
  return <SiteFrame market="ch" sectionLive>{children}</SiteFrame>;
}
