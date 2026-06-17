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
import type { GameId, Player, StaffMember } from "@/lib/types";

/**
 * One hierarchy row under the BEHIND THE TEAM heading. Cards line up centred so
 * a partial row stays balanced, and are sized to match the player grid cell.
 * The white tier label sits below the heading — bigger than a kicker, but kept
 * quieter than the section heading itself.
 */
function TierRow({ label, members }: { label: string; members: StaffMember[] }) {
  if (members.length === 0) return null;
  // Match the player grid cell exactly (2 / 3 / 4 cols, gap-4 → sm:gap-5) so
  // staff cards are the same size as player cards, while flex-wrap + center
  // keeps partial rows balanced instead of left-aligned like a raw grid.
  const cell =
    "w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.834rem)] lg:w-[calc(25%-0.9375rem)]";
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
  const { t } = useLanguage();
  const roster = useContent().roster as {
    mlbb: { players: Player[] };
    efootball: { players: Player[] };
    staff: StaffMember[];
  };
  const [division, setDivision] = useState<GameId>("mlbb");

  const tabs: {
    id: GameId;
    labelKey: string;
    Icon: typeof MlbbIcon;
    count: number;
  }[] = [
    { id: "mlbb", labelKey: "roster.tab_mlbb", Icon: MlbbIcon, count: roster.mlbb.players.length },
    { id: "efootball", labelKey: "roster.tab_efootball", Icon: EfootballIcon, count: roster.efootball.players.length },
  ];

  const players = roster[division].players;

  return (
    <>
      <PageHeader
        title={t("sections.our_roster")}
        subtitle={t("roster.intro")}
        subtitleClassName="text-lg font-medium text-spectre md:text-2xl"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionLabel centered>{t("roster.lineup_label")}</SectionLabel>

        {/* Division tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-1 border-b border-edge">
          {tabs.map(({ id, labelKey, Icon, count }) => {
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
                <span className="keep-latin">{t(labelKey)}</span>
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
          <SectionLabel centered>{t("roster.staff_label")}</SectionLabel>
          {(() => {
            const tiers = groupStaffByTier(roster.staff);
            const rows: { tier: StaffTier; labelKey: string }[] = [
              { tier: 1, labelKey: "roster.tier_executive" },
              { tier: 2, labelKey: "roster.tier_operations" },
              { tier: 3, labelKey: "roster.tier_technical" },
            ];
            return rows.map(({ tier, labelKey }) => (
              <TierRow key={tier} label={t(labelKey)} members={tiers[tier]} />
            ));
          })()}
        </div>
      </section>
    </>
  );
}
