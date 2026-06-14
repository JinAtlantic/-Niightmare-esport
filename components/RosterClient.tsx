"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import PageHeader from "@/components/PageHeader";
import PlayerCard from "@/components/PlayerCard";
import StaffCard from "@/components/StaffCard";
import SectionLabel from "@/components/SectionLabel";
import Reveal from "@/components/Reveal";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import rosterData from "@/data/roster.json";
import type { GameId, Player, StaffMember } from "@/lib/types";

const roster = rosterData as {
  mlbb: { players: Player[] };
  efootball: { players: Player[] };
  staff: StaffMember[];
};

export default function RosterClient() {
  const { t } = useLanguage();
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
        <SectionLabel>{t("roster.lineup_label")}</SectionLabel>

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

        {/* Staff & management */}
        <div className="mt-20">
          <SectionLabel>{t("roster.staff_label")}</SectionLabel>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {roster.staff.map((member, i) => (
              <Reveal key={member.id} delay={i * 90} className="h-full">
                <StaffCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
