import type { Metadata } from "next";
import MatchesClient from "@/components/MatchesClient";

export const metadata: Metadata = {
  title: "Matches & Tournaments",
  description:
    "NIIGHTMARE Esports match results and tournament history across Mobile Legends: Bang Bang and eFootball.",
};

export default function MatchesPage() {
  return <MatchesClient />;
}
