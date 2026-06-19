"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import OpponentLogo from "@/components/cards/OpponentLogo";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import { PlayIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import { useContent } from "@/components/context/ContentContext";
import matchesSeed from "@/data/matches.json";
import type { Bilingual, GameId, Match, MatchResult, Tournament } from "@/lib/types";

type Filter = "all" | "mlbb" | "efootball" | "wins" | "losses";
type ResultFilter = "all" | "wins" | "losses";
type SortOrder = "newest" | "oldest";

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

// Left accent blade colored by game type — neon violet for MLBB (MOBA),
// neon cyan for eFootball (sporty contrast). The result is still conveyed by
// the score color and the result badge.
const GAME_BLADE: Record<GameId, string> = {
  mlbb: "bg-amethyst shadow-[0_0_10px_rgba(168,85,247,0.85)]",
  efootball: "bg-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.85)]",
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

function tournamentKey(match: Match) {
  const name = normalizeValue(match.tournament.en || match.tournament.lo);
  return `${match.game}:${name || "unknown"}`;
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
    sortOrder === "newest"
      ? (b.date ?? "").localeCompare(a.date ?? "")
      : (a.date ?? "").localeCompare(b.date ?? "");
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
      const dateDelta = sortOrder === "newest"
        ? (b.latestDate ?? "").localeCompare(a.latestDate ?? "")
        : (a.earliestDate ?? "").localeCompare(b.earliestDate ?? "");
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
  const tiles = [
    { value: wins, suffix: "", label: pick(page.stats.wins), tone: "text-win" },
    { value: losses, suffix: "", label: pick(page.stats.losses), tone: "text-loss" },
    { value: winrate, suffix: "%", label: pick(page.stats.winrate), tone: "text-glow" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      {showTournament && (
        <p className="mt-3 text-center font-display text-lg font-bold uppercase tracking-[0.04em] text-soul md:text-xl">
          {tournamentName}
        </p>
      )}

      <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-y border-edge/70 bg-void/25 py-4 md:hidden">
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
            {pick(page.results[match.result])}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <OpponentLogo src={match.opponentLogo} name={opponentName} size={MOBILE_MATCH_LOGO_SIZE} />
          <span className="keep-latin max-w-[104px] break-words font-display text-xs font-bold uppercase leading-tight text-soul">
            {opponentName}
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
            {pick(page.results[match.result])}
          </span>
        </div>

        {/* opponent side */}
        <div className="flex min-w-0 items-center justify-center gap-2.5 md:justify-end md:gap-3">
          <span className="keep-latin truncate text-center font-display text-base font-bold uppercase leading-tight text-soul md:text-right md:text-2xl">
            {opponentName}
          </span>
          <OpponentLogo src={match.opponentLogo} name={opponentName} size={MATCH_LOGO_SIZE} />
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
  const { pick } = useLanguage();
  const [open, setOpen] = useState(false);
  const tournament = group.tournament;
  const matchCount = group.matches.length;

  return (
    <section className="clip-esports overflow-hidden border border-edge bg-crypt/45">
      <div className="group relative overflow-hidden border-b border-edge bg-gradient-to-br from-crypt2/70 via-crypt/55 to-void px-5 py-5 transition-colors hover:bg-amethyst/[0.04] md:px-6">
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
          className="absolute -right-16 -top-20 h-44 w-44 bg-amethyst/10 blur-3xl"
        />
        <div className="pointer-events-none relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex border border-edge-bright bg-void/45 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-spectre">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
              <span className="inline-flex border border-amethyst/45 bg-amethyst/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-glow">
                {open ? "hide matches" : "view matches"}
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold uppercase leading-tight tracking-[0.04em] text-soul md:text-3xl">
              {pick(group.name)}
            </h2>
          </div>

          {tournament && (
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
              <div className="border border-edge bg-void/45 px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(page.tournamentLabels.placement)}
                </p>
                <p className="mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-glow">
                  {pick(tournament.placement)}
                </p>
              </div>
              <div className="border border-edge bg-void/45 px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(page.tournamentLabels.season)}
                </p>
                <p className="keep-latin mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-spectre">
                  {tournament.season}
                </p>
              </div>
              {tournament.prize && tournament.prize.trim() && (
                <div className="border border-edge bg-void/45 px-3 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-dim">
                    {pick(page.tournamentLabels.prize)}
                  </p>
                  <p className="keep-latin mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-spectre">
                    {tournament.prize}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="relative flex flex-col gap-3 p-3 md:p-4">
          <span
            aria-hidden
            className="absolute bottom-8 left-8 top-8 hidden w-px bg-gradient-to-b from-amethyst/70 via-edge-bright to-transparent md:block"
          />
          {group.matches.map((match, i) => (
            <Reveal key={match.id} delay={i * 55}>
              <div className="grid gap-3 md:grid-cols-[44px_1fr] md:items-stretch">
                <div className="hidden md:grid md:place-items-center">
                  <span className="relative z-[1] grid h-9 w-9 place-items-center border border-amethyst/60 bg-void font-mono text-[11px] font-bold text-glow shadow-[0_0_16px_rgba(168,85,247,0.35)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <MatchCard match={match} page={page} showTournament={false} />
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
    <section className="relative overflow-hidden border border-edge bg-void/45 p-3 shadow-[0_0_28px_rgba(168,85,247,0.12)] md:p-5">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-[2px] ${
          game === "mlbb"
            ? "bg-gradient-to-r from-transparent via-amethyst to-transparent"
            : "bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent"
        }`}
      />
      <div className="mb-4 flex flex-col gap-2 border border-edge bg-crypt/55 px-4 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amethyst">
            Game Division
          </p>
          <h2 className="keep-latin mt-2 font-display text-3xl font-bold uppercase leading-none tracking-[0.04em] text-soul [text-shadow:0_0_24px_rgba(199,125,255,0.28)] md:text-5xl">
            {GAME_LABEL[game]}
          </h2>
        </div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-spectre">
          {groups.length} {groups.length === 1 ? "Tournament" : "Tournaments"}
        </p>
      </div>
      <div className="grid gap-4">
        {groups.map((group, i) => (
          <Reveal key={group.key} delay={i * 70}>
            <TournamentRecordGroup group={group} page={page} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function MatchesClient() {
  const { pick } = useLanguage();
  const data = useContent().matches as {
    page?: Partial<MatchesPageCopy>;
    matches: Match[];
    tournaments: Tournament[];
  };
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const page = mergePageCopy(data.page);
  const [selectedGame, setSelectedGame] = useState<GameId>(page.defaultGame);

  const gameMatches = useMemo(
    () => data.matches.filter((match) => match.game === selectedGame),
    [data.matches, selectedGame]
  );

  const stats = useMemo(() => {
    const count = (r: MatchResult) => gameMatches.filter((m) => m.result === r).length;
    const wins = count("win");
    const losses = count("loss");
    const total = wins + losses || 1;
    return { wins, losses, winrate: Math.round((wins / total) * 100) };
  }, [gameMatches]);

  const filtered = useMemo(() => {
    return gameMatches.filter((m) => {
      switch (resultFilter) {
        case "wins":
          return m.result === "win";
        case "losses":
          return m.result === "loss";
        default:
          return true;
      }
    });
  }, [resultFilter, gameMatches]);

  const tournamentGroups = useMemo(
    () => groupMatchesByTournament(filtered, data.tournaments ?? [], page.unknownTournament, sortOrder),
    [filtered, data.tournaments, page.unknownTournament, sortOrder]
  );
  const groupsByGame = useMemo(
    () => [{ game: selectedGame, groups: tournamentGroups.filter((group) => group.game === selectedGame) }],
    [selectedGame, tournamentGroups]
  );

  return (
    <>
      <PageHeader
        kicker={pick(page.kicker)}
        title={pick(page.title)}
        subtitle={pick(page.intro)}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <Reveal>
          <div className="border border-edge bg-crypt/35 p-4 shadow-glow-soft md:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex min-h-[170px] flex-col justify-between border border-edge bg-void/45 p-5">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-amethyst">
                    {pick(page.recordLabel)}
                  </p>
                  <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-spectre md:text-base">
                    {pick(page.recordIntro)}
                  </p>
                </div>
                <div
                  aria-hidden
                  className="mt-8 h-[2px] w-28 -skew-x-[24deg] bg-gradient-to-r from-amethyst via-glow to-transparent shadow-[0_0_16px_rgba(168,85,247,0.55)]"
                />
              </div>
              <StatsStrip {...stats} page={page} />
            </div>
            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {GAME_FILTERS.map((id) => {
                    const active = selectedGame === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedGame(id);
                          setResultFilter("all");
                        }}
                        aria-pressed={active}
                        className={`inline-flex min-h-[46px] items-center border px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ${
                          active
                            ? "border-amethyst bg-amethyst/15 text-soul shadow-[0_0_16px_rgba(168,85,247,0.35)]"
                            : "border-edge bg-void/50 text-ash hover:border-edge-bright hover:text-soul"
                        }`}
                      >
                        {pick(page.filters[id])}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 border-l-2 border-amethyst/50 pl-3">
                  {RESULT_FILTERS.map((id) => {
                    const active = resultFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setResultFilter(id)}
                        aria-pressed={active}
                        className={`inline-flex min-h-[38px] items-center border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                          active
                            ? "border-amethyst bg-amethyst/15 text-soul"
                            : "border-edge bg-crypt text-ash hover:border-edge-bright hover:text-soul"
                        }`}
                      >
                        {pick(page.filters[id])}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border border-edge bg-void/45 p-2">
                <span className="px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">
                  {pick(page.sortLabel)}
                </span>
                {([
                  { id: "newest", label: pick(page.sortNewest) },
                  { id: "oldest", label: pick(page.sortOldest) },
                ] as const).map((option) => {
                  const active = sortOrder === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortOrder(option.id)}
                      aria-pressed={active}
                      className={`inline-flex min-h-[38px] items-center border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
                        active
                          ? "border-amethyst bg-amethyst/15 text-soul"
                          : "border-edge bg-crypt text-ash hover:border-edge-bright hover:text-soul"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        <div key={`${selectedGame}-${resultFilter}-${sortOrder}`} className="mt-8 grid gap-6">
          {groupsByGame.some((section) => section.groups.length > 0) ? (
            groupsByGame.map(({ game, groups }, i) => (
              <Reveal key={game} delay={i * 90}>
                <GameTournamentSection game={game} groups={groups} page={page} />
              </Reveal>
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
