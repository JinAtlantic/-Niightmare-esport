"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import TournamentAccordion from "@/components/sections/TournamentAccordion";
import OpponentLogo from "@/components/cards/OpponentLogo";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { PlayIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import { useContent } from "@/components/context/ContentContext";
import type { GameId, Match, MatchResult, Tournament } from "@/lib/types";

type Filter = "all" | "mlbb" | "efootball" | "wins" | "losses";

const FILTERS: { id: Filter; labelKey: string }[] = [
  { id: "all", labelKey: "matches.filter_all" },
  { id: "mlbb", labelKey: "matches.filter_mlbb" },
  { id: "efootball", labelKey: "matches.filter_efootball" },
  { id: "wins", labelKey: "matches.filter_wins" },
  { id: "losses", labelKey: "matches.filter_losses" },
];

const RESULT_KEY: Record<MatchResult, string> = {
  win: "matches.result_win",
  loss: "matches.result_loss",
  draw: "matches.result_draw",
};

const RESULT_ACCENT: Record<MatchResult, { score: string; badge: string }> = {
  win: { score: "text-win", badge: "border-win/50 bg-win/10 text-win" },
  loss: { score: "text-loss", badge: "border-loss/50 bg-loss/10 text-loss" },
  draw: { score: "text-ash", badge: "border-edge bg-crypt2 text-ash" },
};

// Left accent blade colored by game type — neon violet for MLBB (MOBA),
// neon cyan for eFootball (sporty contrast). The result is still conveyed by
// the score color and the result badge.
const GAME_BLADE: Record<GameId, string> = {
  mlbb: "bg-amethyst shadow-[0_0_10px_rgba(168,85,247,0.85)]",
  efootball: "bg-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.85)]",
};

const MATCH_LOGO_SIZE = 64;
const MOBILE_MATCH_LOGO_SIZE = 72;

function StatsStrip({
  wins,
  draws,
  losses,
  winrate,
}: {
  wins: number;
  draws: number;
  losses: number;
  winrate: number;
}) {
  const { t } = useLanguage();
  const tiles = [
    { value: wins, suffix: "", label: t("matches.filter_wins"), tone: "text-win" },
    { value: draws, suffix: "", label: t("matches.draws"), tone: "text-ash" },
    { value: losses, suffix: "", label: t("matches.filter_losses"), tone: "text-loss" },
    { value: winrate, suffix: "%", label: t("matches.winrate"), tone: "text-glow" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((s, i) => (
        <div key={i} className="clip-diagonal border border-edge bg-crypt px-5 py-4">
          <CountUp
            value={s.value}
            suffix={s.suffix}
            className={`block font-display text-3xl font-bold tabular-nums ${s.tone}`}
          />
          <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/** VOD control rendered on every row. Active link when a VOD exists,
 *  otherwise a disabled "VOD SOON" placeholder of the same footprint so
 *  the score/badge/VOD columns stay aligned across all rows. */
function VodButton({ href }: { href: string | null }) {
  const { t } = useLanguage();
  const base =
    "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} border-edge bg-void/40 text-ash hover:border-amethyst hover:text-glow`}
      >
        <PlayIcon size={13} />
        {t("common.watch_vod")}
      </a>
    );
  }

  return (
    <span
      aria-disabled="true"
      className={`${base} cursor-not-allowed border-edge/60 bg-void/20 text-ash-dim`}
    >
      {t("matches.vod_soon")}
    </span>
  );
}

function MatchCard({ match }: { match: Match }) {
  const { t, pick, lang } = useLanguage();
  const accent = RESULT_ACCENT[match.result];
  const round = match.round && pick(match.round).trim() ? pick(match.round) : null;

  return (
    <article className="hover-glow group relative overflow-hidden border border-edge bg-crypt p-5 pl-6 md:p-6 md:pl-7">
      {/* left accent blade — colored by game type (MLBB = violet, eFootball = cyan) */}
      <span aria-hidden className={`absolute left-0 top-0 h-full w-1 ${GAME_BLADE[match.game]}`} />

      {/* header: date | round */}
      <div className="flex items-center justify-between gap-3">
        <time className="whitespace-nowrap font-mono text-xs tracking-wide text-ash" dateTime={match.date}>
          {formatDate(match.date, lang)}
        </time>
        {round && (
          <span className="shrink-0 border border-edge-bright bg-void/40 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre">
            {round}
          </span>
        )}
      </div>

      {/* tournament name — enlarged */}
      <p className="mt-3 text-center font-display text-lg font-bold uppercase tracking-[0.04em] text-soul md:text-xl">
        {pick(match.tournament)}
      </p>

      <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-y border-edge/70 bg-void/25 py-4 md:hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/50 to-transparent"
        />
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={MOBILE_MATCH_LOGO_SIZE} />
          <span className="keep-latin max-w-[104px] break-words font-display text-xs font-bold uppercase leading-tight text-soul">
            NIIGHTMARE
          </span>
        </div>

        <div className="flex min-w-[74px] flex-col items-center">
          <span className={`keep-latin font-display text-4xl font-bold leading-none tracking-[0.08em] ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`mt-2 border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${accent.badge}`}
          >
            {t(RESULT_KEY[match.result])}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <OpponentLogo src={match.opponentLogo} name={match.opponent} size={MOBILE_MATCH_LOGO_SIZE} />
          <span className="keep-latin max-w-[104px] break-words font-display text-xs font-bold uppercase leading-tight text-soul">
            {match.opponent}
          </span>
        </div>
      </div>

      {/* desktop head-to-head: names stay horizontal with logos on the outer edges. */}
      <div className="mt-4 hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-5">
        {/* NIIGHTMARE side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-start md:gap-3">
          <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={MATCH_LOGO_SIZE} />
          <span className="keep-latin truncate font-display text-base font-bold uppercase leading-tight text-soul md:text-2xl">
            NIIGHTMARE
          </span>
        </div>

        {/* score + result */}
        <div className="flex flex-col items-center">
          <span className={`keep-latin font-display text-3xl font-bold tracking-[0.1em] md:text-4xl ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`mt-1 border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] md:text-[10px] ${accent.badge}`}
          >
            {t(RESULT_KEY[match.result])}
          </span>
        </div>

        {/* opponent side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-end md:gap-3">
          <span className="keep-latin truncate text-center font-display text-base font-bold uppercase leading-tight text-soul md:text-right md:text-2xl">
            {match.opponent}
          </span>
          <OpponentLogo src={match.opponentLogo} name={match.opponent} size={MATCH_LOGO_SIZE} />
        </div>
      </div>

      {/* VOD — always present */}
      <div className="mx-auto mt-4 max-w-xs">
        <VodButton href={match.vod} />
      </div>
    </article>
  );
}

export default function MatchesClient() {
  const { t } = useLanguage();
  const data = useContent().matches as {
    matches: Match[];
    tournaments: Tournament[];
  };
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const count = (r: MatchResult) => data.matches.filter((m) => m.result === r).length;
    const wins = count("win");
    const losses = count("loss");
    const draws = count("draw");
    const total = data.matches.length || 1;
    return { wins, losses, draws, winrate: Math.round((wins / total) * 100) };
  }, [data]);

  const filtered = useMemo(() => {
    return data.matches.filter((m) => {
      switch (filter) {
        case "mlbb":
          return m.game === "mlbb";
        case "efootball":
          return m.game === "efootball";
        case "wins":
          return m.result === "win";
        case "losses":
          return m.result === "loss";
        default:
          return true;
      }
    });
  }, [filter, data]);

  return (
    <>
      <PageHeader
        kicker={t("matches.kicker")}
        title={t("sections.match_results")}
        subtitle={t("matches.intro")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {/* Record summary */}
        <Reveal>
          <StatsStrip {...stats} />
        </Reveal>

        {/* Filter bar */}
        <Reveal className="mt-10" delay={80}>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, labelKey }) => {
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[44px] items-center border px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ${
                    active
                      ? "border-amethyst bg-amethyst/15 text-soul shadow-[0_0_16px_rgba(168,85,247,0.35)]"
                      : "border-edge bg-crypt text-ash hover:border-edge-bright hover:text-soul"
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Results list — re-keyed per filter so rows re-enter on change */}
        <div key={filter} className="mt-8 flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((match, i) => (
              <Reveal key={match.id} delay={i * 55}>
                <MatchCard match={match} />
              </Reveal>
            ))
          ) : (
            <p className="border border-edge bg-crypt p-8 text-center font-mono text-sm text-ash">
              {t("matches.no_results")}
            </p>
          )}
        </div>

        {/* Tournament history */}
        <div className="mt-20">
          <SectionLabel kicker={t("matches.history_kicker")}>
            {t("sections.tournament_history")}
          </SectionLabel>
          <div className="mt-8">
            <TournamentAccordion tournaments={data.tournaments} />
          </div>
        </div>
      </section>
    </>
  );
}
