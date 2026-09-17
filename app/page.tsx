import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { publicUrl } from "@/lib/markets";

export const metadata: Metadata = {
  alternates: { canonical: publicUrl("de") },
};

export default function Page() {
  return <HomePage market="de" />;
}
