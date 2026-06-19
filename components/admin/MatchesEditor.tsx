"use client";

import React, { useState } from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  TextField,
  SelectField,
  BilingualField,
  ImageField,
} from "@/components/admin/ui";
import OpponentLogo from "@/components/cards/OpponentLogo";
import matchesSeed from "@/data/matches.json";
import type { Bilingual, Match, MatchResult, Tournament } from "@/lib/types";

type Filter = "all" | "mlbb" | "efootball" | "wins" | "losses";
type GameFilter = "all" | Match["game"];

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
  defaultGame: Match["game"];
  filters: Record<Filter, Bilingual>;
  stats: Record<"wins" | "draws" | "losses" | "winrate", Bilingual>;
  results: Record<MatchResult, Bilingual>;
  tournamentLabels: Record<"placement" | "prize" | "season", Bilingual>;
}

interface MatchesFile {
  page?: MatchesPageCopy;
  matches: Match[];
  tournaments: Tournament[];
}

type MatchRef = { match: Match; index: number };
type YearFilter = "all" | string;

const pageSeed = matchesSeed.page as MatchesPageCopy;
const filterIds: Filter[] = ["all", "mlbb", "efootball", "wins", "losses"];
const statIds = ["wins", "losses", "winrate"] as const;
const resultIds: MatchResult[] = ["win", "loss"];
const tournamentLabelIds = ["placement", "prize", "season"] as const;

function pageCopy(page?: Partial<MatchesPageCopy>): MatchesPageCopy {
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

const GAME_OPTS = [
  { value: "mlbb", label: "MLBB" },
  { value: "efootball", label: "eFootball" },
];

const RESULT_OPTS = [
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
];

const ROUND_PRESETS: { id: string; label: string; value: Bilingual }[] = [
  { id: "wild-card", label: "Wild Card", value: { en: "Wild Card", lo: "Wild Card" } },
  { id: "group-stage", label: "Group Stage", value: { en: "Group Stage", lo: "Group Stage" } },
  { id: "quarter-final", label: "Quarter-Final", value: { en: "Quarter-Final", lo: "Quarter-Final" } },
  { id: "semi-final", label: "Semi-Final", value: { en: "Semi-Final", lo: "Semi-Final" } },
  { id: "final", label: "Final", value: { en: "Final", lo: "Final" } },
  { id: "grand-final", label: "Grand Final", value: { en: "Grand Final", lo: "Grand Final" } },
];

const emptyText: Bilingual = { en: "", lo: "" };
const compactInputClass =
  "h-8 w-full border border-edge bg-void/70 px-2 font-mono text-xs text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst";
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function norm(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function extractYear(value?: string | null) {
  const match = value?.match(/\b(20\d{2}|19\d{2})\b/);
  return match?.[1] ?? "";
}

function sameTournamentName(a?: Bilingual, b?: Bilingual) {
  const aEn = norm(a?.en);
  const aLo = norm(a?.lo);
  const bEn = norm(b?.en);
  const bLo = norm(b?.lo);
  return Boolean((aEn && bEn && aEn === bEn) || (aLo && bLo && aLo === bLo));
}

function matchBelongsToTournament(match: Match, tournament: Tournament) {
  return match.game === tournament.game && sameTournamentName(match.tournament, tournament.name);
}

function groupYear(tournament: Tournament, items: MatchRef[]) {
  return extractYear(tournament.season) || extractYear(items[0]?.match.date);
}

export default function MatchesEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<MatchesFile>("matches");
  const [view, setView] = useState<"records" | "page">("records");
  const [openTournamentId, setOpenTournamentId] = useState<string | null>(null);
  const [unassignedOpen, setUnassignedOpen] = useState(false);
  const [recordQuery, setRecordQuery] = useState("");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  if (loading) return <p className="font-mono text-sm text-ash">Loading...</p>;
  if (!data) return <p className="font-mono text-sm text-loss">Could not load matches data.</p>;

  const { matches, tournaments } = data;
  const page = pageCopy(data.page);
  const setPage = (next: MatchesPageCopy) => setData({ ...data, page: next });
  const patchPage = (patch: Partial<MatchesPageCopy>) => setPage({ ...page, ...patch });

  const setMatches = (next: Match[]) => setData({ ...data, matches: next });
  const setTournaments = (next: Tournament[]) => setData({ ...data, tournaments: next });
  const openMatchesPreview = () => {
    window.open(`/matches?adminPreview=${Date.now()}`, "_blank", "noopener,noreferrer");
  };
  const saveAndPreview = async () => {
    const saved = await save();
    if (saved) openMatchesPreview();
  };

  const patchMatch = (i: number, patch: Partial<Match>) =>
    setMatches(matches.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const patchTournamentAndLinkedMatches = (i: number, patch: Partial<Tournament>) => {
    const current = tournaments[i];
    if (!current) return;
    const nextTournament = { ...current, ...patch };
    setData({
      ...data,
      tournaments: tournaments.map((t, idx) => (idx === i ? nextTournament : t)),
      matches: matches.map((match) =>
        matchBelongsToTournament(match, current)
          ? { ...match, game: nextTournament.game, tournament: nextTournament.name }
          : match,
      ),
    });
  };

  const addMatch = () =>
    setMatches([
      {
        id: uid("m"),
        date: new Date().toISOString().slice(0, 10),
        game: "mlbb",
        tournament: { ...emptyText },
        round: { ...emptyText },
        opponent: "",
        score: "0-0",
        result: "win",
        vod: null,
      },
      ...matches,
    ]);

  const addMatchForTournament = (tournament: Tournament) => {
    const nextMatch: Match = {
      id: uid("m"),
      date: new Date().toISOString().slice(0, 10),
      game: tournament.game,
      tournament: { ...tournament.name },
      round: { ...emptyText },
      opponent: "",
      score: "0-0",
      result: "win",
      vod: null,
    };
    setMatches([nextMatch, ...matches]);
    setOpenTournamentId(tournament.id);
  };

  const addTournament = () => {
    const nextTournament: Tournament = {
      id: uid("t"),
      name: { en: "New Tournament", lo: "New Tournament" },
      game: "mlbb",
      placement: { ...emptyText },
      prize: "-",
      season: String(new Date().getFullYear()),
    };
    setTournaments([nextTournament, ...tournaments]);
    setOpenTournamentId(nextTournament.id);
  };

  const duplicateMatch = (i: number) => {
    const current = matches[i];
    if (!current) return;
    const clone: Match = {
      ...current,
      id: uid("m"),
      tournament: { ...current.tournament },
      round: current.round ? { ...current.round } : undefined,
    };
    const next = matches.slice();
    next.splice(i + 1, 0, clone);
    setMatches(next);
  };

  const assignMatchToTournament = (matchIndex: number, tournamentId: string) => {
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return;
    patchMatch(matchIndex, { game: target.game, tournament: { ...target.name } });
    setOpenTournamentId(target.id);
  };

  const patchRound = (matchIndex: number, round: Partial<Bilingual>) => {
    const current = matches[matchIndex]?.round ?? emptyText;
    patchMatch(matchIndex, { round: { ...current, ...round } });
  };

  const matchRefs: MatchRef[] = matches.map((match, index) => ({ match, index }));
  const assignedIndexes = new Set<number>();
  const tournamentGroups = tournaments.map((tournament) => {
    const items = matchRefs.filter((ref) => {
      if (assignedIndexes.has(ref.index) || !matchBelongsToTournament(ref.match, tournament)) return false;
      assignedIndexes.add(ref.index);
      return true;
    });
    return { tournament, items };
  });
  const unassignedMatches = matchRefs.filter((ref) => !assignedIndexes.has(ref.index));
  const query = norm(recordQuery);
  const tournamentOptions = tournaments.map((t) => ({
    value: t.id,
    label: `${t.game === "mlbb" ? "MLBB" : "eFootball"} / ${t.name.en || t.name.lo || "Untitled tournament"}`,
  }));
  const yearOptions = [
    ...new Set([
      ...tournamentGroups.map(({ tournament, items }) => groupYear(tournament, items)).filter(Boolean),
      ...unassignedMatches.map(({ match }) => extractYear(match.date)).filter(Boolean),
    ]),
  ].sort((a, b) => b.localeCompare(a));
  const filteredTournamentGroups = tournamentGroups.filter(({ tournament, items }) => {
    const matchesGame = gameFilter === "all" || tournament.game === gameFilter;
    const matchesYear = yearFilter === "all" || groupYear(tournament, items) === yearFilter;
    const matchesQuery =
      !query ||
      [
        tournament.name.en,
        tournament.name.lo,
        tournament.season,
        tournament.placement.en,
        tournament.placement.lo,
        tournament.prize,
        ...items.flatMap(({ match }) => [
          match.opponent,
          match.score,
          match.round?.en ?? "",
          match.round?.lo ?? "",
          match.tournament.en,
          match.tournament.lo,
        ]),
      ].some((value) => norm(value).includes(query));
    return matchesGame && matchesYear && matchesQuery;
  });
  const filteredUnassignedMatches = unassignedMatches.filter(({ match }) => {
    const matchesGame = gameFilter === "all" || match.game === gameFilter;
    const matchesYear = yearFilter === "all" || extractYear(match.date) === yearFilter;
    const matchesQuery =
      !query ||
      [
        match.opponent,
        match.score,
        match.tournament.en,
        match.tournament.lo,
        match.round?.en ?? "",
        match.round?.lo ?? "",
      ].some((value) => norm(value).includes(query));
    return matchesGame && matchesYear && matchesQuery;
  });

  const renderMatchEditor = (ref: MatchRef, options?: { compact?: boolean; showTournament?: boolean }) => {
    const { match: m, index: i } = ref;
    const compact = options?.compact ?? false;
    const showTournament = options?.showTournament ?? false;

    return (
      <div key={m.id} className="border border-edge bg-void/45 p-2 md:p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={24} />
            <span className="truncate font-mono text-xs text-ash">
              NM <span className="text-ash-dim">vs</span>{" "}
              <span className="text-spectre">{m.opponent || "No opponent yet"}</span> / {m.score}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button onClick={() => setMatches(move(matches, i, -1))} className="min-h-[30px] px-2 py-1 text-[10px]">
              Up
            </Button>
            <Button onClick={() => setMatches(move(matches, i, 1))} className="min-h-[30px] px-2 py-1 text-[10px]">
              Down
            </Button>
            <Button onClick={() => duplicateMatch(i)} className="min-h-[30px] px-2 py-1 text-[10px]">
              Copy
            </Button>
            {!showTournament && (
              <Button
                onClick={() => patchMatch(i, { tournament: { ...emptyText } })}
                className="min-h-[30px] px-2 py-1 text-[10px]"
              >
                Unassign
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => setMatches(matches.filter((_, idx) => idx !== i))}
              className="min-h-[30px] px-2 py-1 text-[10px]"
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <TextField label="Date" type="date" value={m.date} onChange={(v) => patchMatch(i, { date: v })} />
          <SelectField
            label="Game"
            value={m.game}
            onChange={(v) => patchMatch(i, { game: v as Match["game"] })}
            options={GAME_OPTS}
          />
          {showTournament && (
            <div className="md:col-span-2">
              <BilingualField label="Tournament" value={m.tournament} onChange={(v) => patchMatch(i, { tournament: v })} />
            </div>
          )}
          {showTournament && tournamentOptions.length > 0 && (
            <div className="md:col-span-2">
              <SelectField
                label="Move into tournament"
                value=""
                onChange={(v) => assignMatchToTournament(i, v)}
                options={[{ value: "", label: "Select tournament..." }, ...tournamentOptions]}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <div className="mb-2 border border-edge bg-crypt/60 p-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amethyst">
                  Round presets
                </p>
                {!compact && <p className="font-mono text-[10px] text-ash-dim">Outer rounds first.</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROUND_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    onClick={() => patchMatch(i, { round: preset.value })}
                    className="min-h-[30px] px-2 py-1 text-[10px] tracking-[0.08em]"
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="danger"
                  onClick={() => patchMatch(i, { round: { ...emptyText } })}
                  className="min-h-[30px] px-2 py-1 text-[10px] tracking-[0.08em]"
                >
                  Clear
                </Button>
              </div>
            </div>
            <BilingualField label="Round / Stage" value={m.round ?? emptyText} onChange={(v) => patchMatch(i, { round: v })} />
          </div>
          <TextField
            label="Opponent"
            value={m.opponent}
            onChange={(v) => patchMatch(i, { opponent: v })}
            placeholder="Dragon Force"
          />
          <TextField label="Score" value={m.score} onChange={(v) => patchMatch(i, { score: v })} placeholder="3-1" />
          <SelectField
            label="Result"
            value={m.result}
            onChange={(v) => patchMatch(i, { result: v as Match["result"] })}
            options={RESULT_OPTS}
          />
          <TextField
            label="VOD link, optional"
            value={m.vod ?? ""}
            onChange={(v) => patchMatch(i, { vod: v.trim() ? v.trim() : null })}
            placeholder="https://youtube.com/..."
          />
          <div className="md:col-span-2">
            <ImageField
              label="Opponent logo"
              value={m.opponentLogo}
              folder="teams"
              onChange={(p) => patchMatch(i, { opponentLogo: p || undefined })}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMatchQuickRow = (ref: MatchRef) => {
    const { match: m, index: i } = ref;
    const expanded = expandedMatchId === m.id;

    return (
      <div key={m.id} className="border border-edge bg-void/35">
        <div className="hidden min-w-[820px] grid-cols-[110px_142px_minmax(160px,1fr)_72px_94px_184px] items-center gap-1.5 p-1.5 md:grid">
          <input
            type="date"
            className={compactInputClass}
            value={m.date}
            onChange={(e) => patchMatch(i, { date: e.target.value })}
          />
          <input
            className={compactInputClass}
            value={m.round?.en ?? ""}
            onChange={(e) => patchRound(i, { en: e.target.value })}
            placeholder="Round EN"
          />
          <div className="flex min-w-0 items-center gap-2">
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={24} />
            <input
              className={compactInputClass}
              value={m.opponent}
              onChange={(e) => patchMatch(i, { opponent: e.target.value })}
              placeholder="Opponent"
            />
          </div>
          <input
            className={compactInputClass}
            value={m.score}
            onChange={(e) => patchMatch(i, { score: e.target.value })}
            placeholder="0-0"
          />
          <select
            className={compactInputClass}
            value={m.result}
            onChange={(e) => patchMatch(i, { result: e.target.value as Match["result"] })}
          >
            {RESULT_OPTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <select
              className={`${compactInputClass} w-[84px]`}
              value=""
              onChange={(e) => {
                const preset = ROUND_PRESETS.find((item) => item.id === e.target.value);
                if (preset) patchMatch(i, { round: preset.value });
              }}
              aria-label="Round preset"
            >
              <option value="">Preset</option>
              {ROUND_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <Button onClick={() => setExpandedMatchId(expanded ? null : m.id)} className="min-h-[32px] px-2 py-1 text-[10px]">
              {expanded ? "Hide" : "More"}
            </Button>
            <Button onClick={() => duplicateMatch(i)} className="min-h-[32px] px-2 py-1 text-[10px]">
              Copy
            </Button>
          </div>
        </div>
        <div className="grid gap-1.5 p-2 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className={compactInputClass}
              value={m.date}
              onChange={(e) => patchMatch(i, { date: e.target.value })}
            />
            <select
              className={compactInputClass}
              value={m.result}
              onChange={(e) => patchMatch(i, { result: e.target.value as Match["result"] })}
            >
              {RESULT_OPTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <input
            className={compactInputClass}
            value={m.opponent}
            onChange={(e) => patchMatch(i, { opponent: e.target.value })}
            placeholder="Opponent"
          />
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <input
              className={compactInputClass}
              value={m.round?.en ?? ""}
              onChange={(e) => patchRound(i, { en: e.target.value })}
              placeholder="Round"
            />
            <input
              className={compactInputClass}
              value={m.score}
              onChange={(e) => patchMatch(i, { score: e.target.value })}
              placeholder="0-0"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button onClick={() => setExpandedMatchId(expanded ? null : m.id)} className="min-h-[32px] px-2 py-1 text-[10px]">
              {expanded ? "Hide" : "More"}
            </Button>
            <Button onClick={() => duplicateMatch(i)} className="min-h-[32px] px-2 py-1 text-[10px]">
              Copy
            </Button>
          </div>
        </div>
        {expanded && <div className="border-t border-edge p-2">{renderMatchEditor(ref, { compact: true })}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-col items-start justify-between gap-2 border-b border-edge bg-void/95 px-4 py-2 backdrop-blur md:-mx-6 md:flex-row md:items-center md:px-6">
        <p className="font-mono text-xs text-ash">
          {matches.length} matches / {tournaments.length} tournaments
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">Saved</span>}
          <Button onClick={openMatchesPreview} className="min-h-[34px] px-3 py-1">
            Preview
          </Button>
          <Button onClick={saveAndPreview} disabled={saving} className="min-h-[34px] px-3 py-1">
            {saving ? "Saving..." : "Save + view"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { id: "records", label: "Records", count: tournaments.length },
          { id: "page", label: "Copy", count: 4 },
        ] as const).map(({ id, label, count }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={active}
              className={`inline-flex min-h-[34px] items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "border-amethyst bg-amethyst/15 text-soul shadow-[0_0_16px_rgba(168,85,247,0.3)]"
                  : "border-edge bg-crypt text-ash hover:border-edge-bright hover:text-soul"
              }`}
            >
              {label}
              <span className={`font-mono text-[10px] ${active ? "text-spectre" : "text-ash-dim"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {view === "page" && (
        <section className="space-y-4">
          <Card>
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">Matches page copy</h2>
              <p className="mt-1 font-mono text-xs text-ash">
                Public /matches labels.
              </p>
            </div>
            <div className="grid gap-3">
              <BilingualField label="Hero kicker" value={page.kicker} onChange={(v) => patchPage({ kicker: v })} />
              <BilingualField label="Hero title" value={page.title} onChange={(v) => patchPage({ title: v })} />
              <BilingualField label="Hero intro" value={page.intro} onChange={(v) => patchPage({ intro: v })} />
              <BilingualField label="Record label" value={page.recordLabel} onChange={(v) => patchPage({ recordLabel: v })} />
              <BilingualField label="Record intro" value={page.recordIntro} onChange={(v) => patchPage({ recordIntro: v })} />
              <BilingualField label="History kicker" value={page.historyKicker} onChange={(v) => patchPage({ historyKicker: v })} />
              <BilingualField label="History title" value={page.historyTitle} onChange={(v) => patchPage({ historyTitle: v })} />
              <BilingualField label="No results message" value={page.noResults} onChange={(v) => patchPage({ noResults: v })} />
              <BilingualField label="Unknown opponent fallback" value={page.unknownOpponent} onChange={(v) => patchPage({ unknownOpponent: v })} />
              <BilingualField label="Unknown tournament fallback" value={page.unknownTournament} onChange={(v) => patchPage({ unknownTournament: v })} />
              <BilingualField label="VOD soon label" value={page.vodSoon} onChange={(v) => patchPage({ vodSoon: v })} />
              <BilingualField label="Watch VOD label" value={page.watchVod} onChange={(v) => patchPage({ watchVod: v })} />
              <BilingualField label="Sort control label" value={page.sortLabel} onChange={(v) => patchPage({ sortLabel: v })} />
              <BilingualField label="Sort newest first" value={page.sortNewest} onChange={(v) => patchPage({ sortNewest: v })} />
              <BilingualField label="Sort oldest first" value={page.sortOldest} onChange={(v) => patchPage({ sortOldest: v })} />
              <BilingualField label="Sort highest prize" value={page.sortPrizeHigh} onChange={(v) => patchPage({ sortPrizeHigh: v })} />
              <BilingualField label="Sort lowest prize" value={page.sortPrizeLow} onChange={(v) => patchPage({ sortPrizeLow: v })} />
              <BilingualField label="Year filter label" value={page.yearLabel} onChange={(v) => patchPage({ yearLabel: v })} />
              <BilingualField label="All years label" value={page.allYears} onChange={(v) => patchPage({ allYears: v })} />
              <SelectField
                label="Default game on /matches"
                value={page.defaultGame}
                onChange={(v) => patchPage({ defaultGame: v as Match["game"] })}
                options={GAME_OPTS}
              />
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">Filters, stats, results</h2>
              <p className="mt-1 font-mono text-xs text-ash">Public labels.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-edge bg-void/40 p-4">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amethyst">Filters</p>
                <div className="grid gap-3">
                  {filterIds.map((id) => (
                    <BilingualField
                      key={id}
                      label={id}
                      value={page.filters[id]}
                      onChange={(v) => patchPage({ filters: { ...page.filters, [id]: v } })}
                    />
                  ))}
                </div>
              </div>
              <div className="border border-edge bg-void/40 p-4">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amethyst">Stats</p>
                <div className="grid gap-3">
                  {statIds.map((id) => (
                    <BilingualField
                      key={id}
                      label={id}
                      value={page.stats[id]}
                      onChange={(v) => patchPage({ stats: { ...page.stats, [id]: v } })}
                    />
                  ))}
                </div>
              </div>
              <div className="border border-edge bg-void/40 p-4">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amethyst">Results</p>
                <div className="grid gap-3">
                  {resultIds.map((id) => (
                    <BilingualField
                      key={id}
                      label={id}
                      value={page.results[id]}
                      onChange={(v) => patchPage({ results: { ...page.results, [id]: v } })}
                    />
                  ))}
                </div>
              </div>
              <div className="border border-edge bg-void/40 p-4">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amethyst">Tournament labels</p>
                <div className="grid gap-3">
                  {tournamentLabelIds.map((id) => (
                    <BilingualField
                      key={id}
                      label={id}
                      value={page.tournamentLabels[id]}
                      onChange={(v) => patchPage({ tournamentLabels: { ...page.tournamentLabels, [id]: v } })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {view === "records" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">Records</h2>
              <p className="mt-0.5 max-w-2xl font-mono text-[11px] text-ash">
                Open a tournament, edit matches, save once.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={addTournament} variant="primary" className="min-h-[34px] px-3 py-1">
                + Add Tournament
              </Button>
              <Button onClick={addMatch} className="min-h-[34px] px-3 py-1">+ Standalone</Button>
            </div>
          </div>

          <Card className="bg-crypt2/80">
            <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_130px] lg:items-end">
              <TextField
                label="Search"
                value={recordQuery}
                onChange={setRecordQuery}
                placeholder="MPL, ONIC, Final..."
              />
              <SelectField
                label="Game"
                value={gameFilter}
                onChange={(v) => setGameFilter(v as GameFilter)}
                options={[
                  { value: "all", label: "All Games" },
                  { value: "mlbb", label: "MLBB" },
                  { value: "efootball", label: "eFootball" },
                ]}
              />
              <SelectField
                label={page.yearLabel.en || "Year"}
                value={yearFilter}
                onChange={setYearFilter}
                options={[
                  { value: "all", label: page.allYears.en || "All years" },
                  ...yearOptions.map((year) => ({ value: year, label: year })),
                ]}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-ash">
                {filteredTournamentGroups.length}/{tournamentGroups.length} tournaments / {filteredUnassignedMatches.length} unassigned
              </p>
              {(recordQuery || gameFilter !== "all" || yearFilter !== "all") && (
                <Button
                  onClick={() => {
                    setRecordQuery("");
                    setGameFilter("all");
                    setYearFilter("all");
                  }}
                  className="min-h-[30px] px-2 py-1 text-[10px]"
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          <div className="grid gap-3">
            {filteredTournamentGroups.length === 0 && (
              <Card className="border-dashed bg-void/35">
                <p className="font-mono text-xs text-ash">
                  No tournaments match.
                </p>
              </Card>
            )}

            {filteredTournamentGroups.map(({ tournament, items }) => {
              const tournamentIndex = tournaments.findIndex((item) => item.id === tournament.id);
              const open = openTournamentId === tournament.id;
              return (
                <Card key={tournament.id} className={open ? "border-amethyst/70 bg-crypt2 shadow-[0_0_22px_rgba(168,85,247,0.12)]" : ""}>
                  <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-center">
                    <button
                      type="button"
                      onClick={() => setOpenTournamentId(open ? null : tournament.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="border border-amethyst/50 bg-amethyst/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amethyst">
                          {tournament.game === "mlbb" ? "MLBB" : "eFootball"}
                        </span>
                        <span className="border border-edge bg-void/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ash">
                          {items.length} matches
                        </span>
                        {tournament.season && (
                          <span className="border border-edge bg-void/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ash">
                            {tournament.season}
                          </span>
                        )}
                        {tournament.prize && tournament.prize.trim() && tournament.prize !== "-" && (
                          <span className="border border-amethyst/40 bg-amethyst/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-spectre">
                            Prize {tournament.prize}
                          </span>
                        )}
                      </div>
                      <p className="truncate font-display text-lg font-bold uppercase tracking-wide text-soul">
                          {tournament.name.en || "Untitled tournament"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-ash">{tournament.placement.en || "No placement yet"}</p>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                      <Button
                        onClick={() => setOpenTournamentId(open ? null : tournament.id)}
                        className="min-h-[34px] px-3 py-1"
                      >
                        {open ? "Close" : "Open"}
                      </Button>
                      <Button onClick={() => addMatchForTournament(tournament)} variant="primary" className="min-h-[34px] px-3 py-1">
                        + Add Match
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-3 space-y-3 border-t border-edge pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-edge bg-void/35 px-2 py-2">
                        <div>
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-spectre">
                            Matches
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-ash-dim">
                            Date, round, opponent, score, result.
                          </p>
                        </div>
                        <Button onClick={() => addMatchForTournament(tournament)} variant="primary" className="min-h-[32px] px-2 py-1 text-[10px]">
                          + Add Match
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {items.length > 0 ? (
                          <div className="space-y-2">
                            <div className="overflow-x-auto border border-edge bg-crypt/55">
                              <div className="hidden min-w-[820px] grid-cols-[110px_142px_minmax(160px,1fr)_72px_94px_184px] gap-1.5 border-b border-edge px-1.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ash md:grid">
                                <span>Date</span>
                                <span>Round</span>
                                <span>Opponent</span>
                                <span>Score</span>
                                <span>Result</span>
                                <span>Tools</span>
                              </div>
                              <div className="space-y-1.5 p-1.5">{items.map((ref) => renderMatchQuickRow(ref))}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-edge bg-void/35 p-3 font-mono text-xs text-ash">
                            No matches yet.
                          </div>
                        )}
                      </div>

                      <details className="border border-edge bg-void/35">
                        <summary className="cursor-pointer px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ash hover:text-soul">
                          Settings
                        </summary>
                        <div className="space-y-3 border-t border-edge p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <BilingualField
                                label="Tournament name"
                                value={tournament.name}
                                onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { name: v })}
                              />
                            </div>
                            <SelectField
                              label="Game"
                              value={tournament.game}
                              onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { game: v as Tournament["game"] })}
                              options={GAME_OPTS}
                            />
                            <TextField
                              label="Season"
                              value={tournament.season}
                              onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { season: v })}
                            />
                            <TextField
                              label="Prize money"
                              value={tournament.prize}
                              onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { prize: v })}
                              placeholder="$1,000"
                            />
                            <div className="md:col-span-2">
                              <BilingualField
                                label="Placement / Result"
                                value={tournament.placement}
                                onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { placement: v })}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 border-t border-edge pt-3">
                            <Button onClick={() => setTournaments(move(tournaments, tournamentIndex, -1))} className="min-h-[34px] px-3 py-1">
                              Move Up
                            </Button>
                            <Button onClick={() => setTournaments(move(tournaments, tournamentIndex, 1))} className="min-h-[34px] px-3 py-1">
                              Move Down
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                setTournaments(tournaments.filter((_, idx) => idx !== tournamentIndex));
                                if (openTournamentId === tournament.id) setOpenTournamentId(null);
                              }}
                              className="min-h-[34px] px-3 py-1"
                            >
                              Delete Tournament
                            </Button>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </Card>
              );
            })}

            <Card className={unassignedOpen ? "border-edge-bright bg-crypt2" : ""}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setUnassignedOpen(!unassignedOpen)} className="text-left">
                  <p className="font-display text-base font-bold uppercase tracking-wide text-soul">Unassigned Matches</p>
                  <p className="mt-1 font-mono text-[11px] text-ash">
                    {filteredUnassignedMatches.length} unassigned matches.
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setUnassignedOpen(!unassignedOpen)}>{unassignedOpen ? "Close" : "Open"}</Button>
                </div>
              </div>

              {unassignedOpen && (
                <div className="mt-4 space-y-3 border-t border-edge pt-4">
                  {filteredUnassignedMatches.length > 0 ? (
                    filteredUnassignedMatches.map((ref) => renderMatchEditor(ref, { showTournament: true }))
                  ) : (
                    <div className="border border-dashed border-edge bg-void/35 p-4 font-mono text-xs text-ash">
                      No unassigned matches match the current search/filter.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
