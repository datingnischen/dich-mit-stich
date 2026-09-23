import type { Metadata } from "next";

import { FaqPageView } from "@/components/faq-page";
import { FAQ_PATH } from "@/lib/faq";
import { marketLanguageAlternates, publicUrl } from "@/lib/markets";

const title = "Häufig gestellte Fragen zu Dich mit Stich";
const description = "Antworten zu Anmeldung, Mitgliedschaft, Kosten, Funktionen, Sicherheit, Datenschutz und Support bei Dich mit Stich.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: publicUrl("de", FAQ_PATH), languages: marketLanguageAlternates(FAQ_PATH) },
  openGraph: {
    type: "website",
    title,
    description,
    url: publicUrl("de", FAQ_PATH),
    siteName: "Dich mit Stich",
    locale: "de_DE",
  },
};

export default function FaqPage() {
  return <FaqPageView market="de" />;
}
