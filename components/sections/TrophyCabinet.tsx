"use client";

import React, { useMemo } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { TrophyIcon, MlbbIcon, EfootballIcon } from "@/components/ui/Icons";
import type { Tournament } from "@/lib/types";

/** A placement reads as a championship when its English text says so. Champions
 *  get the gold treatment; every other podium finish stays in brand violet. */
const isChampion = (t: Tournament) =>
  /champ|winner|1st|first|gold|🏆/i.test(t.placement?.en ?? "");

function TrophyCard({ tournament }: { tournament: Tournament }) {
  const { t, pick } = useLanguage();
  const champ = isChampion(tournament);
  const GameIcon = tournament.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div
      className={`clip-esports group relative flex w-full max-w-[360px] flex-col items-center overflow-hidden border bg-crypt px-6 py-8 text-center transition-all duration-300 ${
        champ
          ? "border-[#e3b85a]/45 hover:border-[#e3b85a]/80 hover:shadow-[0_0_34px_rgba(227,184,90,0.32)]"
          : "border-edge hover:border-amethyst/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
      }`}
    >
      {/* top hairline — gold for champions, violet otherwise */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px ${
          champ
            ? "bg-gradient-to-r from-transparent via-[#e8c36b] to-transparent"
            : "bg-gradient-to-r from-transparent via-amethyst to-transparent"
        }`}
      />

      {/* medallion */}
      <div className="relative mb-5">
        <span
          aria-hidden
          className="absolute inset-0 -z-0 rounded-full blur-xl"
          style={{
            background: champ
              ? "radial-gradient(circle, rgba(232,195,107,0.45), transparent 70%)"
              : "radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)",
          }}
        />
        <span
          className={`relative grid h-20 w-20 place-items-center rounded-full border-2 transition-transform duration-300 group-hover:scale-105 ${
            champ
              ? "border-[#e8c36b]/70 bg-gradient-to-br from-[#2a2012] to-[#0c0a06] text-[#f0d488]"
              : "border-amethyst/60 bg-gradient-to-br from-[#1A0A2E] to-[#08060F] text-glow"
          }`}
        >
          <TrophyIcon size={34} />
        </span>
      </div>

      {/* placement — the headline */}
      <p
        className={`font-display text-2xl font-bold uppercase leading-none tracking-[0.04em] md:text-[1.7rem] ${
          champ ? "text-[#f0d488]" : "text-glow"
        }`}
        style={
          champ
            ? { textShadow: "0 0 26px rgba(232,195,107,0.5)" }
            : { textShadow: "0 0 24px rgba(199,125,255,0.45)" }
        }
      >
        {pick(tournament.placement)}
      </p>

      {/* tournament name */}
      <p className="mt-3 font-display text-base font-semibold uppercase leading-snug tracking-[0.04em] text-soul">
        {pick(tournament.name)}
      </p>

      {/* footer: game · season · prize */}
      <div className="mt-6 flex w-full items-center justify-center gap-4 border-t border-edge pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
        <span className="inline-flex items-center gap-1.5">
          <GameIcon size={15} className={champ ? "text-[#e8c36b]" : "text-amethyst"} />
          {tournament.season}
        </span>
        {tournament.prize && tournament.prize.trim() && (
          <>
            <span aria-hidden className="text-edge-bright">/</span>
            <span className="keep-latin font-semibold text-spectre">{tournament.prize}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrophyCabinet() {
  const { t } = useLanguage();
  const data = useContent().matches as { tournaments: Tournament[] };

  // Champions first, then most recent season — the cabinet reads top-down.
  const tournaments = useMemo(() => {
    return [...(data.tournaments ?? [])].sort((a, b) => {
      const c = Number(isChampion(b)) - Number(isChampion(a));
      if (c !== 0) return c;
      return (b.season ?? "").localeCompare(a.season ?? "");
    });
  }, [data]);

  return (
    <section className="news-section relative mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="relative z-[1]">
        <Reveal>
          <SectionLabel centered kicker={t("matches.honours_kicker")}>
            {t("matches.trophy_cabinet")}
          </SectionLabel>
        </Reveal>

        {tournaments.length > 0 ? (
          <div className="mt-12 flex flex-wrap justify-center gap-5">
            {tournaments.map((tournament, i) => (
              <Reveal key={tournament.id} delay={i * 80}>
                <TrophyCard tournament={tournament} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-md text-center font-mono text-sm text-ash">
            {t("matches.honours_empty")}
          </p>
        )}
      </div>
    </section>
  );
}
