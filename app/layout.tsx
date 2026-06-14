import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://niightmare.gg"),
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
    type: "website",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Loaded in the root layout, so it applies to every route. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Phetsarath:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <Chrome>{children}</Chrome>
        </LanguageProvider>
      </body>
    </html>
  );
}
