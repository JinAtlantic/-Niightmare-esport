"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import OpponentLogo from "@/components/cards/OpponentLogo";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon, MlbbIcon, EfootballIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import type { Bilingual, GameId, Match, MatchResult } from "@/lib/types";

const COPY = {
  title: { en: "RECENT RESULTS", lo: "ຜົນການແຂ່ງຫຼ້າສຸດ" } as Bilingual,
  cta: { en: "ALL MATCHES", lo: "ການແຂ່ງທັງໝົດ" } as Bilingual,
  wins: { en: "WINS", lo: "ຊະນະ" } as Bilingual,
  losses: { en: "LOSSES", lo: "ແພ້" } as Bilingual,
  draws: { en: "DRAWS", lo: "ສະເໝີ" } as Bilingual,
  vs: { en: "vs", lo: "ພົບ" } as Bilingual,
};

// Each result owns a colour identity (green win / rose loss) carried across the
// card border, the ribbon/rail, and the score, so a glance reads W/L instantly.
const RESULT_STYLE: Record<
  MatchResult,
  {
    label: Bilingual;
    letter: string;
    text: string;
    border: string;
    glow: string;
    ribbon: string;
  }
> = {
  win: {
    label: { en: "WIN", lo: "ຊະນະ" },
    letter: "W",
    text: "text-win",
    border: "border-win/55",
    glow: "hover:shadow-[0_0_32px_-4px_rgba(52,211,153,0.55)]",
    ribbon: "from-win/25 via-win/10",
  },
  loss: {
    label: { en: "LOSS", lo: "ແພ້" },
    letter: "L",
    text: "text-loss",
    border: "border-loss/55",
    glow: "hover:shadow-[0_0_32px_-4px_rgba(251,113,133,0.5)]",
    ribbon: "from-loss/25 via-loss/10",
  },
  draw: {
    label: { en: "DRAW", lo: "ສະເໝີ" },
    letter: "D",
    text: "text-ash",
    border: "border-edge-bright",
    glow: "hover:shadow-[0_0_26px_-6px_rgba(168,85,247,0.4)]",
    ribbon: "from-edge/45 via-edge/10",
  },
};

/** Tournament identity key (game + normalised name) — mirrors /matches. */
function groupKey(m: Match) {
  const name = (m.tournament.en || m.tournament.lo).trim().toLowerCase().replace(/\s+/g, " ");
  return `${m.game}:${name || "unknown"}`;
}

function ResultCard({ match }: { match: Match }) {
  const { pick, lang } = useLanguage();
  const s = RESULT_STYLE[match.result];
  const opponent = match.opponent.trim() || "TBD";
  const round = match.round && pick(match.round).trim() ? pick(match.round) : null;
  const date = formatDate(match.date, lang);

  return (
    <article
      className={`group relative overflow-hidden border ${s.border} bg-gradient-to-br from-crypt2/85 via-crypt/70 to-void transition-all duration-300 ${s.glow}`}
    >
      {/* ── MOBILE: compact horizontal row — easy to scan in a single column ── */}
      <div className="flex items-stretch sm:hidden">
        <div
          className={`flex w-[52px] shrink-0 items-center justify-center border-r ${s.border} bg-gradient-to-b ${s.ribbon} to-transparent`}
        >
          <span className={`font-display text-2xl font-black leading-none ${s.text}`}>
            {s.letter}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={30} />
            <span className={`font-display text-2xl font-extrabold leading-none ${s.text}`}>
              {match.score}
            </span>
            <OpponentLogo src={match.opponentLogo} name={opponent} abbr={match.opponentAbbr} size={30} />
            <span className="keep-latin ml-1 min-w-0 flex-1 truncate font-display text-[13px] font-bold uppercase leading-tight text-soul">
              {opponent}
            </span>
          </div>
          {/* full-width meta line so the round never overflows */}
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ash">
            {date}
            {round ? ` · ${round}` : ""}
          </p>
        </div>
      </div>

      {/* ── sm+ : vertical card ── */}
      <div className="hidden sm:block">
        <div
          className={`flex items-center justify-between gap-2 border-b ${s.border} bg-gradient-to-r ${s.ribbon} to-transparent px-3 py-2`}
        >
          <span
            className={`font-display text-sm font-extrabold uppercase tracking-[0.16em] ${s.text}`}
          >
            {pick(s.label)}
          </span>
          <time dateTime={match.date} className="font-mono text-[10px] tracking-wide text-ash">
            {date}
          </time>
        </div>

        <div className="px-3 py-4">
          <div className="flex items-center justify-center gap-3">
            <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={40} />
            <span
              className={`keep-latin font-display text-3xl font-extrabold leading-none tracking-[0.04em] ${s.text}`}
            >
              {match.score}
            </span>
            <OpponentLogo src={match.opponentLogo} name={opponent} abbr={match.opponentAbbr} size={40} />
          </div>
          <p className="mt-3 truncate text-center font-display text-sm font-bold uppercase tracking-[0.03em] text-soul">
            <span className="text-ash-dim">{pick(COPY.vs)} </span>
            <span className="keep-latin">{opponent}</span>
          </p>
          {round && (
            <p className="mt-1 truncate text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ash-dim">
              {round}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function RecordPill({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className={`flex items-center gap-2.5 border px-4 py-2 ${tone}`}>
      <span className="font-display text-2xl font-extrabold leading-none tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
        {label}
      </span>
    </div>
  );
}

/**
 * Home-page results band — every result from the club's most recent tournament
 * (not a mixed feed), with a colour-coded W/L treatment and that tournament's
 * record. On phones each result is a single-column horizontal row for easy
 * scanning; from sm up it becomes a card grid. Routes into the full /matches
 * archive. Hidden when there are no matches so the band never renders empty.
 */
export default function RecentResults() {
  const { pick } = useLanguage();
  const data = useContent().matches as { matches?: Match[] };
  const all = data.matches ?? [];
  if (all.length === 0) return null;

  // Newest match first → its tournament is "the latest tournament".
  const sorted = [...all].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const latestKey = groupKey(sorted[0]);
  const group = sorted.filter((m) => groupKey(m) === latestKey);

  const tournamentName = sorted[0].tournament;
  const game: GameId = sorted[0].game;
  const GameIcon = game === "mlbb" ? MlbbIcon : EfootballIcon;

  const wins = group.filter((m) => m.result === "win").length;
  const losses = group.filter((m) => m.result === "loss").length;
  const draws = group.filter((m) => m.result === "draw").length;

  const shown = group.slice(0, 8);

  return (
    <section className="relative overflow-hidden border-t border-edge bg-void px-4 py-20 md:px-6 md:py-24">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 h-64 w-[min(900px,92vw)] -translate-x-1/2 bg-amethyst/10 blur-3xl"
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered>{pick(COPY.title)}</SectionLabel>
        </Reveal>

        {/* the tournament these results belong to */}
        <Reveal>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex max-w-full items-center gap-2 border border-amethyst/40 bg-amethyst/10 px-4 py-1.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-glow">
              <GameIcon size={15} className="shrink-0 text-amethyst" />
              <span className="keep-latin truncate">{pick(tournamentName)}</span>
            </span>
          </div>
        </Reveal>

        {/* tournament record — big, clear W / L counts */}
        <Reveal>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <RecordPill value={wins} label={pick(COPY.wins)} tone="border-win/50 bg-win/10 text-win" />
            {draws > 0 && (
              <RecordPill value={draws} label={pick(COPY.draws)} tone="border-edge-bright bg-crypt2 text-ash" />
            )}
            <RecordPill value={losses} label={pick(COPY.losses)} tone="border-loss/50 bg-loss/10 text-loss" />
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {shown.map((match, i) => (
            <Reveal key={match.id} delay={i * 80} className="h-full">
              <ResultCard match={match} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex justify-center">
            <Link
              href="/matches"
              className="group inline-flex items-center gap-2.5 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
            >
              {pick(COPY.cta)}
              <ArrowRightIcon
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
