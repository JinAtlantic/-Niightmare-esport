"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import PageHeader from "@/components/PageHeader";
import SectionLabel from "@/components/SectionLabel";
import TournamentAccordion from "@/components/TournamentAccordion";
import OpponentLogo from "@/components/OpponentLogo";
import Reveal from "@/components/Reveal";
import { EfootballIcon, MlbbIcon, PlayIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import matchesData from "@/data/matches.json";
import type { Match, MatchResult, Tournament } from "@/lib/types";

const data = matchesData as { matches: Match[]; tournaments: Tournament[] };

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

const RESULT_ACCENT: Record<MatchResult, { blade: string; score: string; badge: string }> = {
  win: { blade: "bg-win", score: "text-win", badge: "border-win/50 bg-win/10 text-win" },
  loss: { blade: "bg-loss", score: "text-loss", badge: "border-loss/50 bg-loss/10 text-loss" },
  draw: { blade: "bg-draw", score: "text-ash", badge: "border-edge bg-crypt2 text-ash" },
};

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
    { value: String(wins), label: t("matches.filter_wins"), tone: "text-win" },
    { value: String(draws), label: t("matches.draws"), tone: "text-ash" },
    { value: String(losses), label: t("matches.filter_losses"), tone: "text-loss" },
    { value: `${winrate}%`, label: t("matches.winrate"), tone: "text-glow" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((s, i) => (
        <div key={i} className="clip-diagonal border border-edge bg-crypt px-5 py-4">
          <p className={`font-display text-3xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
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
  const GameIcon = match.game === "mlbb" ? MlbbIcon : EfootballIcon;
  const accent = RESULT_ACCENT[match.result];

  // Fixed-width score / badge / VOD columns keep every row in vertical
  // alignment; the tournament column flexes to absorb the slack.
  return (
    <article className="hover-glow group relative flex flex-wrap items-center gap-x-3 gap-y-3 overflow-hidden border border-edge bg-crypt p-4 pl-6 md:flex-nowrap md:gap-6">
      {/* result blade */}
      <span aria-hidden className={`absolute left-0 top-0 h-full w-[3px] ${accent.blade}`} />

      {/* game + date */}
      <div className="order-1 flex items-center gap-3 md:w-[150px] md:shrink-0">
        <GameIcon size={20} className="shrink-0 text-amethyst" />
        <time className="whitespace-nowrap font-mono text-xs tracking-wide text-ash" dateTime={match.date}>
          {formatDate(match.date, lang)}
        </time>
      </div>

      {/* tournament + opponent */}
      <div className="order-4 min-w-0 basis-full md:order-none md:basis-auto md:flex-1">
        <p className="truncate font-display text-sm font-semibold uppercase tracking-[0.06em] text-soul">
          {pick(match.tournament)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <OpponentLogo src={match.opponentLogo} name={match.opponent} />
          <p className="min-w-0 truncate font-mono text-xs text-ash">
            <span className="text-ash-dim">vs</span>{" "}
            <span className="keep-latin text-spectre">{match.opponent}</span>
          </p>
        </div>
      </div>

      {/* score */}
      <div
        className={`keep-latin order-2 ml-auto shrink-0 text-right font-display text-2xl font-bold tracking-[0.12em] md:order-none md:ml-0 md:w-[60px] md:text-center ${accent.score}`}
      >
        {match.score}
      </div>

      {/* result badge */}
      <span
        className={`order-3 shrink-0 border px-2.5 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] md:order-none md:w-[92px] ${accent.badge}`}
      >
        {t(RESULT_KEY[match.result])}
      </span>

      {/* VOD — always present */}
      <div className="order-5 basis-full md:order-none md:w-[140px] md:shrink-0 md:basis-auto">
        <VodButton href={match.vod} />
      </div>
    </article>
  );
}

export default function MatchesClient() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const count = (r: MatchResult) => data.matches.filter((m) => m.result === r).length;
    const wins = count("win");
    const losses = count("loss");
    const draws = count("draw");
    const total = data.matches.length || 1;
    return { wins, losses, draws, winrate: Math.round((wins / total) * 100) };
  }, []);

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
  }, [filter]);

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
