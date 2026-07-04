import type { Metadata } from "next";
import RosterClient from "@/components/clients/RosterClient";
import JsonLd from "@/components/seo/JsonLd";
import { sportsTeamSchema, breadcrumbSchema } from "@/lib/seo";

const rosterDescription =
  "Meet the NIIGHTMARE Esports roster — our Mobile Legends: Bang Bang and eFootball players and staff from Lao PDR.";

export const metadata: Metadata = {
  title: "Roster",
  description: rosterDescription,
  alternates: { canonical: "/roster" },
  openGraph: { title: "Roster — NIIGHTMARE Esports", description: rosterDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Roster — NIIGHTMARE Esports", description: rosterDescription, images: ["/twitter-image.png"] },
};

export default function RosterPage() {
  return (
    <>
      <JsonLd
        data={[
          sportsTeamSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Roster", path: "/roster" },
          ]),
        ]}
      />
      <RosterClient />
    </>
  );
}
