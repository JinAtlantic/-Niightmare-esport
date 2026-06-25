"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import OpponentLogo from "@/components/cards/OpponentLogo";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import RoadmapModal from "@/components/sections/RoadmapModal";
import { PlayIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import { tournamentTier, type Tier } from "@/lib/tiers";
import { resolveRoadmap, type RoadmapContent } from "@/lib/roadmap";
import { useContent } from "@/components/context/ContentContext";
import matchesSeed from "@/data/matches.json";
import type { Bilingual, GameId, Match, MatchResult, Tournament } from "@/lib/types";

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

const MATCH_LOGO_SIZE = 64;
const MOBILE_MATCH_LOGO_SIZE = 72;
const GAME_LABEL: Record<GameId, string> = {
  mlbb: "MOBILE LEGENDS: BANG BANG",
  efootball: "eFOOTBALL",
};

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

  if (multiplier > 1 && /^\d+[.,]\d+$/.test(numeric)) {
    return Number(numeric.replace(",", ".")) * multiplier;
  }

  return Number(numeric.replace(/\D/g, "")) * multiplier || 0;
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
  sortOrder: SortOrder
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
function VodButton({ href, page }: { href: string | null; page: MatchesPageCopy }) {
  const { pick } = useLanguage();
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
        {pick(page.watchVod)}
      </a>
    );
  }

  return (
    <span
      aria-disabled="true"
      className={`${base} cursor-not-allowed border-edge/60 bg-void/20 text-ash-dim`}
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
  const accent = RESULT_ACCENT[match.result];
  const round = match.round && pick(match.round).trim() ? pick(match.round) : null;
  const tournamentName = pick(match.tournament).trim() || pick(page.unknownTournament);
  const opponentName = match.opponent.trim() || pick(page.unknownOpponent);
  // Blade colour by the tournament's tier (violet when it isn't a main family).
  const blade = TIER_BLADE[tournamentTier(match.tournament.en || match.tournament.lo) ?? "default"];

  return (
    <article className="hover-glow group relative overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(28,20,40,0.92),rgba(22,16,31,0.76)_46%,rgba(11,7,16,0.96))] p-5 pl-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6 md:pl-7">
      {/* left accent blade — colored by the tournament's tier */}
      <span aria-hidden className={`absolute left-0 top-0 h-full w-1 ${blade}`} />
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-spectre/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span aria-hidden className="absolute -right-20 -top-20 h-44 w-44 bg-amethyst/10 blur-3xl" />

      {/* header: date | round */}
      <div className="relative flex items-center justify-between gap-3">
        <time className="whitespace-nowrap border border-edge bg-void/35 px-2.5 py-1 font-mono text-xs tracking-wide text-ash" dateTime={match.date}>
          {formatDate(match.date, lang)}
        </time>
        {round && (
          <span className="shrink-0 border border-edge-bright bg-void/40 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre">
            {round}
          </span>
        )}
      </div>

      {showTournament && (
        <p className="mt-3 text-center font-display text-lg font-bold uppercase tracking-[0.04em] text-soul md:text-xl">
          {tournamentName}
        </p>
      )}

      <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-y border-edge/70 bg-void/35 py-4 md:hidden">
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

        <div className="flex min-w-[74px] flex-col items-center border-x border-edge/70 px-2">
          <span className={`keep-latin font-display text-4xl font-bold leading-none tracking-[0.08em] ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`mt-2 border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${accent.badge}`}
          >
            {pick(page.results[match.result])}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <OpponentLogo src={match.opponentLogo} name={opponentName} abbr={match.opponentAbbr} size={MOBILE_MATCH_LOGO_SIZE} />
          <span className="keep-latin max-w-[104px] break-words font-display text-xs font-bold uppercase leading-tight text-soul">
            {opponentName}
          </span>
        </div>
      </div>

      {/* desktop head-to-head: names stay horizontal with logos on the outer edges. */}
      <div className="relative mt-4 hidden border-y border-edge/70 bg-void/30 px-4 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-5">
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-edge-bright to-transparent"
        />
        {/* NIIGHTMARE side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-start md:gap-3">
          <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={MATCH_LOGO_SIZE} />
          <span className="keep-latin truncate font-display text-base font-bold uppercase leading-tight text-soul md:text-2xl">
            NIIGHTMARE
          </span>
        </div>

        {/* score + result */}
        <div className="relative z-[1] flex min-w-[132px] flex-col items-center border border-edge-bright bg-crypt/80 px-4 py-3 shadow-[0_0_24px_rgba(168,85,247,0.12)]">
          <span className={`keep-latin font-display text-3xl font-bold tracking-[0.1em] md:text-4xl ${accent.score}`}>
            {match.score}
          </span>
          <span
            className={`mt-1 border px-2 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] md:text-[10px] ${accent.badge}`}
          >
            {pick(page.results[match.result])}
          </span>
        </div>

        {/* opponent side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-end md:gap-3">
          <span className="keep-latin truncate text-center font-display text-base font-bold uppercase leading-tight text-soul md:text-right md:text-2xl">
            {opponentName}
          </span>
          <OpponentLogo src={match.opponentLogo} name={opponentName} abbr={match.opponentAbbr} size={MATCH_LOGO_SIZE} />
        </div>
      </div>

      {/* VOD — always present */}
      <div className="mx-auto mt-4 max-w-xs">
        <VodButton href={match.vod} page={page} />
      </div>
    </article>
  );
}

function TournamentRecordGroup({
  group,
  page,
}: {
  group: TournamentMatchGroup;
  page: MatchesPageCopy;
}) {
  const { pick, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const tournament = group.tournament;
  const matchCount = group.matches.length;
  const tier = tournamentTier(group.name.en || group.name.lo);
  const wins = group.matches.filter((match) => match.result === "win").length;
  const losses = group.matches.filter((match) => match.result === "loss").length;
  const latestDate = group.latestDate ? formatDate(group.latestDate, lang) : "";

  return (
    <section
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
      className="clip-esports max-w-full overflow-hidden border border-edge bg-gradient-to-br from-crypt2/80 via-crypt/55 to-void shadow-[0_0_28px_rgba(168,85,247,0.1)]"
    >
      <div className="group relative overflow-hidden border-b border-edge bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(22,16,31,0.78)_34%,rgba(11,7,16,0.98))] px-3 py-4 transition-colors hover:bg-amethyst/[0.04] sm:px-4 md:px-6 md:py-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "View"} matches for ${pick(group.name)}`}
          className="absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        />
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/80 to-transparent"
        />
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-px w-2/3 bg-gradient-to-r from-amethyst/70 via-glow/30 to-transparent"
        />
        <span
          aria-hidden
          className="absolute -right-6 -top-20 h-36 w-36 bg-amethyst/10 blur-3xl md:-right-16 md:h-44 md:w-44"
        />
        <div className="pointer-events-none relative grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {tier && (
                <span className={`inline-flex font-mono text-[9px] font-bold uppercase tracking-[0.14em] md:text-[10px] ${TIER_TAG[tier]}`}>
                  {tier}-Tier
                </span>
              )}
              <span className="inline-flex border border-amethyst/45 bg-amethyst/10 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-glow md:px-3 md:py-1.5 md:text-[10px]">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
              <span className="inline-flex border border-edge-bright bg-void/55 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-spectre md:px-3 md:py-1.5 md:text-[10px]">
                {open ? "hide matches" : "view matches"}
              </span>
              {latestDate && (
                <span className="inline-flex border border-edge bg-void/45 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ash md:px-3 md:py-1.5 md:text-[10px]">
                  {latestDate}
                </span>
              )}
            </div>
            <h2 className="mt-3 max-w-full break-words font-display text-xl font-bold uppercase leading-tight tracking-[0.03em] text-soul [text-shadow:0_0_28px_rgba(199,125,255,0.22)] md:text-3xl">
              {pick(group.name)}
            </h2>
            <div className="mt-3 grid max-w-md grid-cols-3 border border-edge bg-void/35">
              <div className="border-r border-edge px-2 py-1.5 md:px-3 md:py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ash-dim">{pick(page.stats.wins)}</p>
                <p className="mt-0.5 font-display text-base font-bold text-win md:text-lg">{wins}</p>
              </div>
              <div className="border-r border-edge px-2 py-1.5 md:px-3 md:py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ash-dim">{pick(page.stats.losses)}</p>
                <p className="mt-0.5 font-display text-base font-bold text-loss md:text-lg">{losses}</p>
              </div>
              <div className="px-2 py-1.5 md:px-3 md:py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ash-dim">{pick(page.stats.winrate)}</p>
                <p className="mt-0.5 font-display text-base font-bold text-glow md:text-lg">
                  {Math.round((wins / Math.max(1, wins + losses)) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {tournament && (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="border border-edge bg-void/55 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:px-3 md:py-2.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ash-dim">
                  {pick(page.tournamentLabels.placement)}
                </p>
                <p className="mt-0.5 break-words font-display text-sm font-bold uppercase tracking-[0.06em] text-glow">
                  {pick(tournament.placement)}
                </p>
              </div>
              {tournament.prize && tournament.prize.trim() && (
                <div className="border border-edge bg-void/55 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:px-3 md:py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ash-dim">
                    {pick(page.tournamentLabels.prize)}
                  </p>
                  <p className="keep-latin mt-0.5 break-words font-display text-sm font-bold uppercase tracking-[0.06em] text-spectre">
                    {tournament.prize}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="relative flex flex-col gap-2 bg-void/35 p-2 md:gap-3 md:p-4">
          <span
            aria-hidden
            className="absolute bottom-8 left-8 top-8 hidden w-px bg-gradient-to-b from-amethyst/70 via-edge-bright to-transparent md:block"
          />
          {group.matches.map((match, i) => (
            <Reveal key={match.id} delay={Math.min(i, 6) * 45}>
              <div className="grid gap-3 md:grid-cols-[44px_1fr] md:items-stretch">
                <div className="hidden md:grid md:place-items-center">
                  <span className="relative z-[1] grid h-9 w-9 place-items-center border border-amethyst/60 bg-void font-mono text-[11px] font-bold text-glow shadow-[0_0_16px_rgba(168,85,247,0.35)]">
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
}: {
  game: GameId;
  groups: TournamentMatchGroup[];
  page: MatchesPageCopy;
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
      <div className="mb-4 flex flex-col gap-2 border border-edge bg-crypt/55 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amethyst">
            Game Division
          </p>
          <h2 className="keep-latin mt-2 font-display text-3xl font-bold uppercase leading-none tracking-[0.04em] text-soul [text-shadow:0_0_24px_rgba(199,125,255,0.28)] md:text-5xl">
            {GAME_LABEL[game]}
          </h2>
        </div>
        <p className="border border-edge bg-void/45 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-spectre">
          {groups.length} {groups.length === 1 ? "Tournament" : "Tournaments"}
        </p>
      </div>
      <div className="grid gap-4">
        {groups.map((group, i) => (
          // Cap the stagger so deep groups never wait on a long index-based
          // delay (All Years can have 20+ groups).
          <Reveal key={group.key} delay={Math.min(i, 4) * 55}>
            <TournamentRecordGroup group={group} page={page} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const selectClass =
  "h-12 w-full min-w-0 border border-edge bg-void/70 px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-soul outline-none transition-colors hover:border-edge-bright focus:border-amethyst focus:shadow-[0_0_16px_rgba(168,85,247,0.28)]";

const filterLabelClass =
  "mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash-dim";

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
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [gameMatches, tournamentYearByKey]);

  // Default to "All Years" so the full history is visible on open. The Reveal
  // stagger below is capped so the long list still appears quickly.
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
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

  const tournamentGroups = useMemo(
    () => groupMatchesByTournament(filtered, data.tournaments ?? [], page.unknownTournament, sortOrder),
    [filtered, data.tournaments, page.unknownTournament, sortOrder]
  );
  const groupsByGame = useMemo(() => {
    const groups = tournamentGroups.filter(
      (group) =>
        group.game === selectedGame &&
        (selectedTournament === "all" ||
          baseTournamentKey(group.game, group.name) === selectedTournament)
    );
    return [{ game: selectedGame, groups }];
  }, [selectedGame, selectedTournament, tournamentGroups]);

  return (
    <>
      <PageHeader
        title={pick(page.title)}
        subtitle={pick(page.intro)}
      />

      <section className="mx-auto max-w-7xl overflow-hidden px-3 py-12 sm:px-4 md:px-6 md:py-16">
        <Reveal>
          <div className="max-w-full overflow-hidden border border-edge bg-crypt/35 p-3 shadow-glow-soft sm:p-4 md:p-6">
            <button
              type="button"
              onClick={() => setRoadmapOpen(true)}
              className="group relative mb-4 flex w-full min-w-0 items-center justify-center overflow-hidden border border-amethyst/40 bg-gradient-to-r from-amethyst/[0.13] via-crypt/50 to-void px-3 py-3 text-center transition-all duration-300 hover:border-amethyst/75 hover:from-amethyst/22 hover:shadow-[0_0_28px_rgba(168,85,247,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:mb-5 md:px-5 md:py-4"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#34D399_0_25%,#38BDF8_25%_50%,#A855F7_50%_75%,#F5C451_75%_100%)] shadow-[0_0_16px_rgba(168,85,247,0.42)]"
              />
              <span className="block min-w-0 break-words font-display text-base font-extrabold uppercase tracking-tight text-soul md:text-xl">
                {pick(roadmap.buttonLabel)}
              </span>
            </button>

            <div>
              <StatsStrip {...stats} page={page} />
            </div>
            {/* filters — each with a visible label so the control is obvious.
                Row 1: scope (Game / Year / Result / Sort); Tournament gets its
                own full-width row so long names stay readable. */}
            <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className={filterLabelClass}>{pick({ en: "Game", lo: "ເກມ" })}</span>
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
                <span className={filterLabelClass}>{pick({ en: "Year", lo: "ປີ" })}</span>
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
                <span className={filterLabelClass}>{pick({ en: "Result", lo: "ຜົນ" })}</span>
                <select
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
                  className={selectClass}
                >
                  {RESULT_FILTERS.map((id) => (
                    <option key={id} value={id}>
                      {pick(page.filters[id])}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={filterLabelClass}>{pick(page.sortLabel)}</span>
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
            <label className="mt-3 block">
              <span className={filterLabelClass}>
                {pick({ en: "Tournament", lo: "ລາຍການແຂ່ງ" })}
                <span className="ml-1.5 text-ash-dim">({tournamentCount})</span>
              </span>
              <select
                value={selectedTournament}
                onChange={(event) => setSelectedTournament(event.target.value)}
                className={selectClass}
              >
                <option value="all">{pick({ en: "All Tournaments", lo: "ທຸກລາຍການ" })}</option>
                {tournamentOptionGroups.map((g) => (
                  <optgroup
                    key={g.tier ?? "other"}
                    label={g.tier ? `${g.tier}-Tier` : pick({ en: "Other", lo: "ອື່ນໆ" })}
                  >
                    {g.options.map((t) => (
                      <option key={t.key} value={t.key}>
                        {pick(t.label)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
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
              <GameTournamentSection key={game} game={game} groups={groups} page={page} />
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
