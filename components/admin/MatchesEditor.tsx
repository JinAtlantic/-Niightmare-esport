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

const pageSeed = matchesSeed.page as MatchesPageCopy;
const filterIds: Filter[] = ["all", "mlbb", "efootball", "wins", "losses"];
const statIds = ["wins", "draws", "losses", "winrate"] as const;
const resultIds: MatchResult[] = ["win", "draw", "loss"];
const tournamentLabelIds = ["placement", "prize", "season"] as const;

function pageCopy(page?: Partial<MatchesPageCopy>): MatchesPageCopy {
  return {
    ...pageSeed,
    ...page,
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
  { value: "draw", label: "Draw" },
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

export default function MatchesEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<MatchesFile>("matches");
  const [view, setView] = useState<"records" | "page">("records");
  const [openTournamentId, setOpenTournamentId] = useState<string | null>(null);
  const [unassignedOpen, setUnassignedOpen] = useState(false);

  if (loading) return <p className="font-mono text-sm text-ash">Loading...</p>;
  if (!data) return <p className="font-mono text-sm text-loss">Could not load matches data.</p>;

  const { matches, tournaments } = data;
  const page = pageCopy(data.page);
  const setPage = (next: MatchesPageCopy) => setData({ ...data, page: next });
  const patchPage = (patch: Partial<MatchesPageCopy>) => setPage({ ...page, ...patch });

  const setMatches = (next: Match[]) => setData({ ...data, matches: next });
  const setTournaments = (next: Tournament[]) => setData({ ...data, tournaments: next });

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

  const renderMatchEditor = (ref: MatchRef, options?: { compact?: boolean; showTournament?: boolean }) => {
    const { match: m, index: i } = ref;
    const compact = options?.compact ?? false;
    const showTournament = options?.showTournament ?? false;

    return (
      <div key={m.id} className="border border-edge bg-void/45 p-3 md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={24} />
            <span className="truncate font-mono text-xs text-ash">
              NM <span className="text-ash-dim">vs</span>{" "}
              <span className="text-spectre">{m.opponent || "No opponent yet"}</span> / {m.score}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button onClick={() => setMatches(move(matches, i, -1))} className="min-h-[32px] px-2 py-1">
              Up
            </Button>
            <Button onClick={() => setMatches(move(matches, i, 1))} className="min-h-[32px] px-2 py-1">
              Down
            </Button>
            {!showTournament && (
              <Button
                onClick={() => patchMatch(i, { tournament: { ...emptyText } })}
                className="min-h-[32px] px-2 py-1"
              >
                Unassign
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => setMatches(matches.filter((_, idx) => idx !== i))}
              className="min-h-[32px] px-2 py-1"
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
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
          <div className="md:col-span-2">
            <div className="mb-3 border border-edge bg-crypt/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amethyst">
                  Round presets
                </p>
                {!compact && <p className="font-mono text-[10px] text-ash-dim">Use outer rounds first, finals last.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {ROUND_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    onClick={() => patchMatch(i, { round: preset.value })}
                    className="min-h-[32px] px-2 py-1 text-[10px] tracking-[0.1em]"
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="danger"
                  onClick={() => patchMatch(i, { round: { ...emptyText } })}
                  className="min-h-[32px] px-2 py-1 text-[10px] tracking-[0.1em]"
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

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          {matches.length} matches / {tournaments.length} tournaments
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">Saved</span>}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { id: "records", label: "Tournament Records", count: tournaments.length },
          { id: "page", label: "Matches Page Copy", count: 4 },
        ] as const).map(({ id, label, count }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={active}
              className={`inline-flex min-h-[40px] items-center gap-2 border px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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
                Edit public /matches labels here. Save once after all changes.
              </p>
            </div>
            <div className="grid gap-3">
              <BilingualField label="Hero kicker" value={page.kicker} onChange={(v) => patchPage({ kicker: v })} />
              <BilingualField label="Hero title" value={page.title} onChange={(v) => patchPage({ title: v })} />
              <BilingualField label="Hero intro" value={page.intro} onChange={(v) => patchPage({ intro: v })} />
              <BilingualField label="Record panel label" value={page.recordLabel} onChange={(v) => patchPage({ recordLabel: v })} />
              <BilingualField label="Record panel intro" value={page.recordIntro} onChange={(v) => patchPage({ recordIntro: v })} />
              <BilingualField label="History kicker" value={page.historyKicker} onChange={(v) => patchPage({ historyKicker: v })} />
              <BilingualField label="History title" value={page.historyTitle} onChange={(v) => patchPage({ historyTitle: v })} />
              <BilingualField label="No results message" value={page.noResults} onChange={(v) => patchPage({ noResults: v })} />
              <BilingualField label="Unknown opponent fallback" value={page.unknownOpponent} onChange={(v) => patchPage({ unknownOpponent: v })} />
              <BilingualField label="Unknown tournament fallback" value={page.unknownTournament} onChange={(v) => patchPage({ unknownTournament: v })} />
              <BilingualField label="VOD soon label" value={page.vodSoon} onChange={(v) => patchPage({ vodSoon: v })} />
              <BilingualField label="Watch VOD label" value={page.watchVod} onChange={(v) => patchPage({ watchVod: v })} />
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">Filters, stats, results</h2>
              <p className="mt-1 font-mono text-xs text-ash">Labels for filters, stat cards, result badges, and tournament accordions.</p>
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
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">Tournament Records</h2>
              <p className="mt-1 max-w-2xl font-mono text-xs text-ash">
                Open one tournament, edit its info, then add or edit matches inside it. Matches follow the tournament name and game automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={addTournament} variant="primary">
                + Add Tournament
              </Button>
              <Button onClick={addMatch}>+ Standalone Match</Button>
            </div>
          </div>

          <div className="grid gap-4">
            {tournamentGroups.map(({ tournament, items }, tournamentIndex) => {
              const open = openTournamentId === tournament.id;
              return (
                <Card key={tournament.id} className={open ? "border-amethyst/70 bg-crypt2" : ""}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenTournamentId(open ? null : tournament.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-amethyst/40 bg-amethyst/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amethyst">
                          {tournament.game === "mlbb" ? "MLBB" : "eFootball"}
                        </span>
                        <span className="truncate font-display text-base font-bold uppercase tracking-wide text-soul">
                          {tournament.name.en || "Untitled tournament"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-ash">
                        {tournament.season || "No season"} / {items.length} matches / {tournament.placement.en || "No placement"}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button onClick={() => setTournaments(move(tournaments, tournamentIndex, -1))} className="min-h-[34px] px-3 py-1">
                        Up
                      </Button>
                      <Button onClick={() => setTournaments(move(tournaments, tournamentIndex, 1))} className="min-h-[34px] px-3 py-1">
                        Down
                      </Button>
                      <Button
                        onClick={() => setOpenTournamentId(open ? null : tournament.id)}
                        className="min-h-[34px] px-3 py-1"
                      >
                        {open ? "Close" : "Edit"}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setTournaments(tournaments.filter((_, idx) => idx !== tournamentIndex));
                          if (openTournamentId === tournament.id) setOpenTournamentId(null);
                        }}
                        className="min-h-[34px] px-3 py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t border-edge pt-4">
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
                        <div className="md:col-span-2">
                          <BilingualField
                            label="Placement / Result"
                            value={tournament.placement}
                            onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { placement: v })}
                          />
                        </div>
                        <TextField
                          label="Prize"
                          value={tournament.prize}
                          onChange={(v) => patchTournamentAndLinkedMatches(tournamentIndex, { prize: v })}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-edge bg-void/35 px-3 py-3">
                        <div>
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-spectre">
                            Matches in this tournament
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-ash-dim">
                            Add match here to prefill game and tournament automatically.
                          </p>
                        </div>
                        <Button onClick={() => addMatchForTournament(tournament)} variant="primary">
                          + Add Match
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {items.length > 0 ? (
                          items.map((ref) => renderMatchEditor(ref, { compact: true }))
                        ) : (
                          <div className="border border-dashed border-edge bg-void/35 p-4 font-mono text-xs text-ash">
                            No matches yet. Use + Add Match to create the first match under this tournament.
                          </div>
                        )}
                      </div>
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
                    {unassignedMatches.length} matches not linked to a tournament record.
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setUnassignedOpen(!unassignedOpen)}>{unassignedOpen ? "Close" : "Open"}</Button>
                  <Button onClick={addMatch}>+ Standalone Match</Button>
                </div>
              </div>

              {unassignedOpen && (
                <div className="mt-4 space-y-3 border-t border-edge pt-4">
                  {unassignedMatches.length > 0 ? (
                    unassignedMatches.map((ref) => renderMatchEditor(ref, { showTournament: true }))
                  ) : (
                    <div className="border border-dashed border-edge bg-void/35 p-4 font-mono text-xs text-ash">
                      No unassigned matches. Everything is grouped under a tournament.
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
