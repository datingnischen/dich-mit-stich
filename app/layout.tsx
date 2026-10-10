import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Open_Sans } from "next/font/google";
import { staticAsset, assetHost } from "@/lib/static-asset";
import "./globals.css";
import "./ink-theme.css";
import { Analytics } from "@vercel/analytics/next";
import { vercelAnalyticsProps } from "@/lib/vercel-analytics";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

// Display-Schrift für große Überschriften (ink-theme.css).
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dich mit Stich – Tattoo-, Piercing- & Szene-Magazin",
    template: "%s | Dich mit Stich",
  },
  description: "Tattoo-, Piercing- und Szene-Dating mit Magazin, Stadtseiten und echten Erfolgsgeschichten in einer klaren, vertrauensvollen Oberfläche.",
  metadataBase: new URL("https://dich-mit-stich.de"),
  // Absolut vom Vercel-Host: nginx vor den Live-Domains reicht nur Seitenrouten weiter.
  icons: {
    icon: staticAsset("/brand/icon.png"),
    apple: staticAsset("/brand/apple-icon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${openSans.variable} ${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}<Analytics {...vercelAnalyticsProps(assetHost)} /></body>
    </html>
  );
}
