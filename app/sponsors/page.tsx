import type { Metadata } from "next";
import SponsorsClient from "@/components/SponsorsClient";

export const metadata: Metadata = {
  title: "Sponsors & Partners",
  description:
    "Partner with NIIGHTMARE Esports. Explore our partners and sponsorship tiers as we dominate the Lao PDR esports scene.",
};

export default function SponsorsPage() {
  return <SponsorsClient />;
}
