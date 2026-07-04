import type { Metadata } from "next";
import AchievementsClient from "@/components/clients/AchievementsClient";
import JsonLd from "@/components/seo/JsonLd";
import { sportsTeamSchema, breadcrumbSchema } from "@/lib/seo";

const achievementsDescription =
  "NIIGHTMARE Esports' competitive record — championships, world stages, total winnings, and the players who carried the banner since 2019.";

export const metadata: Metadata = {
  title: "Achievements",
  description: achievementsDescription,
  openGraph: { title: "Achievements — NIIGHTMARE Esports", description: achievementsDescription },
  twitter: { title: "Achievements — NIIGHTMARE Esports", description: achievementsDescription },
};

export default function AchievementsPage() {
  return (
    <>
      <JsonLd
        data={[
          sportsTeamSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Achievements", path: "/achievements" },
          ]),
        ]}
      />
      <AchievementsClient />
    </>
  );
}
