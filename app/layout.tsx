import type { Metadata } from "next";
import { Newsreader, Manrope, DM_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

// Newsreader: a serif drawn for publications (optical sizes), fits "independent scientific publication".
// Manrope: modern, highly legible UI sans with clear numerals for prices and lab values. DM Mono only for PMIDs/DOIs.
const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-newsreader" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "VetoHealth: check it before you buy it",
  description: "Claims, products and lab results, checked against published research, with optional care from licensed partner clinicians.",
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
