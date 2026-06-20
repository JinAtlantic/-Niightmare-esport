"use client";

import React, { useMemo } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { TrophyIcon, MlbbIcon, EfootballIcon } from "@/components/ui/Icons";
import type { Tournament } from "@/lib/types";

/** A placement reads as a championship when its English text says so. Champions
 *  get the strongest cabinet treatment; every other podium finish stays quieter. */
const isChampion = (t: Tournament) =>
  /champ|winner|1st|first|gold|🏆/i.test(t.placement?.en ?? "");

interface TournamentLabels {
  placement: { en: string; lo: string };
  prize: { en: string; lo: string };
  season: { en: string; lo: string };
}

const FALLBACK_TOURNAMENT_LABELS: TournamentLabels = {
  placement: { en: "Placement", lo: "ອັນດັບ" },
  prize: { en: "Prize", lo: "ເງິນລາງວັນ" },
  season: { en: "Season", lo: "ລະດູການ" },
};

function TrophyCard({
  tournament,
  labels,
}: {
  tournament: Tournament;
  labels: TournamentLabels;
}) {
  const { pick } = useLanguage();
  const champ = isChampion(tournament);
  const GameIcon = tournament.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div
      className={`clip-esports group relative overflow-hidden border bg-gradient-to-br from-crypt2/85 via-crypt/70 to-void px-3 py-3 transition-all duration-300 sm:px-5 sm:py-4 ${
        champ
          ? "border-glow/45 shadow-[0_0_34px_rgba(168,85,247,0.16)] hover:border-glow/80 hover:shadow-[0_0_38px_rgba(199,125,255,0.24)]"
          : "border-edge hover:border-amethyst/70 hover:shadow-[0_0_26px_rgba(168,85,247,0.24)]"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px opacity-90 ${
          champ
            ? "bg-gradient-to-r from-transparent via-glow to-transparent"
            : "bg-gradient-to-r from-transparent via-amethyst to-transparent"
        }`}
      />
      <span
        aria-hidden
        className="absolute -right-16 -top-20 h-40 w-40 bg-amethyst/10 blur-3xl transition-opacity duration-300 group-hover:opacity-90"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-r from-amethyst/70 to-transparent"
      />

      <div className="relative z-[1] grid grid-cols-[auto_1fr] items-center gap-3 sm:gap-4">
        <div className="relative grid h-[52px] w-[52px] place-items-center sm:h-[72px] sm:w-[72px]">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-amethyst/18 blur-xl"
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full border border-glow/35"
          />
          <span className="relative grid h-11 w-11 place-items-center rounded-full border border-glow/60 bg-void text-glow shadow-[0_0_24px_rgba(199,125,255,0.2)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
            <TrophyIcon size={24} />
          </span>
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <p className="font-display text-lg font-bold uppercase leading-none tracking-[0.04em] text-soul [text-shadow:0_0_22px_rgba(199,125,255,0.32)] sm:text-2xl">
                {pick(tournament.placement)}
              </p>
              <p className="mt-1.5 font-display text-xs font-semibold uppercase leading-snug tracking-[0.04em] text-soul sm:text-base">
                {pick(tournament.name)}
              </p>
            </div>
            <div className="hidden w-fit items-center gap-2 border border-edge bg-void/45 px-3 py-2 font-display text-sm font-bold uppercase tracking-[0.08em] text-spectre sm:inline-flex">
              <GameIcon size={15} className="text-amethyst" />
              {tournament.season}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-edge pt-3 sm:gap-2">
            <div className="min-w-0 border border-edge bg-void/45 px-2 py-2 sm:px-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ash-dim sm:text-[10px] sm:tracking-[0.16em]">
                {pick(labels.placement)}
              </p>
              <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.02em] text-glow sm:text-sm sm:tracking-[0.08em]">
                {pick(tournament.placement)}
              </p>
            </div>
            <div className="min-w-0 border border-edge bg-void/45 px-2 py-2 sm:px-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ash-dim sm:text-[10px] sm:tracking-[0.16em]">
                {pick(labels.season)}
              </p>
              <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.02em] text-spectre sm:gap-2 sm:text-sm sm:tracking-[0.08em]">
                <GameIcon size={13} className="shrink-0 text-amethyst sm:size-[15px]" />
                {tournament.season}
              </p>
            </div>
            {tournament.prize && tournament.prize.trim() && (
              <div className="min-w-0 border border-edge bg-void/45 px-2 py-2 sm:px-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-ash-dim sm:text-[10px] sm:tracking-[0.16em]">
                  {pick(labels.prize)}
                </p>
                <p className="keep-latin mt-1 font-display text-[10px] font-bold uppercase tracking-[0.02em] text-spectre sm:text-sm sm:tracking-[0.08em]">
                  {tournament.prize}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrophyCabinet() {
  const { t } = useLanguage();
  const data = useContent().matches as {
    page?: { tournamentLabels?: TournamentLabels };
    tournaments: Tournament[];
  };
  const labels = data.page?.tournamentLabels ?? FALLBACK_TOURNAMENT_LABELS;

  // Champions first, then most recent season — the cabinet reads top-down.
  const tournaments = useMemo(() => {
    return [...(data.tournaments ?? [])].sort((a, b) => {
      const c = Number(isChampion(b)) - Number(isChampion(a));
      if (c !== 0) return c;
      return (b.season ?? "").localeCompare(a.season ?? "");
    });
  }, [data]);

  return (
    <section className="relative overflow-hidden border-t border-edge bg-gradient-to-b from-void via-crypt/25 to-void px-4 py-14 md:px-6 md:py-16">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 h-72 w-[min(900px,92vw)] -translate-x-1/2 bg-amethyst/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-edge-bright to-transparent"
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered kicker={t("matches.honours_kicker")}>
            {t("matches.trophy_cabinet")}
          </SectionLabel>
        </Reveal>

        {tournaments.length > 0 ? (
          <div className="mx-auto mt-7 max-w-4xl border border-edge/90 bg-void/35 p-2.5 shadow-[0_0_42px_rgba(168,85,247,0.12)] md:mt-9 md:p-4">
            <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1 [scrollbar-color:#A855F7_#16101F] [scrollbar-width:thin] sm:max-h-[420px] sm:space-y-3">
              {tournaments.map((tournament, i) => (
                <Reveal
                  key={tournament.id}
                  delay={Math.min(i * 45, 240)}
                  className="w-full"
                >
                  <TrophyCard tournament={tournament} labels={labels} />
                </Reveal>
              ))}
            </div>
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
