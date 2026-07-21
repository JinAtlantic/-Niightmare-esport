import type { Metadata } from "next";
import RosterClient from "@/components/clients/RosterClient";
import JsonLd from "@/components/seo/JsonLd";
import { sportsTeamSchema, breadcrumbSchema } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";

const teamDescription =
  "Meet the NIIGHTMARE Esports team — our Mobile Legends: Bang Bang and eFootball players and staff from Lao PDR.";

export const metadata: Metadata = {
  title: "Team",
  description: teamDescription,
  alternates: { canonical: "/roster" },
  openGraph: { title: "Team — NIIGHTMARE Esports", description: teamDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Team — NIIGHTMARE Esports", description: teamDescription, images: ["/twitter-image.png"] },
};

export default async function RosterPage() {
  const content = await getSiteContent();
  return (
    <>
      <JsonLd
        data={[
          sportsTeamSchema(content),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Team", path: "/roster" },
          ]),
        ]}
      />
      <RosterClient />
    </>
  );
}
