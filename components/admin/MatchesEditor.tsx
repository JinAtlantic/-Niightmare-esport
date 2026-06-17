"use client";

import React from "react";
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
import type { Match, Tournament } from "@/lib/types";

interface MatchesFile {
  matches: Match[];
  tournaments: Tournament[];
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

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { matches, tournaments } = data;

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
                    label="ทัวร์นาเมนต์"
                    value={m.tournament}
                    onChange={(v) => patchMatch(i, { tournament: v })}
                  />
                </div>
                <div className="md:col-span-2">
                  <BilingualField
                    label="รอบการแข่งขัน (เช่น รอบแบ่งกลุ่ม / รอบชิง — เว้นว่างได้)"
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
