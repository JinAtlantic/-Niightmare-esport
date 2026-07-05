"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import AuroraHalos from "@/components/ui/AuroraHalos";
import OpponentLogo from "@/components/cards/OpponentLogo";
import OpponentFlag from "@/components/cards/OpponentFlag";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import RoadmapModal from "@/components/sections/RoadmapModal";
import { PlayIcon, SearchIcon, CloseIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import { tournamentTier, type Tier } from "@/lib/tiers";
import { resolveRoadmap, type RoadmapContent } from "@/lib/roadmap";
import { matchVods } from "@/lib/matchVods";
import { cleanBo } from "@/lib/bestOf";
import { safeHref } from "@/lib/safety";
import { useContent } from "@/components/context/ContentContext";
import matchesSeed from "@/data/matches.json";
import type { Bilingual, GameId, Match, MatchResult, MatchVod, Tournament } from "@/lib/types";

type Filter = "all" | "mlbb" | "efootball" | "wins" | "losses";
type ResultFilter = "all" | "wins" | "losses";
type SortOrder = "newest" | "oldest" | "prize-high" | "prize-low";

const GAME_FILTERS: GameId[] = ["mlbb", "efootball"];
const RESULT_FILTERS: ResultFilter[] = ["all", "wins", "losses"];

interface MatchesPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  recordLabel: Bilingual;
  recordIntro: Bilingual;
  historyKicker: Bilingual;
  historyTitle: Bilingual;
  noResults: Bilingual;
  unknownOpponent: Bilingual;
  unknownTournament: Bilingual;
  vodSoon: Bilingual;
  watchVod: Bilingual;
  sortLabel: Bilingual;
  sortNewest: Bilingual;
  sortOldest: Bilingual;
  sortPrizeHigh: Bilingual;
  sortPrizeLow: Bilingual;
  yearLabel: Bilingual;
  allYears: Bilingual;
  defaultGame: GameId;
  filters: Record<Filter, Bilingual>;
  stats: Record<"wins" | "draws" | "losses" | "winrate", Bilingual>;
  results: Record<MatchResult, Bilingual>;
  tournamentLabels: Record<"placement" | "prize" | "season", Bilingual>;
}

const pageSeed = matchesSeed.page as MatchesPageCopy;

function mergePageCopy(page?: Partial<MatchesPageCopy>): MatchesPageCopy {
  return {
    ...pageSeed,
    ...page,
    defaultGame: page?.defaultGame === "efootball" ? "efootball" : "mlbb",
    filters: { ...pageSeed.filters, ...(page?.filters ?? {}) },
    stats: { ...pageSeed.stats, ...(page?.stats ?? {}) },
    results: { ...pageSeed.results, ...(page?.results ?? {}) },
    tournamentLabels: { ...pageSeed.tournamentLabels, ...(page?.tournamentLabels ?? {}) },
  };
}

const RESULT_ACCENT: Record<MatchResult, { score: string; badge: string }> = {
  win: { score: "text-win", badge: "border-win/50 bg-win/10 text-win" },
  loss: { score: "text-loss", badge: "border-loss/50 bg-loss/10 text-loss" },
  draw: { score: "text-ash", badge: "border-edge bg-crypt2 text-ash" },
};

// Left accent blade colored by the tournament's Liquipedia tier (green C →
// cyan B → violet A → gold S). Tournaments outside the main families fall back
// to the brand violet. The result is still conveyed by the score color + badge.
const TIER_BLADE: Record<Tier | "default", string> = {
  C: "bg-win shadow-[0_0_10px_rgba(52,211,153,0.8)]",
  B: "bg-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.8)]",
  A: "bg-amethyst shadow-[0_0_10px_rgba(168,85,247,0.85)]",
  S: "bg-gold shadow-[0_0_10px_rgba(245,196,81,0.85)]",
  default: "bg-amethyst shadow-[0_0_10px_rgba(168,85,247,0.85)]",
};

// Tier text on each tournament group header — colour only, no boxed badge.
const TIER_TAG: Record<Tier, string> = {
  C: "text-win",
  B: "text-[#7DD3FC]",
  A: "text-glow",
  S: "text-gold",
};

const TIER_BORDER: Record<Tier, string> = {
  C: "border-win/55",
  B: "border-cyan-300/55",
  A: "border-amethyst/60",
  S: "border-gold/65",
};

const TIER_BORDER_SOFT: Record<Tier, string> = {
  C: "border-win/35",
  B: "border-cyan-300/35",
  A: "border-amethyst/40",
  S: "border-gold/45",
};

const TIER_SHADOW: Record<Tier, string> = {
  C: "shadow-[0_0_26px_rgba(52,211,153,0.16)]",
  B: "shadow-[0_0_26px_rgba(103,232,249,0.16)]",
  A: "shadow-[0_0_28px_rgba(168,85,247,0.2)]",
  S: "shadow-[0_0_30px_rgba(245,196,81,0.18)]",
};

const TIER_SURFACE: Record<Tier, string> = {
  C: "bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_35%),linear-gradient(135deg,rgba(6,78,59,0.28),rgba(22,16,31,0.78)_40%,rgba(11,7,16,0.98))]",
  B: "bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.24),transparent_35%),linear-gradient(135deg,rgba(8,47,73,0.32),rgba(22,16,31,0.78)_40%,rgba(11,7,16,0.98))]",
  A: "bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.25),transparent_35%),linear-gradient(135deg,rgba(88,28,135,0.32),rgba(22,16,31,0.78)_40%,rgba(11,7,16,0.98))]",
  S: "bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,0.25),transparent_35%),linear-gradient(135deg,rgba(113,63,18,0.34),rgba(22,16,31,0.78)_40%,rgba(11,7,16,0.98))]",
};

const TIER_SURFACE_SOFT: Record<Tier, string> = {
  C: "bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_34%),linear-gradient(135deg,rgba(6,78,59,0.18),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))]",
  B: "bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.18),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.22),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))]",
  A: "bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.2),transparent_34%),linear-gradient(135deg,rgba(88,28,135,0.22),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))]",
  S: "bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,0.19),transparent_34%),linear-gradient(135deg,rgba(113,63,18,0.24),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))]",
};

const TIER_LINE: Record<Tier, string> = {
  C: "via-win/85",
  B: "via-cyan-300/85",
  A: "via-amethyst/90",
  S: "via-gold/90",
};

const TIER_VALUE: Record<Tier, string> = {
  C: "text-win",
  B: "text-cyan-200",
  A: "text-glow",
  S: "text-gold",
};

const MATCH_LOGO_SIZE = 64;
const MOBILE_MATCH_LOGO_SIZE = 72;

interface TournamentMatchGroup {
  key: string;
  name: Bilingual;
  game: GameId;
  tournament?: Tournament;
  matches: Match[];
  latestDate: string;
  earliestDate: string;
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractYear(value?: string | null) {
  const match = value?.match(/\b(20\d{2}|19\d{2})\b/);
  return match?.[1] ?? "";
}

function tournamentKey(match: Match) {
  const name = normalizeValue(match.tournament.en || match.tournament.lo);
  return `${match.game}:${name || "unknown"}`;
}

function matchTournamentKey(match: Pick<Match, "game" | "tournament">) {
  const name = normalizeValue(match.tournament.en || match.tournament.lo);
  return `${match.game}:${name || "unknown"}`;
}

/** Strip season / year tokens so the same event across seasons collapses to one
 *  family (e.g. "… Season 7" / "… 2026" → the bare name). Used by the Tournament
 *  filter so it lists each event once, not once per season. */
function baseName(value: string) {
  return value
    .replace(/\bseason\s*\d+\b/gi, "")
    .replace(/\bs\d+\b/gi, "")
    .replace(/\bm\d+\b/gi, "") // M-series worlds: M5 / M6 / M7 / M8 → one family
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function baseTournamentKey(game: string, name: Bilingual) {
  const n = normalizeValue(baseName(name.en || name.lo));
  return `${game}:${n || "unknown"}`;
}

function parsePrizeValue(value?: string) {
  const text = (value ?? "").trim().toLowerCase();
  if (!text || text === "-") return 0;
  const multiplier = text.includes("b") ? 1_000_000_000 : text.includes("m") ? 1_000_000 : text.includes("k") ? 1_000 : 1;
  const numeric = text.match(/\d[\d.,]*/)?.[0] ?? "";
  if (!numeric) return 0;

  // Strip thousands separators but KEEP the decimal point, so "$3,072.51"
  // parses as 3072.51 — not 307251. Stripping the dot inflated cents-bearing
  // prizes ~100x and broke the "highest prize" sort. Commas are thousands
  // separators in this data.
  const n = Number(numeric.replace(/,/g, ""));
  return (Number.isFinite(n) ? n : 0) * multiplier;
}

function roundRank(match: Match) {
  const round = normalizeValue(`${match.round?.en ?? ""} ${match.round?.lo ?? ""}`);

  if (!round) return 45;
  if (/wild|qualifier|qualification|play[-\s]?in|prelim/.test(round)) return 10;
  if (/group|league|swiss/.test(round)) return 20;
  if (/round\s*of\s*16|last\s*16|ro16/.test(round)) return 30;
  if (/quarter|qf|last\s*8|ro8/.test(round)) return 40;
  if (/semi|sf/.test(round)) return 50;
  if (/grand\s*final|finals/.test(round)) return 70;
  if (/final/.test(round)) return 60;

  return 45;
}

function sortMatchesByDate(a: Match, b: Match, sortOrder: SortOrder) {
  const dateDelta =
    sortOrder === "oldest"
      ? (a.date ?? "").localeCompare(b.date ?? "")
      : (b.date ?? "").localeCompare(a.date ?? "");
  if (dateDelta !== 0) return dateDelta;
  return roundRank(a) - roundRank(b);
}

function groupMatchesByTournament(
  matches: Match[],
  tournaments: Tournament[],
  fallbackName: Bilingual,
  sortOrder: SortOrder,
  placementOnly: Tournament[] = []
) {
  const tournamentByKey = new Map(
    tournaments.map((tournament) => [
      `${tournament.game}:${normalizeValue(tournament.name.en || tournament.name.lo)}`,
      tournament,
    ])
  );
  const groups = new Map<string, TournamentMatchGroup>();

  for (const match of matches) {
    const key = tournamentKey(match);
    const tournament = tournamentByKey.get(key);
    const existing = groups.get(key);

    if (existing) {
      existing.matches.push(match);
      if ((match.date ?? "") > existing.latestDate) existing.latestDate = match.date;
      if ((match.date ?? "") < existing.earliestDate) existing.earliestDate = match.date;
      continue;
    }

    groups.set(key, {
      key,
      name: match.tournament.en || match.tournament.lo ? match.tournament : fallbackName,
      game: match.game,
      tournament,
      matches: [match],
      latestDate: match.date,
      earliestDate: match.date,
    });
  }

  // Placement-only tournaments (no logged matches, e.g. older records) — surface
  // them as empty groups so their placement/prize still shows on the timeline.
  for (const t of placementOnly) {
    const key = `${t.game}:${normalizeValue(t.name.en || t.name.lo)}`;
    if (groups.has(key)) continue;
    const yr = extractYear(t.season);
    const anchor = yr ? `${yr}-06-30` : "";
    groups.set(key, {
      key,
      name: t.name,
      game: t.game,
      tournament: t,
      matches: [],
      latestDate: anchor,
      earliestDate: anchor,
    });
  }

  return [...groups.values()]
    .map((group) => ({ ...group, matches: [...group.matches].sort((a, b) => sortMatchesByDate(a, b, sortOrder)) }))
    .sort((a, b) => {
      if (sortOrder === "prize-high" || sortOrder === "prize-low") {
        const prizeDelta = parsePrizeValue(a.tournament?.prize) - parsePrizeValue(b.tournament?.prize);
        if (prizeDelta !== 0) return sortOrder === "prize-high" ? -prizeDelta : prizeDelta;
      }

      const dateDelta = sortOrder === "oldest"
        ? (a.earliestDate ?? "").localeCompare(b.earliestDate ?? "")
        : (b.latestDate ?? "").localeCompare(a.latestDate ?? "");
      if (dateDelta !== 0) return dateDelta;
      return normalizeValue(a.name.en || a.name.lo).localeCompare(normalizeValue(b.name.en || b.name.lo));
    });
}

function StatsStrip({
  wins,
  losses,
  winrate,
  page,
}: {
  wins: number;
  losses: number;
  winrate: number;
  page: MatchesPageCopy;
}) {
  const { pick } = useLanguage();
  // Scoreboard tiles — each carries a colour identity (green win / rose loss /
  // violet rate) on a top accent bar so the record reads at a glance.
  const tiles = [
    { value: wins, suffix: "", label: pick(page.stats.wins), tone: "text-win", bar: "bg-win", border: "border-win/40" },
    { value: losses, suffix: "", label: pick(page.stats.losses), tone: "text-loss", bar: "bg-loss", border: "border-loss/40" },
    { value: winrate, suffix: "%", label: pick(page.stats.winrate), tone: "text-glow", bar: "bg-amethyst", border: "border-amethyst/40" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {tiles.map((s, i) => (
        <div
          key={i}
          className={`relative overflow-hidden border ${s.border} bg-void/50 px-2 py-4 text-center sm:px-5`}
        >
          <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${s.bar}`} />
          <CountUp
            value={s.value}
            suffix={s.suffix}
            className={`block font-display text-[28px] font-bold leading-none tabular-nums ${s.tone} sm:text-4xl`}
          />
          <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ash sm:text-[11px] sm:tracking-[0.18em]">
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
function vodLabel(vod: MatchVod, lang: "en" | "lo") {
  if (vod.type === "game") return `Game ${vod.game ?? ""}`.trim();
  return lang === "lo" ? "ທັງແມັດ" : "Full Match";
}

function VodLinks({ match, page, compact = false }: { match: Match; page: MatchesPageCopy; compact?: boolean }) {
  const { pick, lang } = useLanguage();
  const vods = matchVods(match).map((vod) => ({ ...vod, url: safeHref(vod.url) })).filter((vod) => vod.url);
  const base =
    `inline-flex items-center justify-center gap-1.5 border font-mono font-semibold uppercase tracking-[0.1em] transition-colors ${
      compact ? "min-h-[30px] px-2.5 py-1 text-[9px]" : "min-h-[38px] px-3 py-1.5 text-[10px]"
    }`;

  if (vods.length) {
    return (
      <div className="flex flex-wrap justify-center gap-1.5">
        {vods.map((vod, index) => (
          <a
            key={`${vod.url}-${index}`}
            href={vod.url}
            target="_blank"
            rel="noopener noreferrer"
            title={vod.type === "game" ? `VOD for Game ${vod.game ?? index + 1}` : "VOD for the full match"}
            className={`${base} border-edge bg-void/40 text-ash hover:border-amethyst hover:text-glow hover:shadow-[0_0_18px_rgba(168,85,247,0.25)]`}
          >
            <PlayIcon size={compact ? 10 : 12} />
            {vodLabel(vod, lang)}
          </a>
        ))}
      </div>
    );
  }

  return (
    <span
      aria-disabled="true"
      className={`${base} w-full cursor-not-allowed border-edge/60 bg-void/20 text-ash-dim`}
    >
      {pick(page.vodSoon)}
    </span>
  );
}

function MatchCard({
  match,
  page,
  showTournament = true,
}: {
  match: Match;
  page: MatchesPageCopy;
  showTournament?: boolean;
}) {
  const { pick, lang } = useLanguage();
  const compact = !showTournament;
  const accent = RESULT_ACCENT[match.result];
  const round = match.round && pick(match.round).trim() ? pick(match.round) : null;
  const bo = cleanBo(match.bo);
  const tournamentName = pick(match.tournament).trim() || pick(page.unknownTournament);
  const opponentName = match.opponent.trim() || pick(page.unknownOpponent);
  // Blade colour by the tournament's tier (violet when it isn't a main family).
  const tier = tournamentTier(match.tournament.en || match.tournament.lo);
  const blade = TIER_BLADE[tier ?? "default"];
  const border = tier ? `${TIER_BORDER_SOFT[tier]} ${TIER_SHADOW[tier]}` : "border-edge";
  const surface = tier
    ? TIER_SURFACE_SOFT[tier]
    : "bg-[linear-gradient(135deg,rgba(28,20,40,0.92),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))]";
  const line = tier ? TIER_LINE[tier] : "via-spectre/45";
  const mobileLogoSize = compact ? 42 : MOBILE_MATCH_LOGO_SIZE;
  const desktopLogoSize = compact ? 44 : MATCH_LOGO_SIZE;

  return (
    <article
      className={`hover-glow group relative overflow-hidden border shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_-16px_rgba(0,0,0,0.6)] ${
        compact ? "p-3 pl-4 md:p-3 md:pl-4" : "p-5 pl-6 md:p-6 md:pl-7"
      } ${border} ${surface}`}
    >
      {/* left accent blade — colored by the tournament's tier */}
      <span aria-hidden className={`absolute left-0 top-0 h-full w-1 ${blade}`} />
      <span
        aria-hidden
        className={`absolute top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100 ${
          compact ? "inset-x-3" : "inset-x-6"
        } ${line}`}
      />
      <span
        aria-hidden
        className={`absolute bg-amethyst/10 blur-3xl ${
          compact ? "-right-14 -top-16 h-28 w-28" : "-right-20 -top-20 h-44 w-44"
        }`}
      />

      {/* header: date | round */}
      <div className="relative flex items-center justify-between gap-2">
        <time
          className={`shrink-0 whitespace-nowrap border border-edge bg-void/35 font-mono tracking-wide text-ash ${
            compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          }`}
          dateTime={match.date}
        >
          {formatDate(match.date, lang)}
        </time>
        {(round || bo) && (
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            {round && (
              <span
                title={round}
                className={`min-w-0 truncate border border-edge-bright bg-void/40 font-mono font-semibold uppercase tracking-[0.16em] text-spectre ${
                  compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                }`}
              >
                {round}
              </span>
            )}
            {bo && (
              <span
                className={`shrink-0 whitespace-nowrap border border-amethyst/40 bg-amethyst/10 font-mono font-bold uppercase tracking-[0.16em] text-glow ${
                  compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                }`}
              >
                {bo}
              </span>
            )}
          </div>
        )}
      </div>

      {showTournament && (
        <p className="mt-3 text-center font-display text-lg font-bold uppercase tracking-[0.04em] text-soul md:text-xl">
          {tournamentName}
        </p>
      )}

      <div
        className={`relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-y border-edge/70 bg-void/35 md:hidden ${
          compact ? "mt-2 py-2" : "mt-4 py-4"
        }`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/50 to-transparent"
        />
        <div className={`flex min-w-0 flex-col items-center text-center ${compact ? "gap-1" : "gap-2"}`}>
          <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={mobileLogoSize} />
          <span
            className={`keep-latin break-words font-display font-bold uppercase leading-tight text-soul ${
              compact ? "max-w-[88px] text-[10px]" : "max-w-[104px] text-xs"
            }`}
          >
            NIIGHTMARE
          </span>
        </div>

        <div className={`flex flex-col items-center border-x border-edge/70 px-2 ${compact ? "min-w-[62px]" : "min-w-[74px]"}`}>
          <span className={`keep-latin font-display font-bold leading-none tracking-[0.08em] ${compact ? "text-2xl" : "text-4xl"} ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${
              compact ? "mt-1" : "mt-2"
            } ${accent.badge}`}
          >
            {pick(page.results[match.result])}
          </span>
        </div>

        <div className={`flex min-w-0 flex-col items-center text-center ${compact ? "gap-1" : "gap-2"}`}>
          <OpponentLogo src={match.opponentLogo} name={opponentName} abbr={match.opponentAbbr} size={mobileLogoSize} />
          <span className="flex items-center justify-center gap-1">
            <OpponentFlag name={opponentName} width={14} />
            <span
              className={`keep-latin break-words font-display font-bold uppercase leading-tight text-soul ${
                compact ? "max-w-[88px] text-[10px]" : "max-w-[104px] text-xs"
              }`}
            >
              {opponentName}
            </span>
          </span>
        </div>
      </div>

      {/* desktop head-to-head: names stay horizontal with logos on the outer edges. */}
      <div
        className={`relative hidden border-y border-edge/70 bg-void/30 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center ${
          compact ? "mt-2 px-3 py-2 md:gap-3" : "mt-4 px-4 py-4 md:gap-5"
        }`}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-edge-bright to-transparent"
        />
        {/* NIIGHTMARE side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-start md:gap-3">
          <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={desktopLogoSize} />
          <span className={`keep-latin truncate font-display font-bold uppercase leading-tight text-soul ${compact ? "text-base md:text-lg" : "text-base md:text-2xl"}`}>
            NIIGHTMARE
          </span>
        </div>

        {/* score + result */}
        <div
          className={`relative z-[1] flex flex-col items-center border border-edge-bright bg-crypt/80 shadow-[0_0_24px_rgba(168,85,247,0.12)] ${
            compact ? "min-w-[104px] px-3 py-1.5" : "min-w-[132px] px-4 py-3"
          }`}
        >
          <span className={`keep-latin font-display font-bold tracking-[0.1em] ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`mt-1 border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${
              compact ? "" : "md:text-[10px]"
            } ${accent.badge}`}
          >
            {pick(page.results[match.result])}
          </span>
        </div>

        {/* opponent side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-end md:gap-3">
          <span className={`keep-latin truncate text-center font-display font-bold uppercase leading-tight text-soul md:text-right ${compact ? "text-base md:text-lg" : "text-base md:text-2xl"}`}>
            {opponentName}
          </span>
          <OpponentFlag name={opponentName} width={22} />
          <OpponentLogo src={match.opponentLogo} name={opponentName} abbr={match.opponentAbbr} size={desktopLogoSize} />
        </div>
      </div>

      {/* VOD — always present */}
      <div className={`mx-auto ${compact ? "mt-2 max-w-[190px]" : "mt-4 max-w-xs"}`}>
        <VodLinks match={match} page={page} compact={compact} />
      </div>
    </article>
  );
}

function TournamentRecordGroup({
  group,
  page,
  forceOpen = false,
}: {
  group: TournamentMatchGroup;
  page: MatchesPageCopy;
  forceOpen?: boolean;
}) {
  const { pick, lang } = useLanguage();
  const [open, setOpen] = useState(forceOpen);
  // Expand automatically while a search is active so the matching matches (and
  // their VODs) are visible without an extra click.
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  const tournament = group.tournament;
  const matchCount = group.matches.length;
  // A placement-only entry (older / no logged matches): show the placement +
  // prize, but hide the W/L tally and the expandable match list.
  const placementOnly = matchCount === 0;
  const tier = tournamentTier(group.name.en || group.name.lo);
  const border = tier ? `${TIER_BORDER[tier]} ${TIER_SHADOW[tier]}` : "border-edge shadow-[0_0_28px_rgba(168,85,247,0.1)]";
  const softBorder = tier ? TIER_BORDER_SOFT[tier] : "border-edge";
  const surface = tier ? TIER_SURFACE[tier] : "bg-gradient-to-br from-crypt2/80 via-crypt/55 to-void";
  const headerSurface = tier
    ? TIER_SURFACE_SOFT[tier]
    : "bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(22,16,31,0.78)_34%,rgba(11,7,16,0.98))]";
  const line = tier ? TIER_LINE[tier] : "via-amethyst/80";
  const valueTone = tier ? TIER_VALUE[tier] : "text-glow";
  const wins = group.matches.filter((match) => match.result === "win").length;
  const losses = group.matches.filter((match) => match.result === "loss").length;
  const latestDate = group.latestDate ? formatDate(group.latestDate, lang) : "";
  // Only show the placement/prize block when there is real content — auto-added
  // results (and freshly created tournaments) have empty placement/prize, and an
  // empty "PLACEMENT" box with no value looks broken.
  const showPlacement = Boolean(tournament && (tournament.placement.en || tournament.placement.lo || "").trim());
  const showPrize = Boolean(tournament && tournament.prize && tournament.prize.trim());

  return (
    <section
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
      className={`clip-esports max-w-full overflow-hidden border ${border} ${surface}`}
    >
      <div className={`group relative overflow-hidden border-b px-4 py-5 transition-colors sm:px-5 md:px-7 md:py-6 ${softBorder} ${headerSurface}`}>
        {!placementOnly && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "View"} matches for ${pick(group.name)}`}
            className="absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          />
        )}
        <span aria-hidden className={`absolute left-0 top-0 h-full w-1.5 ${tier ? TIER_BLADE[tier] : TIER_BLADE.default}`} />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,7,16,0.9),rgba(11,7,16,0.66)_48%,rgba(11,7,16,0.82))]"
        />
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${line}`}
        />
        <span
          aria-hidden
          className={`absolute bottom-0 left-0 h-px w-2/3 bg-gradient-to-r from-transparent to-transparent ${line}`}
        />
        <span
          aria-hidden
          className="absolute -right-6 -top-20 h-36 w-36 bg-amethyst/10 blur-3xl md:-right-16 md:h-44 md:w-44"
        />
        {tier && (
          <span
            aria-hidden
            className={`pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 font-display text-8xl font-black uppercase leading-none tracking-normal opacity-[0.09] lg:block ${TIER_TAG[tier]}`}
          >
            {tier}
          </span>
        )}
        <div className="pointer-events-none relative z-[1] grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {tier && (
                <span className={`inline-flex items-center gap-2 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] md:text-[11px] ${TIER_TAG[tier]}`}>
                  <span className={`h-1.5 w-8 ${TIER_BLADE[tier]}`} aria-hidden />
                  {tier}-Tier Tournament
                </span>
              )}
              {!placementOnly && (
                <span className="inline-flex font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre md:text-[11px]">
                  {matchCount} {matchCount === 1 ? "match" : "matches"}
                </span>
              )}
              {latestDate && (
                <span className="inline-flex font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash md:text-[11px]">
                  {latestDate}
                </span>
              )}
            </div>
            <h2 className="balance mt-3 max-w-4xl break-words font-display text-2xl font-extrabold uppercase leading-[0.98] tracking-[0.02em] text-soul [text-shadow:0_0_24px_rgba(236,231,242,0.18)] md:text-4xl">
              {pick(group.name)}
            </h2>
            {!placementOnly && (
              <div className={`mt-4 grid max-w-xs grid-cols-2 border bg-void/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] ${softBorder}`}>
                <div className={`border-r px-3 py-2 md:px-4 md:py-2.5 ${softBorder}`}>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-ash">{pick(page.stats.wins)}</p>
                  <p className="mt-1 font-display text-xl font-bold leading-none text-win md:text-2xl">{wins}</p>
                </div>
                <div className="px-3 py-2 md:px-4 md:py-2.5">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-ash">{pick(page.stats.losses)}</p>
                  <p className="mt-1 font-display text-xl font-bold leading-none text-loss md:text-2xl">{losses}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:items-end">
            {tournament && (showPlacement || showPrize) && (
              <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[390px]">
                {showPlacement && (
                <div className={`border bg-void/75 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:px-4 ${softBorder}`}>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ash">
                    {pick(page.tournamentLabels.placement)}
                  </p>
                  <p className={`mt-1 break-words font-display text-base font-extrabold uppercase leading-tight tracking-[0.04em] md:text-lg ${valueTone}`}>
                    {pick(tournament.placement)}
                  </p>
                </div>
                )}
                {showPrize && (
                  <div className={`border bg-void/75 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:px-4 ${softBorder}`}>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ash">
                      {pick(page.tournamentLabels.prize)}
                    </p>
                    <p className={`keep-latin mt-1 break-words font-display text-base font-extrabold uppercase leading-tight tracking-[0.04em] md:text-lg ${valueTone}`}>
                      {tournament.prize}
                    </p>
                  </div>
                )}
              </div>
            )}
            {!placementOnly && (
              <span className="w-full border border-edge-bright bg-void/70 px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-soul lg:w-auto lg:min-w-[150px]">
                {open ? "Hide Matches" : "View Matches"}
              </span>
            )}
          </div>
        </div>
      </div>

      {open && !placementOnly && (
        <div className="relative flex flex-col gap-1.5 bg-void/55 p-2 md:gap-2 md:p-3">
          <span
            aria-hidden
            className="absolute bottom-6 left-6 top-6 hidden w-px bg-gradient-to-b from-amethyst/70 via-edge-bright to-transparent md:block"
          />
          {group.matches.map((match, i) => (
            <Reveal key={match.id} delay={Math.min(i, 6) * 45}>
              <div className="grid gap-2 md:grid-cols-[34px_1fr] md:items-stretch">
                <div className="hidden md:grid md:place-items-center">
                  <span className="relative z-[1] grid h-7 w-7 place-items-center border border-amethyst/60 bg-void font-mono text-[10px] font-bold text-glow shadow-[0_0_14px_rgba(168,85,247,0.32)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 hidden h-px w-3 bg-edge-bright md:block"
                  />
                  <MatchCard match={match} page={page} showTournament={false} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function GameTournamentSection({
  game,
  groups,
  page,
  forceOpen = false,
}: {
  game: GameId;
  groups: TournamentMatchGroup[];
  page: MatchesPageCopy;
  forceOpen?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border border-edge bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.13),transparent_32%),linear-gradient(180deg,rgba(28,20,40,0.62),rgba(11,7,16,0.82))] p-3 shadow-[0_0_28px_rgba(168,85,247,0.12)] md:p-5">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-[2px] ${
          game === "mlbb"
            ? "bg-gradient-to-r from-transparent via-amethyst to-transparent"
            : "bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent"
        }`}
      />
      {/* tournament count — a slim, premium counter (the Game Division heading
          was removed; the game is still signalled by the top accent bar). */}
      <div className="mb-4 flex items-center justify-center gap-3.5 border border-edge bg-crypt/45 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:justify-start">
        <span
          aria-hidden
          className={`h-9 w-1.5 ${
            game === "mlbb"
              ? "bg-gradient-to-b from-amethyst to-glow shadow-[0_0_12px_rgba(168,85,247,0.6)]"
              : "bg-gradient-to-b from-[#22D3EE] to-[#7DD3FC] shadow-[0_0_12px_rgba(34,211,238,0.55)]"
          }`}
        />
        <span className="stat-num font-display text-3xl font-black leading-none md:text-4xl">
          {groups.length}
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-spectre">
          {groups.length === 1 ? "Tournament" : "Tournaments"}
        </span>
      </div>
      <div className="grid gap-4">
        {groups.map((group, i) => (
          // Cap the stagger so deep groups never wait on a long index-based
          // delay (All Years can have 20+ groups).
          <Reveal key={group.key} delay={Math.min(i, 4) * 55}>
            <TournamentRecordGroup group={group} page={page} forceOpen={forceOpen} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const selectClass =
  "h-12 w-full min-w-0 border border-edge bg-void/70 px-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-soul outline-none transition-colors hover:border-edge-bright focus:border-amethyst focus:shadow-[0_0_16px_rgba(168,85,247,0.28)]";

/**
 * Tournament picker. A native <select> is used everywhere else, but the
 * tournament list can be long AND the filter panel sits inside two
 * `overflow-hidden` ancestors — so a native (or plain absolute) dropdown gets
 * clipped / overflows the screen. This renders its menu into a `fixed`,
 * scrollable panel PORTALED to document.body (same trick as the sponsor/shop
 * popups), positioned under the trigger and capped to the viewport height.
 */
function TournamentSelect({
  groups,
  value,
  onChange,
  pick,
  allLabel,
  otherLabel,
}: {
  groups: { tier: Tier | null; options: { key: string; label: Bilingual }[] }[];
  value: string;
  onChange: (key: string) => void;
  pick: (b: Bilingual) => string;
  allLabel: string;
  otherLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    // Cap to ~60% of the viewport (mobile toolbars make full innerHeight unsafe),
    // and clamp horizontally so the panel never runs past the screen edges.
    const maxHeight = Math.max(160, Math.min(window.innerHeight * 0.6, window.innerHeight - r.bottom - 16));
    const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
    setBox({ left, top: r.bottom + 4, width: r.width, maxHeight });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    // The panel is fixed to the viewport, so re-anchor it on scroll/resize.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLabel = useMemo(() => {
    if (value === "all") return allLabel;
    for (const g of groups) for (const o of g.options) if (o.key === value) return pick(o.label);
    return allLabel;
  }, [value, groups, pick, allLabel]);

  const choose = (key: string) => { onChange(key); setOpen(false); };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { if (open) { setOpen(false); } else { place(); setOpen(true); } }}
        className="flex h-12 w-full min-w-0 items-center justify-between gap-2 border border-edge bg-void/70 px-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-soul outline-none transition-colors hover:border-edge-bright focus:border-amethyst focus:shadow-[0_0_16px_rgba(168,85,247,0.28)]"
      >
        <span className="truncate">{currentLabel}</span>
        <span aria-hidden className={`shrink-0 text-amethyst transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && box &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="listbox"
              style={{ position: "fixed", left: box.left, top: box.top, width: box.width, maxHeight: box.maxHeight }}
              className="z-50 overflow-y-auto border border-edge-bright bg-crypt shadow-[0_18px_44px_rgba(0,0,0,0.62)]"
            >
              <button
                type="button"
                onClick={() => choose("all")}
                className={`block w-full whitespace-normal break-words px-3 py-2 text-left font-mono text-[11px] font-bold uppercase leading-snug tracking-[0.08em] transition-colors hover:bg-edge/60 ${value === "all" ? "bg-amethyst/15 text-soul" : "text-ash"}`}
              >
                {allLabel}
              </button>
              {groups.map((g) => (
                <div key={g.tier ?? "other"}>
                  <div className="border-t border-edge bg-void/60 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ash-dim">
                    {g.tier ? `${g.tier}-Tier` : otherLabel}
                  </div>
                  {g.options.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => choose(o.key)}
                      className={`block w-full whitespace-normal break-words px-3 py-2 text-left font-mono text-[11px] font-bold uppercase leading-snug tracking-[0.06em] transition-colors hover:bg-edge/60 ${value === o.key ? "bg-amethyst/15 text-soul" : "text-ash"}`}
                    >
                      {pick(o.label)}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

export default function MatchesClient() {
  const { pick } = useLanguage();
  const content = useContent();
  const data = content.matches as {
    page?: Partial<MatchesPageCopy>;
    matches: Match[];
    tournaments: Tournament[];
  };
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const page = mergePageCopy(data.page);
  const roadmap = resolveRoadmap((content.site as { roadmap?: Partial<RoadmapContent> }).roadmap);
  const [selectedGame, setSelectedGame] = useState<GameId>(page.defaultGame);

  const tournamentYearByKey = useMemo(() => {
    return new Map(
      (data.tournaments ?? []).map((tournament) => [
        `${tournament.game}:${normalizeValue(tournament.name.en || tournament.name.lo)}`,
        extractYear(tournament.season),
      ])
    );
  }, [data.tournaments]);

  const gameMatches = useMemo(
    () => data.matches.filter((match) => match.game === selectedGame),
    [data.matches, selectedGame]
  );

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const match of gameMatches) {
      const year = tournamentYearByKey.get(matchTournamentKey(match)) || extractYear(match.date);
      if (year) years.add(year);
    }
    // Include the seasons of tournaments that have no logged matches (older /
    // placement-only records) so the Year filter covers the full history.
    const matchKeys = new Set(gameMatches.map((m) => matchTournamentKey(m)));
    for (const t of data.tournaments ?? []) {
      if (t.game !== selectedGame) continue;
      const key = `${t.game}:${normalizeValue(t.name.en || t.name.lo)}`;
      if (matchKeys.has(key)) continue;
      const y = extractYear(t.season);
      if (y) years.add(y);
    }
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [gameMatches, tournamentYearByKey, data.tournaments, selectedGame]);

  // Default to "All Years" so the full history is visible on open. The Reveal
  // stagger below is capped so the long list still appears quickly.
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const activeYear = selectedYear || "all";

  const gameYearMatches = useMemo(() => {
    if (activeYear === "all") return gameMatches;
    return gameMatches.filter((match) => {
      const year = tournamentYearByKey.get(matchTournamentKey(match)) || extractYear(match.date);
      return year === activeYear;
    });
  }, [gameMatches, activeYear, tournamentYearByKey]);

  // Tournaments available for the current game + year (most recent first) — the
  // options for the Tournament filter. Reflects game/year so the list stays
  // relevant; the result filter doesn't narrow it.
  // Grouped by Liquipedia tier (S → A → B → C, then untiered last). Within a
  // tier, most recent first. Rendered as <optgroup>s so the dropdown shows
  // which tier each tournament sits in.
  const tournamentOptionGroups = useMemo(() => {
    const label = new Map<string, Bilingual>();
    const latest = new Map<string, string>();
    for (const m of gameYearMatches) {
      const key = baseTournamentKey(m.game, m.tournament);
      if (!label.has(key)) {
        label.set(key, {
          en: baseName(m.tournament.en),
          lo: baseName(m.tournament.lo) || baseName(m.tournament.en),
        });
      }
      const d = m.date ?? "";
      if (d > (latest.get(key) ?? "")) latest.set(key, d);
    }
    const opts = [...label.entries()].map(([key, l]) => ({
      key,
      label: l,
      latest: latest.get(key) ?? "",
      tier: tournamentTier(l.en),
    }));
    const order: (Tier | null)[] = ["S", "A", "B", "C", null];
    return order
      .map((tier) => ({
        tier,
        options: opts
          .filter((o) => o.tier === tier)
          .sort((a, b) => b.latest.localeCompare(a.latest)),
      }))
      .filter((g) => g.options.length > 0);
  }, [gameYearMatches]);

  const tournamentCount = tournamentOptionGroups.reduce((n, g) => n + g.options.length, 0);

  const stats = useMemo(() => {
    const count = (r: MatchResult) => gameYearMatches.filter((m) => m.result === r).length;
    const wins = count("win");
    const losses = count("loss");
    const total = wins + losses || 1;
    return { wins, losses, winrate: Math.round((wins / total) * 100) };
  }, [gameYearMatches]);

  const filtered = useMemo(() => {
    return gameYearMatches.filter((m) => {
      switch (resultFilter) {
        case "wins":
          return m.result === "win";
        case "losses":
          return m.result === "loss";
        default:
          return true;
      }
    });
  }, [resultFilter, gameYearMatches]);

  // Tournaments with no logged matches (older / placement-only records) so they
  // still appear on the timeline. Only when not filtering by W/L (they carry no
  // result) and matching the active year.
  const placementOnlyTournaments = useMemo(() => {
    if (resultFilter !== "all") return [];
    const matchKeys = new Set(data.matches.map((m) => matchTournamentKey(m)));
    return (data.tournaments ?? []).filter((t) => {
      const key = `${t.game}:${normalizeValue(t.name.en || t.name.lo)}`;
      if (matchKeys.has(key)) return false;
      return activeYear === "all" || extractYear(t.season) === activeYear;
    });
  }, [data.matches, data.tournaments, resultFilter, activeYear]);

  const tournamentGroups = useMemo(
    () => groupMatchesByTournament(filtered, data.tournaments ?? [], page.unknownTournament, sortOrder, placementOnlyTournaments),
    [filtered, data.tournaments, page.unknownTournament, sortOrder, placementOnlyTournaments]
  );
  const groupsByGame = useMemo(() => {
    const q = normalizeValue(search);
    const groups = tournamentGroups
      .filter(
        (group) =>
          group.game === selectedGame &&
          (selectedTournament === "all" ||
            baseTournamentKey(group.game, group.name) === selectedTournament)
      )
      .map((group): TournamentMatchGroup | null => {
        if (!q) return group;
        const nameMatches =
          normalizeValue(group.name.en || group.name.lo).includes(q) ||
          normalizeValue(group.name.lo || "").includes(q);
        // Tournament search → show the whole tournament (all opponents).
        if (nameMatches) return group;
        // Team search → keep only the matches against the searched opponent, so
        // other teams' matches don't show. The card otherwise stays a full
        // tournament view (placement / prize / VODs).
        const teamMatches = group.matches.filter((m) => normalizeValue(m.opponent).includes(q));
        if (teamMatches.length === 0) return null;
        const dates = teamMatches.map((m) => m.date ?? "").filter(Boolean);
        return {
          ...group,
          matches: teamMatches,
          latestDate: dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : group.latestDate,
          earliestDate: dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : group.earliestDate,
        };
      })
      .filter((group): group is TournamentMatchGroup => group !== null);
    return [{ game: selectedGame, groups }];
  }, [selectedGame, selectedTournament, tournamentGroups, search]);

  const searchActive = normalizeValue(search).length > 0;

  return (
    <>
      <PageHeader
        title={pick(page.title)}
        subtitle={pick(page.intro)}
      />

      <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-3 py-12 sm:px-4 md:px-6 md:py-16">
        <AuroraHalos />
        <Reveal>
          <div className="glass glass-sheen max-w-full overflow-hidden p-3 shadow-elev-2 sm:p-4 md:p-6">
            <button
              type="button"
              onClick={() => setRoadmapOpen(true)}
              className="group mb-4 flex w-full min-w-0 items-center justify-center overflow-hidden border border-amethyst/40 bg-gradient-to-r from-amethyst/[0.13] via-crypt/50 to-void px-3 py-3 text-center transition-all duration-300 hover:border-amethyst/75 hover:from-amethyst/22 hover:shadow-[0_0_28px_rgba(168,85,247,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:mb-5 md:px-5 md:py-4"
            >
              <span className="block min-w-0 break-words font-display text-base font-extrabold uppercase tracking-tight text-soul md:text-xl">
                {pick(roadmap.buttonLabel)}
              </span>
            </button>

            <div>
              <StatsStrip {...stats} page={page} />
            </div>

            {/* search — jump straight to a tournament or an opponent team by name */}
            <label className="relative mt-5 block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={pick({ en: "Search tournament or team…", lo: "ຄົ້ນຫາລາຍການ ຫຼື ທີມ…" })}
                className="h-12 w-full min-w-0 border border-edge bg-void/70 pl-10 pr-11 font-mono text-sm text-soul outline-none transition-colors placeholder:text-ash-dim hover:border-edge-bright focus:border-amethyst focus:shadow-[0_0_16px_rgba(168,85,247,0.28)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center border border-edge bg-void/60 text-ash transition-colors hover:border-amethyst hover:text-glow"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </label>

            {/* filters — each with a visible label so the control is obvious.
                Row 1: scope (Game / Year / Result / Sort); Tournament gets its
                own full-width row so long names stay readable. */}
            <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <select
                  value={selectedGame}
                  onChange={(event) => {
                    setSelectedGame(event.target.value as GameId);
                    setSelectedYear("");
                    setSelectedTournament("all");
                    setResultFilter("all");
                  }}
                  className={selectClass}
                >
                  {GAME_FILTERS.map((id) => (
                    <option key={id} value={id}>
                      {pick(page.filters[id])}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={activeYear}
                  onChange={(event) => {
                    setSelectedYear(event.target.value);
                    setSelectedTournament("all");
                  }}
                  className={selectClass}
                >
                  <option value="all">{pick(page.allYears)}</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
                  className={selectClass}
                >
                  {RESULT_FILTERS.map((id) => (
                    <option key={id} value={id}>
                      {id === "all" ? pick({ en: "All Result", lo: "ຜົນທັງໝົດ" }) : pick(page.filters[id])}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                  className={selectClass}
                >
                  {([
                    { id: "newest", label: pick(page.sortNewest) },
                    { id: "oldest", label: pick(page.sortOldest) },
                    { id: "prize-high", label: pick(page.sortPrizeHigh) },
                    { id: "prize-low", label: pick(page.sortPrizeLow) },
                  ] as const).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Tournament — full width; lists every tournament in the current
                game + year so you can jump straight to one. */}
            <div className="mt-3">
              <TournamentSelect
                groups={tournamentOptionGroups}
                value={selectedTournament}
                onChange={setSelectedTournament}
                pick={pick}
                allLabel={pick({ en: "All Tournaments", lo: "ທຸກລາຍການ" })}
                otherLabel={pick({ en: "Other", lo: "ອື່ນໆ" })}
              />
            </div>
          </div>
        </Reveal>

        <AnimatePresence>
          {roadmapOpen && <RoadmapModal key="roadmap-modal" onClose={() => setRoadmapOpen(false)} />}
        </AnimatePresence>

        <div
          key={`${selectedGame}-${activeYear}-${resultFilter}-${sortOrder}-${selectedTournament}`}
          className="mt-8 grid gap-6"
        >
          {groupsByGame.some((section) => section.groups.length > 0) ? (
            // No outer Reveal here: it would wrap the whole (very tall) All-Years
            // section, and the IntersectionObserver's 0.15 threshold can never be
            // met on a section taller than ~6× the viewport — so nothing showed on
            // mobile. Each tournament group reveals itself instead.
            groupsByGame.map(({ game, groups }) => (
              <GameTournamentSection key={game} game={game} groups={groups} page={page} forceOpen={searchActive} />
            ))
          ) : (
            <p className="border border-edge bg-crypt p-8 text-center font-mono text-sm text-ash">
              {pick(page.noResults)}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
