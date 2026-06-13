import type { Metadata } from "next";
import RosterClient from "@/components/RosterClient";

export const metadata: Metadata = {
  title: "Roster",
  description:
    "Meet the NIIGHTMARE Esports roster — our Mobile Legends: Bang Bang and eFootball players and staff from Lao PDR.",
};

export default function RosterPage() {
  return <RosterClient />;
}
