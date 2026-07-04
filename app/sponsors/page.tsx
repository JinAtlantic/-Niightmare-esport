import type { Metadata } from "next";
import SponsorsClient from "@/components/clients/SponsorsClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

const sponsorsDescription =
  "Partner with NIIGHTMARE Esports. Explore our partners and sponsorship tiers as we dominate the Lao PDR esports scene.";

export const metadata: Metadata = {
  title: "Sponsors & Partners",
  description: sponsorsDescription,
  alternates: { canonical: "/sponsors" },
  openGraph: { title: "Sponsors & Partners — NIIGHTMARE Esports", description: sponsorsDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Sponsors & Partners — NIIGHTMARE Esports", description: sponsorsDescription, images: ["/twitter-image.png"] },
};

export default function SponsorsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Sponsors", path: "/sponsors" },
        ])}
      />
      <SponsorsClient />
    </>
  );
}
