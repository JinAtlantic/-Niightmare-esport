import type { Metadata } from "next";
import MatchesClient from "@/components/clients/MatchesClient";
import JsonLd from "@/components/seo/JsonLd";
import { matchesSchema, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Matches & Tournaments",
  description:
    "NIIGHTMARE Esports match results and tournament history across Mobile Legends: Bang Bang and eFootball.",
};

export default function MatchesPage() {
  return (
    <>
      <JsonLd
        data={[
          matchesSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Matches", path: "/matches" },
          ]),
        ]}
      />
      <MatchesClient />
    </>
  );
}
