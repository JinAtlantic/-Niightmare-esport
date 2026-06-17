import type { Metadata } from "next";
import RosterClient from "@/components/clients/RosterClient";
import JsonLd from "@/components/seo/JsonLd";
import { sportsTeamSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Roster",
  description:
    "Meet the NIIGHTMARE Esports roster — our Mobile Legends: Bang Bang and eFootball players and staff from Lao PDR.",
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
