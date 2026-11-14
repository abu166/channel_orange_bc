import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, DM_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

// Editorial serif for headlines, DM Sans for everything functional, DM Mono only for identifiers (PMIDs, DOIs).
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-dm-serif" });
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "VetoHealth: check the claim before you believe it",
  description: "Paste a health claim from a Reel, TikTok or label. VetoHealth splits it into atomic claims, pulls real PubMed evidence (including studies that disagree) and shows a transparent verdict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-canvas text-fg">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-5 focus:py-3 focus:text-white">Skip to content</a>
        <Nav />
        <main id="main-content" className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
