"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import TeamLogo from "@/components/TeamLogo";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import { formatDateTime } from "@/lib/format";
import site from "@/data/site.json";
import type { Bilingual, GameId } from "@/lib/types";

function OpponentBadge({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="grid h-[120px] w-[120px] place-items-center rounded-full border-2 border-edge bg-gradient-to-br from-[#1A0A2E] to-[#0A0A14]"
      aria-label={name}
    >
      <span className="keep-latin font-rajdhani text-4xl font-bold text-text-muted">
        {initials}
      </span>
    </div>
  );
}

export default function UpcomingMatch() {
  const { t, pick, lang } = useLanguage();
  const match = site.upcomingMatch as {
    date: string;
    game: GameId;
    tournament: Bilingual;
    opponent: string;
  };
  const GameIcon = match.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <section className="relative overflow-hidden border-y border-edge bg-[#0d0a16]">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(60% 120% at 50% 0%, rgba(194,68,196,0.18), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="flex items-center justify-center gap-2">
          <GameIcon size={18} className="text-accent" />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t("sections.upcoming_match")}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
          {/* Home */}
          <div className="flex flex-col items-center gap-3">
            <TeamLogo size={120} />
            <span className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-[0.14em] text-text-primary">
              NIIGHTMARE
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span className="font-display text-3xl font-bold uppercase tracking-[0.2em] text-accent md:text-4xl">
              {t("common.vs")}
            </span>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-3">
            <OpponentBadge name={match.opponent} />
            <span className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-[0.14em] text-text-muted">
              {match.opponent}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-1 text-center">
          <p className="font-display text-base font-semibold uppercase tracking-[0.12em] text-text-primary">
            {pick(match.tournament)}
          </p>
          <p className="text-sm text-text-muted">{formatDateTime(match.date, lang)}</p>
        </div>
      </div>
    </section>
  );
}
