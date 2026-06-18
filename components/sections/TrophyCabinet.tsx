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
  featured = false,
}: {
  tournament: Tournament;
  labels: TournamentLabels;
  featured?: boolean;
}) {
  const { pick } = useLanguage();
  const champ = isChampion(tournament);
  const GameIcon = tournament.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div
      className={`clip-esports group relative flex w-full flex-col overflow-hidden border bg-gradient-to-br from-crypt2/85 via-crypt/70 to-void px-5 py-6 transition-all duration-300 sm:px-7 sm:py-8 ${
        featured ? "max-w-[620px] md:min-h-[330px]" : "max-w-[380px]"
      } ${
        champ
          ? "border-glow/45 shadow-[0_0_42px_rgba(168,85,247,0.18)] hover:border-glow/80 hover:shadow-[0_0_46px_rgba(199,125,255,0.28)]"
          : "border-edge hover:border-amethyst/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
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
        className="absolute -right-16 -top-20 h-48 w-48 bg-amethyst/10 blur-3xl transition-opacity duration-300 group-hover:opacity-90"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-r from-amethyst/70 to-transparent"
      />

      <div className={`relative z-[1] ${featured ? "md:grid md:grid-cols-[auto_1fr] md:gap-8" : ""}`}>
        <div className={featured ? "md:flex md:items-center" : ""}>
          <div className="relative mx-auto mb-5 grid h-24 w-24 place-items-center md:mx-0">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-amethyst/20 blur-xl"
            />
            <span
              aria-hidden
              className="absolute inset-2 rounded-full border border-glow/45"
            />
            <span className="relative grid h-20 w-20 place-items-center rounded-full border border-glow/65 bg-void text-glow shadow-[0_0_30px_rgba(199,125,255,0.22)] transition-transform duration-300 group-hover:scale-105">
              <TrophyIcon size={34} />
            </span>
          </div>
        </div>

        <div className={featured ? "text-center md:text-left" : "text-center"}>
          <p className="font-display text-3xl font-bold uppercase leading-none tracking-[0.04em] text-soul [text-shadow:0_0_26px_rgba(199,125,255,0.38)] md:text-[2.15rem]">
            {pick(tournament.placement)}
          </p>

          <p className="mt-3 font-display text-base font-semibold uppercase leading-snug tracking-[0.04em] text-soul md:text-lg">
            {pick(tournament.name)}
          </p>

          <div className="mt-6 grid gap-2 border-t border-edge pt-4 sm:grid-cols-3">
            <div className="border border-edge bg-void/45 px-3 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                {pick(labels.placement)}
              </p>
              <p className="mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-glow">
                {pick(tournament.placement)}
              </p>
            </div>
            <div className="border border-edge bg-void/45 px-3 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                {pick(labels.season)}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.08em] text-spectre">
                <GameIcon size={15} className="text-amethyst" />
                {tournament.season}
              </p>
            </div>
            {tournament.prize && tournament.prize.trim() && (
              <div className="border border-edge bg-void/45 px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(labels.prize)}
                </p>
                <p className="keep-latin mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-spectre">
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
    <section className="relative overflow-hidden border-t border-edge bg-gradient-to-b from-void via-crypt/25 to-void px-4 py-20 md:px-6 md:py-24">
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
          <div className="mt-10 grid place-items-center gap-5 md:mt-12 lg:grid-cols-3">
            {tournaments.map((tournament, i) => (
              <Reveal
                key={tournament.id}
                delay={i * 80}
                className={i === 0 ? "w-full lg:col-span-3" : "w-full"}
              >
                <div className="flex justify-center">
                  <TrophyCard tournament={tournament} labels={labels} featured={i === 0} />
                </div>
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
