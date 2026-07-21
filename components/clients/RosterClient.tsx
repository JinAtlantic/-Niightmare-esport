"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import AuroraHalos from "@/components/ui/AuroraHalos";
import PlayerCard from "@/components/cards/PlayerCard";
import StaffCard from "@/components/cards/StaffCard";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/context/ContentContext";
import { groupStaffByTier, memberGame, type StaffTier } from "@/lib/staff";
import rosterSeed from "@/data/roster.json";
import type { Bilingual, GameId, Player, StaffMember } from "@/lib/types";
import { enabledGames } from "@/lib/games";

type RosterStatId = "active" | "mlbb" | "efootball" | "staff";
type RosterTab = GameId | "staff";

interface RosterPageStat {
  id: RosterStatId | string;
  label: Bilingual;
  detail: Bilingual;
}

interface RosterPageCopy {
  kicker?: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  overviewLabel: Bilingual;
  overviewIntro: Bilingual;
  lineupLabel: Bilingual;
  staffLabel: Bilingual;
  divisionLabels: Record<GameId, Bilingual>;
  tierLabels: {
    executive: Bilingual;
    operations: Bilingual;
    technical: Bilingual;
  };
  stats: RosterPageStat[];
}

const pageSeed = rosterSeed.page as RosterPageCopy;

function mergePageCopy(page?: Partial<RosterPageCopy>): RosterPageCopy {
  return {
    ...pageSeed,
    ...page,
    divisionLabels: { ...pageSeed.divisionLabels, ...(page?.divisionLabels ?? {}) },
    tierLabels: { ...pageSeed.tierLabels, ...(page?.tierLabels ?? {}) },
    stats: page?.stats?.length ? page.stats : pageSeed.stats,
  };
}

/**
 * One hierarchy row under the BEHIND THE TEAM heading. Cards line up centred so
 * a partial row stays balanced, and are sized to match the player grid cell.
 * The white tier label sits below the heading — bigger than a kicker, but kept
 * quieter than the section heading itself.
 */
function TierRow({ label, members }: { label: string; members: StaffMember[] }) {
  if (members.length === 0) return null;
  // Staff tiers are often a single card, so a quarter-width grid cell left a
  // lone portrait stranded in a wide empty band. Pin a fixed, comfortable card
  // size from sm up (two-up on phones) so flex-wrap + center reads as an
  // intentional cluster: one card = a focused portrait, three = a centred trio.
  const cell =
    "w-[calc(50%-0.5rem)] sm:w-[220px] md:w-[232px] lg:w-[244px]";
  return (
    <div className="mt-12 first:mt-10">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span aria-hidden className="h-px w-6 shrink-0 bg-gradient-to-r from-transparent to-amethyst/60 sm:w-8" />
        <span className="whitespace-nowrap font-mono text-sm font-semibold uppercase tracking-[0.16em] text-soul sm:text-base sm:tracking-[0.3em]">
          {label}
        </span>
        <span aria-hidden className="h-px w-6 shrink-0 bg-gradient-to-l from-transparent to-amethyst/60 sm:w-8" />
      </div>
      <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-5">
        {members.map((member, i) => (
          <Reveal key={member.id} delay={i * 80} className={cell}>
            <StaffCard member={member} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default function RosterClient() {
  const { pick, t } = useLanguage();
  const content = useContent();
  const roster = content.roster as {
    page?: Partial<RosterPageCopy>;
    mlbb: { players: Player[] };
    efootball: { players: Player[] };
    games?: Record<string, { players: Player[] }>;
    staff: StaffMember[];
  };
  const [tab, setTab] = useState<RosterTab>("mlbb");
  const page = mergePageCopy(roster.page);
  const rosterGames: Record<string, { players: Player[] }> = {
    mlbb: roster.mlbb ?? { players: [] },
    efootball: roster.efootball ?? { players: [] },
    ...(roster.games ?? {}),
  };
  const gameIds = [...new Set([...Object.keys(rosterGames), ...roster.staff.map((member) => memberGame(member)).filter((id): id is string => Boolean(id))])];
  const games = enabledGames((content.site as { games?: unknown }).games, gameIds);

  // Coaches sit under their game's lineup (from each member's game field, with a
  // text fallback for legacy entries); everyone else is the back-office group.
  const coachesFor = (game: GameId) =>
    roster.staff.filter((m) => memberGame(m) === game);
  const backOffice = roster.staff.filter((m) => !memberGame(m));

  const tabs: { id: RosterTab; label: Bilingual; count: number }[] = [
    ...games.map((game) => ({
      id: game.id,
      label: page.divisionLabels[game.id] ?? game.name,
      count: rosterGames[game.id]?.players.length ?? 0,
    })),
    { id: "staff", label: page.staffLabel, count: backOffice.length },
  ];

  const activeTab = tabs.some((entry) => entry.id === tab) ? tab : tabs[0]?.id ?? "staff";

  return (
    <>
      <PageHeader
        title={pick(page.title)}
        subtitle={pick(page.intro)}
        subtitleClassName="text-lg font-medium text-spectre md:text-2xl"
      />

      <section className="relative isolate mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <AuroraHalos />
        {/* View tabs — MLBB / eFootball lineups, and the back-office team */}
        <div className="flex flex-wrap items-center justify-center gap-1 border-b border-edge">
          {tabs.map(({ id, label, count }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={active}
                className={`relative -mb-px flex items-center gap-2.5 px-5 py-4 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-200 md:px-7 md:text-base ${
                  active ? "text-soul" : "text-ash hover:text-soul"
                }`}
              >
                <span className="keep-latin">{pick(label)}</span>
                <span className={`font-mono text-[11px] ${active ? "text-spectre" : "text-ash-dim"}`}>
                  {count}
                </span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[2px] -skew-x-[24deg] bg-gradient-to-r from-amethyst to-glow transition-opacity duration-300 ${
                    active ? "opacity-100 shadow-[0_0_14px_rgba(168,85,247,0.7)]" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* re-keyed per tab so cards re-enter on switch */}
        <div key={activeTab}>
          {activeTab !== "staff" ? (
            <>
              <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {(rosterGames[activeTab]?.players ?? []).map((player, i) => (
                  <Reveal key={player.id} delay={i * 70} className="h-full">
                    <PlayerCard player={player} />
                  </Reveal>
                ))}
              </div>
              {/* coaches for this game sit right under its lineup */}
              <TierRow label={t("roster.coaching_staff")} members={coachesFor(activeTab)} />
            </>
          ) : (
            (() => {
              const tiers = groupStaffByTier(backOffice);
              const rows: { tier: StaffTier; label: string }[] = [
                { tier: 1, label: pick(page.tierLabels.executive) },
                { tier: 2, label: pick(page.tierLabels.operations) },
                { tier: 3, label: pick(page.tierLabels.technical) },
              ];
              return <div className="mt-4">{rows.map(({ tier, label }) => (
                <TierRow key={tier} label={label} members={tiers[tier]} />
              ))}</div>;
            })()
          )}
        </div>
      </section>
    </>
  );
}
