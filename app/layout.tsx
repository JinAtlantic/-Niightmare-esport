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
// Only used for small mono kickers / nav labels — on mobile those are all below
// the fold or hidden in the closed menu, so don't let it race the hero (LCP)
// image for the initial connection. Load on use; display:swap covers the swap.
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
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});
// Lao face (Noto Sans Lao) — self-hosted. A clean, modern, highly readable
// sans-serif chosen over the more formal Phetsarath. Only fetched by the
// browser when Lao is active (the CSS references it under html.lang-lo), and
// only for Lao glyphs (Latin text keeps the Latin faces via the font stack),
// so EN visitors never download it.
const lao = localFont({
  src: [
    { path: "./fonts/NotoSansLao-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansLao-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lao",
  display: "swap",
  preload: false,
  fallback: ["Noto Sans Lao", "sans-serif"],
});

const fontVars = `${display.variable} ${barlow.variable} ${mono.variable} ${lao.variable}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Public-site PWA manifest (id "/"). The /admin route overrides this with its
  // own manifest (id "/admin") so Android installs them as two separate apps.
  manifest: "/site.webmanifest",
  // Icons driven via metadata (not the app/icon.png file convention) so the
  // /admin route can cleanly override them with the reaper icon.
  // A real favicon.ico (48px, the reaper logo) fills the classic /favicon.ico
  // slot that Google + older browsers request; the ?v= busts any stale cached
  // icon so the real logo replaces an old placeholder.
  icons: {
    icon: [{ url: "/favicon.ico?v=3", type: "image/x-icon" }],
    shortcut: "/favicon.ico?v=3",
    apple: "/apple-icon.png?v=2",
  },
  title: {
    default: "NIIGHTMARE Esports — Lao PDR | MLBB & eFootball",
    template: "%s | NIIGHTMARE Esports",
  },
  description:
    "Official website of NIIGHTMARE Esports from Lao PDR. Competing in Mobile Legends: Bang Bang (MLBB) and eFootball. Team, matches, sponsors and more.",
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
      "Niightmare Zone — official home of NIIGHTMARE Esports from Lao PDR.",
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
    description: "Niightmare Zone — official home of NIIGHTMARE Esports from Lao PDR.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A14",
  width: "device-width",
  initialScale: 1,
};

// Render the public site as ISR, not a per-request serverless function. The
// HTML is built once and served from Vercel's CDN, so a cold first visit can't
// stall on a function cold-start + Supabase round-trip (the symptom: first load
// times out → refresh works). Content stays live: getSiteContent runs at build
// and on this 10-min backstop, and admin saves call revalidateTag("content").
// The /admin segment opts back into dynamic via its own `force-dynamic`.
export const revalidate = 600;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-render the live content so the first paint normally shows real data.
  // A marked fallback can perform one client recovery read after hydration.
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
        <JsonLd data={[organizationSchema(initialContent), websiteSchema()]} />
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
