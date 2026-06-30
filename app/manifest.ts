import type { MetadataRoute } from "next";

// Web app manifest — lets Android Chrome install the site as an app with the
// NIIGHTMARE logo icon. iOS uses app/apple-icon.png instead (Add to Home Screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NIIGHTMARE Esports",
    short_name: "NIIGHTMARE",
    description: "NIIGHTMARE Esports — Lao PDR (MLBB & eFootball)",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0710",
    theme_color: "#0A0A14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
