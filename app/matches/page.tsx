import type { Metadata } from "next";
import MatchesClient from "@/components/clients/MatchesClient";
import JsonLd from "@/components/seo/JsonLd";
import { matchesSchema, breadcrumbSchema } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";

const matchesDescription =
  "NIIGHTMARE Esports match results and tournament history across Mobile Legends: Bang Bang and eFootball.";

export const metadata: Metadata = {
  title: "Matches & Tournaments",
  description: matchesDescription,
  alternates: { canonical: "/matches" },
  openGraph: { title: "Matches & Tournaments — NIIGHTMARE Esports", description: matchesDescription, images: ["/opengraph-image.png"] },
  twitter: { title: "Matches & Tournaments — NIIGHTMARE Esports", description: matchesDescription, images: ["/twitter-image.png"] },
};

export default async function MatchesPage() {
  const content = await getSiteContent();
  return (
    <>
      <JsonLd
        data={[
          matchesSchema(content),
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
