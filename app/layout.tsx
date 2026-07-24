import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

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
  description: "Tattoo-, Piercing- und Szene-Dating mit Magazin, Stadtseiten und echten Erfolgsgeschichten im Stil eines sauberen elFlirt-Frontends.",
  metadataBase: new URL("https://dich-mit-stich.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
