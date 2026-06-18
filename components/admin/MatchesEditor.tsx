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
  { value: "win", label: "ชนะ (Win)" },
  { value: "draw", label: "เสมอ (Draw)" },
  { value: "loss", label: "แพ้ (Loss)" },
];

const ROUND_PRESETS: { id: string; label: string; value: Bilingual }[] = [
  { id: "wild-card", label: "Wild Card", value: { en: "Wild Card", lo: "Wild Card" } },
  { id: "group-stage", label: "Group Stage", value: { en: "Group Stage", lo: "Group Stage" } },
  { id: "quarter-final", label: "Quarter-Final", value: { en: "Quarter-Final", lo: "Quarter-Final" } },
  { id: "semi-final", label: "Semi-Final", value: { en: "Semi-Final", lo: "Semi-Final" } },
  { id: "final", label: "Final", value: { en: "Final", lo: "Final" } },
  { id: "grand-final", label: "Grand Final", value: { en: "Grand Final", lo: "Grand Final" } },
];

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function MatchesEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<MatchesFile>("matches");
  const [view, setView] = useState<"page" | "matches" | "tournaments">("matches");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { matches, tournaments } = data;
  const page = pageCopy(data.page);
  const setPage = (next: MatchesPageCopy) => setData({ ...data, page: next });
  const patchPage = (patch: Partial<MatchesPageCopy>) => setPage({ ...page, ...patch });

  const setMatches = (next: Match[]) => setData({ ...data, matches: next });
  const setTournaments = (next: Tournament[]) => setData({ ...data, tournaments: next });

  const patchMatch = (i: number, patch: Partial<Match>) =>
    setMatches(matches.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const patchTour = (i: number, patch: Partial<Tournament>) =>
    setTournaments(tournaments.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const addMatch = () =>
    setMatches([
      {
        id: uid("m"),
        date: new Date().toISOString().slice(0, 10),
        game: "mlbb",
        tournament: { en: "", lo: "" },
        round: { en: "", lo: "" },
        opponent: "",
        score: "0-0",
        result: "win",
        vod: null,
      },
      ...matches,
    ]);

  const addTour = () =>
    setTournaments([
      {
        id: uid("t"),
        name: { en: "", lo: "" },
        game: "mlbb",
        placement: { en: "", lo: "" },
        prize: "—",
        season: String(new Date().getFullYear()),
      },
      ...tournaments,
    ]);

  return (
    <div className="space-y-10">
      {/* save bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          {matches.length} แมตช์ · {tournaments.length} ทัวร์นาเมนต์
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && (
            <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>
          )}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      {/* ── matches ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "page", label: "หน้า Matches (Page)", count: 4 },
          { id: "matches", label: "ผลการแข่งขัน (Matches)", count: matches.length },
          { id: "tournaments", label: "ทัวร์นาเมนต์", count: tournaments.length },
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
                ข้อความทุกช่องนี้จะแสดงบนหน้า /matches และแก้ได้โดยไม่ต้อง deploy
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
              <p className="mt-1 font-mono text-xs text-ash">
                Labels ของ filter, stat cards, result badges และ tournament accordion
              </p>
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

      {view === "matches" && (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            ผลการแข่งขัน (Matches)
          </h2>
          <Button onClick={addMatch}>+ เพิ่มแมตช์</Button>
        </div>

        <div className="space-y-4">
          {matches.map((m, i) => (
            <Card key={m.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={24} />
                  <span className="font-mono text-xs text-ash">
                    NM <span className="text-ash-dim">vs</span>{" "}
                    <span className="text-spectre">{m.opponent || "—"}</span> · {m.score}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button onClick={() => setMatches(move(matches, i, -1))}>↑</Button>
                  <Button onClick={() => setMatches(move(matches, i, 1))}>↓</Button>
                  <Button variant="danger" onClick={() => setMatches(matches.filter((_, idx) => idx !== i))}>
                    ลบ
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="วันที่" type="date" value={m.date} onChange={(v) => patchMatch(i, { date: v })} />
                <SelectField
                  label="เกม"
                  value={m.game}
                  onChange={(v) => patchMatch(i, { game: v as Match["game"] })}
                  options={GAME_OPTS}
                />
                <div className="md:col-span-2">
                  <BilingualField
                    label="Tournament"
                    value={m.tournament}
                    onChange={(v) => patchMatch(i, { tournament: v })}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-3 border border-edge bg-void/35 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amethyst">
                        Round presets
                      </p>
                      <p className="font-mono text-[10px] text-ash-dim">
                        Outer rounds first, finals last on /matches
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ROUND_PRESETS.map((preset) => (
                        <Button
                          key={preset.id}
                          onClick={() => patchMatch(i, { round: preset.value })}
                          className="min-h-[34px] px-3 py-1 text-[10px] tracking-[0.12em]"
                        >
                          {preset.label}
                        </Button>
                      ))}
                      <Button
                        variant="danger"
                        onClick={() => patchMatch(i, { round: { en: "", lo: "" } })}
                        className="min-h-[34px] px-3 py-1 text-[10px] tracking-[0.12em]"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <BilingualField
                    label="Round / Stage"
                    value={m.round ?? { en: "", lo: "" }}
                    onChange={(v) => patchMatch(i, { round: v })}
                  />
                </div>
                <TextField
                  label="ทีมคู่แข่ง"
                  value={m.opponent}
                  onChange={(v) => patchMatch(i, { opponent: v })}
                  placeholder="เช่น Dragon Force"
                />
                <TextField
                  label="สกอร์"
                  value={m.score}
                  onChange={(v) => patchMatch(i, { score: v })}
                  placeholder="3-1"
                />
                <SelectField
                  label="ผลการแข่ง"
                  value={m.result}
                  onChange={(v) => patchMatch(i, { result: v as Match["result"] })}
                  options={RESULT_OPTS}
                />
                <TextField
                  label="ลิงก์วิดีโอ (VOD) — เว้นว่างได้"
                  value={m.vod ?? ""}
                  onChange={(v) => patchMatch(i, { vod: v.trim() ? v.trim() : null })}
                  placeholder="https://youtube.com/…"
                />
                <div className="md:col-span-2">
                  <ImageField
                    label="โลโก้คู่แข่ง"
                    value={m.opponentLogo}
                    folder="teams"
                    onChange={(p) => patchMatch(i, { opponentLogo: p || undefined })}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      )}

      {/* ── tournaments ─────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            ประวัติทัวร์นาเมนต์
          </h2>
          <Button onClick={addTour}>+ เพิ่มทัวร์นาเมนต์</Button>
        </div>

        <div className="space-y-4">
          {tournaments.map((t, i) => (
            <Card key={t.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-spectre">{t.name.en || "—"}</span>
                <div className="flex items-center gap-1.5">
                  <Button onClick={() => setTournaments(move(tournaments, i, -1))}>↑</Button>
                  <Button onClick={() => setTournaments(move(tournaments, i, 1))}>↓</Button>
                  <Button
                    variant="danger"
                    onClick={() => setTournaments(tournaments.filter((_, idx) => idx !== i))}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <BilingualField label="ชื่อทัวร์นาเมนต์" value={t.name} onChange={(v) => patchTour(i, { name: v })} />
                </div>
                <SelectField
                  label="เกม"
                  value={t.game}
                  onChange={(v) => patchTour(i, { game: v as Tournament["game"] })}
                  options={GAME_OPTS}
                />
                <TextField label="ฤดูกาล" value={t.season} onChange={(v) => patchTour(i, { season: v })} />
                <div className="md:col-span-2">
                  <BilingualField
                    label="อันดับ / ผลงาน"
                    value={t.placement}
                    onChange={(v) => patchTour(i, { placement: v })}
                  />
                </div>
                <TextField label="เงินรางวัล" value={t.prize} onChange={(v) => patchTour(i, { prize: v })} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
