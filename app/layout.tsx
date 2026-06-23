import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { ContentProvider, type Content } from "@/components/context/ContentContext";
import Chrome from "@/components/layout/Chrome";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema, SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";

// All fonts are self-hosted (woff2 in ./fonts) via next/font/local — no
// render-blocking request to Google Fonts, and the build never depends on the
// network. Each exposes a CSS variable the existing styles already reference
// (var(--font-rajdhani), etc.).
const display = localFont({
  src: [
    { path: "./fonts/ChakraPetch-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ChakraPetch-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ChakraPetch-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-rajdhani",
  display: "swap",
});
const barlow = localFont({
  src: [
    { path: "./fonts/Barlow-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Barlow-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Barlow-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Barlow-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
  // Body copy lives below the fold, so don't let four Barlow weights race the
  // hero image for mobile bandwidth — load them on use (display:swap covers it).
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});
// JetBrains Mono ships as a single variable woff2 covering the weight range.
const mono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono-var.woff2",
      weight: "100 800",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});
// Lao face (Phetsarath) — self-hosted. Only fetched by the browser when Lao is
// active (the CSS references it under html.lang-lo), so EN visitors never
// download it.
const lao = localFont({
  src: [
    { path: "./fonts/Phetsarath-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Phetsarath-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-lao",
  display: "swap",
  preload: false,
  fallback: ["Noto Sans Lao", "sans-serif"],
});

const fontVars = `${display.variable} ${barlow.variable} ${mono.variable} ${lao.variable}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NIIGHTMARE Esports — Lao PDR | MLBB & eFootball",
    template: "%s | NIIGHTMARE Esports",
  },
  description:
    "Official website of NIIGHTMARE Esports from Lao PDR. Competing in Mobile Legends: Bang Bang (MLBB) and eFootball. Roster, matches, sponsors and more.",
  keywords: [
    "Niightmare Esports",
    "Niightmare Esports Lao PDR",
    "Lao PDR esports",
    "MLBB Laos",
    "Mobile Legends Laos",
    "eFootball Laos",
    "Lao esports team",
  ],
  authors: [{ name: "NIIGHTMARE Esports" }],
  openGraph: {
    title: "NIIGHTMARE Esports — Lao PDR | MLBB & eFootball",
    description:
      "From Lao PDR — we haunt the meta. Official home of NIIGHTMARE Esports (MLBB & eFootball).",
    siteName: "NIIGHTMARE Esports",
    locale: "en_US",
    alternateLocale: ["lo_LA"],
    type: "website",
    // OG/Twitter images are supplied by the file-based conventions
    // app/opengraph-image.tsx + app/twitter-image.tsx (a true 1200×630 card),
    // so they are intentionally not listed here.
  },
  twitter: {
    card: "summary_large_image",
    title: "NIIGHTMARE Esports — Lao PDR",
    description: "From Lao PDR — we haunt the meta. MLBB & eFootball.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A14",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-render the live content so the first paint shows real data (no
  // client refetch, no seed→cloud reflow). Falls back to the seed on any error.
  let initialContent: Partial<Content> | null = null;
  try {
    initialContent = (await getSiteContent()) as Partial<Content>;
  } catch {
    /* keep null — ContentProvider falls back to the bundled seed */
  }

  return (
    <html lang="en" className={fontVars}>
      <head>
        {/* Set the saved language before first paint so Lao users never see an
            English flash or a font swap (FOUC). Mirrors LanguageContext. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem("niightmare-lang");if(l==="lo"){var r=document.documentElement;r.setAttribute("lang","lo");r.classList.add("lang-lo");}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <LanguageProvider>
          <ContentProvider initial={initialContent}>
            <Chrome>{children}</Chrome>
          </ContentProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
