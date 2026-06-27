import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import PlayerProfileClient from "@/components/clients/PlayerProfileClient";
import { breadcrumbSchema, SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";
import type { Player } from "@/lib/types";

function allPlayers(content: Record<string, unknown>) {
  const roster = content.roster as {
    mlbb?: { players?: Player[] };
    efootball?: { players?: Player[] };
  };
  return [
    ...(roster.mlbb?.players ?? []),
    ...(roster.efootball?.players ?? []),
  ];
}

async function getPlayer(playerId: string) {
  const content = (await getSiteContent()) as Record<string, unknown>;
  return allPlayers(content).find((player) => player.id === playerId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { playerId: string };
}): Promise<Metadata> {
  const player = await getPlayer(params.playerId);
  if (!player) return { title: "Player not found" };
  const title = `${player.ign} Fan Profile`;
  const description = `Vote and comment for ${player.ign} on the NIIGHTMARE Esports community profile.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/roster/${player.id}` },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: { playerId: string };
}) {
  const player = await getPlayer(params.playerId);
  if (!player) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Roster", path: "/roster" },
            { name: player.ign, path: `/roster/${player.id}` },
          ]),
        ]}
      />
      <PlayerProfileClient player={player} />
    </>
  );
}
