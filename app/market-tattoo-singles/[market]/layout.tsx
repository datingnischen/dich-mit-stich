import type { ReactNode } from "react";
import { SiteFrame } from "@/components/site-frame";

export default function ChTattooSinglesLayout({ children }: { children: ReactNode }) {
  return <SiteFrame market="ch" sectionLive>{children}</SiteFrame>;
}
