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
  Label,
} from "@/components/admin/ui";
import type { Player, StaffMember, GameId } from "@/lib/types";

interface RosterFile {
  mlbb: { players: Player[] };
  efootball: { players: Player[] };
  staff: StaffMember[];
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function emptyPlayer(game: GameId): Player {
  return {
    id: uid(game === "mlbb" ? "mlbb" : "efb"),
    ign: "",
    role: { en: "", lo: "" },
    socials: {},
  };
}

/** A stored value counts as "set" only if it is non-empty and not the "#" placeholder. */
const socialValue = (v?: string) => (v && v.trim() && v.trim() !== "#" ? v : "");

/**
 * A roster section for one game. Defined at module top-level (NOT inside
 * RosterEditor) so its component identity stays stable across re-renders —
 * otherwise React remounts the inputs on every keystroke, losing focus and
 * jumping the scroll position.
 */
function PlayerList({
  title,
  players,
  onAdd,
  onMove,
  onDelete,
  onPatch,
  onSocial,
}: {
  title: string;
  players: Player[];
  onAdd: () => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onDelete: (i: number) => void;
  onPatch: (i: number, patch: Partial<Player>) => void;
  onSocial: (i: number, key: keyof Player["socials"], val: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">{title}</h2>
        <Button onClick={onAdd}>+ เพิ่มนักแข่ง</Button>
      </div>
      <div className="space-y-4">
        {players.map((p, i) => (
          <Card key={p.id}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-spectre">{p.ign || "—"}</span>
              <div className="flex items-center gap-1.5">
                <Button onClick={() => onMove(i, -1)}>↑</Button>
                <Button onClick={() => onMove(i, 1)}>↓</Button>
                <Button variant="danger" onClick={() => onDelete(i)}>
                  ลบ
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="IGN (ชื่อในเกม)" value={p.ign} onChange={(v) => onPatch(i, { ign: v })} />
              <TextField
                label="ชื่อจริง (ไม่บังคับ)"
                value={p.name ?? ""}
                onChange={(v) => onPatch(i, { name: v || undefined })}
              />
              <div className="md:col-span-2">
                <BilingualField label="ตำแหน่ง" value={p.role} onChange={(v) => onPatch(i, { role: v })} />
              </div>
              <SelectField
                label="สถานะ"
                value={p.sub ? "sub" : "main"}
                onChange={(v) => onPatch(i, { sub: v === "sub" ? true : undefined })}
                options={[
                  { value: "main", label: "ตัวจริง (Main)" },
                  { value: "sub", label: "ตัวสำรอง (Sub)" },
                ]}
              />
              <div className="md:col-span-2">
                <ImageField
                  label="รูปนักแข่ง"
                  value={p.photo}
                  folder="players"
                  onChange={(path) => onPatch(i, { photo: path || undefined })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>โซเชียล — วางลิงก์เฉพาะที่นักแข่งคนนี้ใช้ (เว้นว่าง = ไม่โชว์ไอคอน)</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    ["facebook", "Facebook"],
                    ["instagram", "Instagram"],
                    ["tiktok", "TikTok"],
                    ["youtube", "YouTube"],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ash">
                        {label}
                      </span>
                      <input
                        className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-xs text-soul outline-none focus:border-amethyst"
                        placeholder="https://…"
                        value={socialValue(p.socials[k])}
                        onChange={(e) => onSocial(i, k, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function RosterEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<RosterFile>("roster");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const setPlayers = (game: GameId, next: Player[]) =>
    setData({ ...data, [game]: { players: next } } as RosterFile);
  const patchPlayer = (game: GameId, i: number, patch: Partial<Player>) =>
    setPlayers(game, data[game].players.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setSocial = (game: GameId, i: number, key: keyof Player["socials"], val: string) => {
    const p = data[game].players[i];
    const socials = { ...p.socials };
    const v = val.trim();
    if (!v || v === "#") delete socials[key];
    else socials[key] = v;
    patchPlayer(game, i, { socials });
  };

  const sectionProps = (game: GameId) => ({
    players: data[game].players,
    onAdd: () => setPlayers(game, [...data[game].players, emptyPlayer(game)]),
    onMove: (i: number, dir: -1 | 1) => setPlayers(game, move(data[game].players, i, dir)),
    onDelete: (i: number) => setPlayers(game, data[game].players.filter((_, idx) => idx !== i)),
    onPatch: (i: number, patch: Partial<Player>) => patchPlayer(game, i, patch),
    onSocial: (i: number, key: keyof Player["socials"], val: string) => setSocial(game, i, key, val),
  });

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          MLBB {data.mlbb.players.length} · eFootball {data.efootball.players.length} · ทีมงาน {data.staff.length}
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

      <PlayerList title="ทีม MLBB" {...sectionProps("mlbb")} />
      <PlayerList title="ทีม eFootball" {...sectionProps("efootball")} />

      {/* staff */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">ทีมงาน (Staff)</h2>
          <Button
            onClick={() =>
              setData({
                ...data,
                staff: [...data.staff, { id: uid("staff"), ign: "", role: { en: "", lo: "" }, socials: {} }],
              })
            }
          >
            + เพิ่มทีมงาน
          </Button>
        </div>
        <div className="space-y-4">
          {data.staff.map((s, i) => (
            <Card key={s.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-spectre">{s.ign || "—"}</span>
                <Button variant="danger" onClick={() => setData({ ...data, staff: data.staff.filter((_, idx) => idx !== i) })}>
                  ลบ
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="ชื่อ/ตำแหน่งเล่น"
                  value={s.ign}
                  onChange={(v) => setData({ ...data, staff: data.staff.map((x, idx) => (idx === i ? { ...x, ign: v } : x)) })}
                />
                <TextField
                  label="ชื่อจริง (ไม่บังคับ)"
                  value={s.name ?? ""}
                  onChange={(v) =>
                    setData({ ...data, staff: data.staff.map((x, idx) => (idx === i ? { ...x, name: v || undefined } : x)) })
                  }
                />
                <div className="md:col-span-2">
                  <BilingualField
                    label="บทบาท"
                    value={s.role}
                    onChange={(v) =>
                      setData({ ...data, staff: data.staff.map((x, idx) => (idx === i ? { ...x, role: v } : x)) })
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
