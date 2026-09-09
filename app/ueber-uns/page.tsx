import { AboutPageView, aboutPageMetadata } from "@/components/about-page";
import { getAboutPage } from "@/lib/about-pages";

const page = getAboutPage("de", null)!;

export const metadata = aboutPageMetadata(page);

export default function UeberUnsPage() {
  return <AboutPageView page={page} />;
}
