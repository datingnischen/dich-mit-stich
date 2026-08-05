import type { ReactNode } from "react";
import { SiteFrame } from "@/components/site-frame";

export default function MagazineLayout({ children }: { children: ReactNode }) {
  return <SiteFrame market="de">{children}</SiteFrame>;
}