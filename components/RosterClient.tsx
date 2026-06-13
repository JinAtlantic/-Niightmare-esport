"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import PageHeader from "@/components/PageHeader";
import PlayerCard from "@/components/PlayerCard";
import StaffCard from "@/components/StaffCard";
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

  const tabs: { id: GameId; labelKey: string; Icon: typeof MlbbIcon }[] = [
    { id: "mlbb", labelKey: "roster.tab_mlbb", Icon: MlbbIcon },
    { id: "efootball", labelKey: "roster.tab_efootball", Icon: EfootballIcon },
  ];

  const players = roster[division].players;

  return (
    <>
      <PageHeader title={t("sections.our_roster")} subtitle={t("roster.intro")} />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        {/* Division tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-edge">
          {tabs.map(({ id, labelKey, Icon }) => {
            const active = division === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDivision(id)}
                aria-pressed={active}
                className={`relative -mb-px flex items-center gap-2 px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "text-text-primary [text-shadow:0_0_12px_rgba(194,68,196,0.7)]"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Icon size={18} className={active ? "text-accent" : ""} />
                <span className="keep-latin">{t(labelKey)}</span>
                <span
                  className={`absolute inset-x-0 bottom-0 h-[3px] bg-primary transition-all duration-300 ${
                    active ? "opacity-100 shadow-glow" : "opacity-0"
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        {/* Player grid */}
        <div
          key={division}
          className="mt-10 grid gap-6 animate-fadeIn sm:grid-cols-2 lg:grid-cols-3"
        >
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        {/* Staff row */}
        <div className="mt-16">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-text-primary">
            {t("roster.staff_label")}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {roster.staff.map((member) => (
              <StaffCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
