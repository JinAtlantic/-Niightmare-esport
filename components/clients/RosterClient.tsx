"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import PlayerCard from "@/components/cards/PlayerCard";
import StaffCard from "@/components/cards/StaffCard";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { EfootballIcon, MlbbIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import { groupStaffByTier, type StaffTier } from "@/lib/staff";
import rosterSeed from "@/data/roster.json";
import type { Bilingual, GameId, Player, StaffMember } from "@/lib/types";

type RosterStatId = "active" | "mlbb" | "efootball" | "staff";

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
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-amethyst/60" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-soul sm:text-base">
          {label}
        </span>
        <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-amethyst/60" />
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
  const { pick } = useLanguage();
  const roster = useContent().roster as {
    page?: Partial<RosterPageCopy>;
    mlbb: { players: Player[] };
    efootball: { players: Player[] };
    staff: StaffMember[];
  };
  const [division, setDivision] = useState<GameId>("mlbb");
  const page = mergePageCopy(roster.page);

  const counts: Record<RosterStatId, number> = {
    active: roster.mlbb.players.length + roster.efootball.players.length + roster.staff.length,
    mlbb: roster.mlbb.players.length,
    efootball: roster.efootball.players.length,
    staff: roster.staff.length,
  };

  const tabs: {
    id: GameId;
    label: Bilingual;
    Icon: typeof MlbbIcon;
    count: number;
  }[] = [
    { id: "mlbb", label: page.divisionLabels.mlbb, Icon: MlbbIcon, count: roster.mlbb.players.length },
    { id: "efootball", label: page.divisionLabels.efootball, Icon: EfootballIcon, count: roster.efootball.players.length },
  ];

  const players = roster[division].players;

  return (
    <>
      <PageHeader
        kicker={page.kicker ? pick(page.kicker) : undefined}
        title={pick(page.title)}
        subtitle={pick(page.intro)}
        subtitleClassName="text-lg font-medium text-spectre md:text-2xl"
      />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="mb-16 border border-edge bg-crypt/35 p-4 shadow-glow-soft md:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr] lg:items-stretch">
            <div className="relative flex min-h-[180px] flex-col justify-between overflow-hidden border border-edge bg-void/45 p-5">
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent" />
              <div aria-hidden className="absolute -right-10 -top-10 h-28 w-28 rotate-45 border border-amethyst/15 bg-amethyst/5" />
              <div className="relative">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-amethyst">
                  {pick(page.overviewLabel)}
                </p>
                <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-spectre md:text-base">
                  {pick(page.overviewIntro)}
                </p>
              </div>
              <div
                aria-hidden
                className="relative mt-8 h-[2px] w-28 -skew-x-[24deg] bg-gradient-to-r from-amethyst via-glow to-transparent shadow-[0_0_16px_rgba(168,85,247,0.55)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {page.stats.map((stat) => {
                const value = counts[stat.id as RosterStatId] ?? 0;
                return (
                  <div key={stat.id} className="relative min-h-[180px] overflow-hidden border border-edge bg-void/55 p-4">
                    <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent" />
                    <div aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rotate-45 border border-amethyst/15 bg-amethyst/5" />
                    <p className="font-mono text-4xl font-bold leading-none text-soul md:text-5xl">
                      {value}
                    </p>
                    <p className="mt-5 font-display text-sm font-bold uppercase tracking-[0.12em] text-spectre">
                      {pick(stat.label)}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-ash md:text-sm">
                      {pick(stat.detail)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <SectionLabel centered>{pick(page.lineupLabel)}</SectionLabel>

        {/* Division tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-1 border-b border-edge">
          {tabs.map(({ id, label, Icon, count }) => {
            const active = division === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDivision(id)}
                aria-pressed={active}
                className={`group relative -mb-px flex items-center gap-2.5 px-6 py-4 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                  active ? "text-soul" : "text-ash hover:text-soul"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${active ? "text-amethyst" : "text-ash group-hover:text-spectre"}`}
                />
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

        {/* Player grid — re-keyed per division so cards re-enter on switch */}
        <div key={division} className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {players.map((player, i) => (
            <Reveal key={player.id} delay={i * 70} className="h-full">
              <PlayerCard player={player} />
            </Reveal>
          ))}
        </div>

        {/* Behind the team — ordered by hierarchy tier */}
        <div className="mt-20">
          <SectionLabel centered>{pick(page.staffLabel)}</SectionLabel>
          {(() => {
            const tiers = groupStaffByTier(roster.staff);
            const rows: { tier: StaffTier; label: string }[] = [
              { tier: 1, label: pick(page.tierLabels.executive) },
              { tier: 2, label: pick(page.tierLabels.operations) },
              { tier: 3, label: pick(page.tierLabels.technical) },
            ];
            return rows.map(({ tier, label }) => (
              <TierRow key={tier} label={label} members={tiers[tier]} />
            ));
          })()}
        </div>
      </section>
    </>
  );
}
