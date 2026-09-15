import type { Metadata } from "next";
import { Fraunces, Markazi_Text, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-sans",
  adjustFontFallback: false,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: false,
  fallback: ["Georgia", "serif"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-latin",
  fallback: ["Georgia", "serif"],
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dorham — دورهم",
  description: "Iranian community in Turkey. Your people, in this city.",
  icons: {
    icon: [{ url: "/brand/empty-events.png", type: "image/png" }],
    apple: [{ url: "/brand/empty-events.png" }],
  },
  openGraph: {
    title: "Dorham — دورهم",
    description: "جامعهٔ ایرانی استانبول. دور هم، نه سوایپ.",
    url: siteUrl,
    siteName: "Dorham",
    locale: "fa_IR",
    type: "website",
    images: [{ url: "/brand/empty-events.png", width: 1024, height: 1024, alt: "Dorham" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dorham — دورهم",
    description: "جامعهٔ ایرانی استانبول. دور هم، نه سوایپ.",
    images: ["/brand/empty-events.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${markazi.variable} ${fraunces.variable}`}>
      <body className={vazirmatn.className}>{children}</body>
    </html>
  );
}
