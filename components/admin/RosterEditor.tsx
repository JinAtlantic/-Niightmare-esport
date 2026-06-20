"use client";

import React, { useState } from "react";
import { useData } from "@/components/admin/useData";
import PhotoCropEditor from "@/components/admin/PhotoCropEditor";
import {
  Button,
  Card,
  Section,
  TextField,
  SelectField,
  BilingualField,
  ImageField,
  Label,
} from "@/components/admin/ui";
import rosterSeed from "@/data/roster.json";
import type { Bilingual, Player, StaffMember, GameId } from "@/lib/types";
import { STAFF_ROLES, STAFF_ROLE_TIER, staffRoleKey } from "@/lib/staff";

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "แถว 1 · บริหาร",
  2: "แถว 2 · ปฏิบัติงาน",
  3: "แถว 3 · เทคนิค/สนับสนุน",
};

const STAFF_ROLE_OPTIONS = STAFF_ROLES.map((r) => ({
  value: r.value,
  label: `${r.label.en} — ${TIER_LABEL[STAFF_ROLE_TIER[r.value]]}`,
}));

type RosterStatId = "active" | "mlbb" | "efootball" | "staff";
type RosterTierKey = "executive" | "operations" | "technical";

interface RosterPageStat {
  id: RosterStatId;
  label: Bilingual;
  detail: Bilingual;
}

interface RosterPageCopy {
  kicker?: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  overviewLabel: Bilingual;
  overviewIntro: Bilingual;
  lineupLabel: Bilingual;
  staffLabel: Bilingual;
  divisionLabels: Record<GameId, Bilingual>;
  tierLabels: Record<RosterTierKey, Bilingual>;
  stats: RosterPageStat[];
}

interface RosterFile {
  page?: RosterPageCopy;
  mlbb: { players: Player[] };
  efootball: { players: Player[] };
  staff: StaffMember[];
}

const pageSeed = rosterSeed.page as RosterPageCopy;
const statIds: RosterStatId[] = ["active", "mlbb", "efootball", "staff"];

function pageCopy(page?: Partial<RosterPageCopy>): RosterPageCopy {
  const incomingStats = page?.stats ?? [];
  return {
    ...pageSeed,
    ...page,
    divisionLabels: { ...pageSeed.divisionLabels, ...(page?.divisionLabels ?? {}) },
    tierLabels: { ...pageSeed.tierLabels, ...(page?.tierLabels ?? {}) },
    stats: statIds.map((id) => incomingStats.find((stat) => stat.id === id) ?? pageSeed.stats.find((stat) => stat.id === id)!),
  };
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
    <Section title={title} action={<Button onClick={onAdd}>+ เพิ่มนักแข่ง</Button>}>
      <div className="space-y-4">
        {players.map((p, i) => {
          const setHero = (k: number, v: string) => {
            const arr = [...(p.heroes ?? [])];
            while (arr.length < 3) arr.push("");
            arr[k] = v;
            const cleaned = arr.map((x) => x.trim());
            onPatch(i, { heroes: cleaned.some(Boolean) ? cleaned : undefined });
          };
          const setGear = (key: "device" | "audio", v: string) => {
            const gear = { ...p.gear, [key]: v.trim() || undefined };
            onPatch(i, { gear: gear.device || gear.audio ? gear : undefined });
          };
          return (
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
                  onChange={(path) => onPatch(i, { photo: path || undefined, photoCrop: undefined })}
                />
              </div>
              {p.photo && (
                <div className="md:col-span-2">
                  <PhotoCropEditor
                    key={p.photo}
                    src={p.photo}
                    crop={p.photoCrop}
                    onChange={(crop) => onPatch(i, { photoCrop: crop })}
                  />
                </div>
              )}
              {/* Profile extras shown in the player modal */}
              <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                <TextField label="Signature Hero 1" value={p.heroes?.[0] ?? ""} onChange={(v) => setHero(0, v)} />
                <TextField label="Signature Hero 2" value={p.heroes?.[1] ?? ""} onChange={(v) => setHero(1, v)} />
                <TextField label="Signature Hero 3" value={p.heroes?.[2] ?? ""} onChange={(v) => setHero(2, v)} />
              </div>
              <TextField
                label="Win Rate (เช่น 68%)"
                value={p.winRate ?? ""}
                onChange={(v) => onPatch(i, { winRate: v || undefined })}
              />
              <div className="hidden md:block" />
              <TextField label="GEAR — มือถือ/เครื่อง" value={p.gear?.device ?? ""} onChange={(v) => setGear("device", v)} />
              <TextField label="GEAR — หูฟัง" value={p.gear?.audio ?? ""} onChange={(v) => setGear("audio", v)} />

              <div className="md:col-span-2">
                <TextField
                  label="อีเมล (ไม่บังคับ — ใส่แล้วจะมีปุ่มก๊อปปี้อีเมลในโปรไฟล์)"
                  value={p.email ?? ""}
                  onChange={(v) => onPatch(i, { email: v.trim() || undefined })}
                  placeholder="name@niightmare.gg"
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
          );
        })}
      </div>
    </Section>
  );
}

export default function RosterEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<RosterFile>("roster");
  const [view, setView] = useState<"page" | "players" | "staff">("players");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const page = pageCopy(data.page);
  const setPage = (next: RosterPageCopy) => setData({ ...data, page: next });
  const patchPage = (patch: Partial<RosterPageCopy>) => setPage({ ...page, ...patch });
  const patchStat = (id: RosterStatId, patch: Partial<RosterPageStat>) =>
    setPage({
      ...page,
      stats: page.stats.map((stat) => (stat.id === id ? { ...stat, ...patch } : stat)),
    });

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

  const patchStaff = (i: number, patch: Partial<StaffMember>) =>
    setData({ ...data, staff: data.staff.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
  const moveStaff = (i: number, dir: -1 | 1) =>
    setData({ ...data, staff: move(data.staff, i, dir) });
  const setStaffSocial = (i: number, key: keyof StaffMember["socials"], val: string) => {
    const socials = { ...data.staff[i].socials };
    const v = val.trim();
    if (!v || v === "#") delete socials[key];
    else socials[key] = v;
    patchStaff(i, { socials });
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

      {/* sub-tabs — edit players or staff separately for a shorter, focused form */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "page", label: "หน้า Roster (Page)", count: page.stats.length },
          { id: "players", label: "นักกีฬา (Players)", count: data.mlbb.players.length + data.efootball.players.length },
          { id: "staff", label: "ทีมหลังบ้าน (Staff)", count: data.staff.length },
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
          <Section title="Roster page copy" hint="ข้อความบนหน้า /roster — แก้ได้โดยไม่ต้อง deploy">
            <Card>
            <div className="grid gap-3">
              <BilingualField
                label="Hero kicker"
                value={page.kicker ?? { en: "", lo: "" }}
                onChange={(v) => patchPage({ kicker: v.en || v.lo ? v : undefined })}
              />
              <BilingualField label="Hero title" value={page.title} onChange={(v) => patchPage({ title: v })} />
              <BilingualField label="Hero intro" value={page.intro} onChange={(v) => patchPage({ intro: v })} />
              <BilingualField
                label="Overview label"
                value={page.overviewLabel}
                onChange={(v) => patchPage({ overviewLabel: v })}
              />
              <BilingualField
                label="Overview intro"
                value={page.overviewIntro}
                onChange={(v) => patchPage({ overviewIntro: v })}
              />
              <BilingualField label="Lineup heading" value={page.lineupLabel} onChange={(v) => patchPage({ lineupLabel: v })} />
              <BilingualField label="Staff heading" value={page.staffLabel} onChange={(v) => patchPage({ staffLabel: v })} />
            </div>
            </Card>
          </Section>

          <Section title="Navigation labels" hint="Labels ของ tab เกมและ tier ทีมงานบนหน้า roster">
            <Card>
            <div className="grid gap-3 md:grid-cols-2">
              <BilingualField
                label="MLBB tab"
                value={page.divisionLabels.mlbb}
                onChange={(v) => patchPage({ divisionLabels: { ...page.divisionLabels, mlbb: v } })}
              />
              <BilingualField
                label="eFootball tab"
                value={page.divisionLabels.efootball}
                onChange={(v) => patchPage({ divisionLabels: { ...page.divisionLabels, efootball: v } })}
              />
              <BilingualField
                label="Executive tier"
                value={page.tierLabels.executive}
                onChange={(v) => patchPage({ tierLabels: { ...page.tierLabels, executive: v } })}
              />
              <BilingualField
                label="Operations tier"
                value={page.tierLabels.operations}
                onChange={(v) => patchPage({ tierLabels: { ...page.tierLabels, operations: v } })}
              />
              <BilingualField
                label="Technical tier"
                value={page.tierLabels.technical}
                onChange={(v) => patchPage({ tierLabels: { ...page.tierLabels, technical: v } })}
              />
            </div>
            </Card>
          </Section>

          <Section title="Overview stats" hint="ตัวเลขคำนวณจากจำนวน player/staff; แก้ label และคำอธิบายได้ที่นี่">
            <Card>
            <div className="grid gap-4 md:grid-cols-2">
              {page.stats.map((stat) => (
                <div key={stat.id} className="border border-edge bg-void/40 p-4">
                  <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amethyst">
                    {stat.id}
                  </p>
                  <div className="grid gap-3">
                    <BilingualField label="Label" value={stat.label} onChange={(v) => patchStat(stat.id, { label: v })} />
                    <BilingualField label="Detail" value={stat.detail} onChange={(v) => patchStat(stat.id, { detail: v })} />
                  </div>
                </div>
              ))}
            </div>
            </Card>
          </Section>
        </section>
      )}

      {view === "players" && (
        <>
          <PlayerList title="ทีม MLBB" {...sectionProps("mlbb")} />
          <PlayerList title="ทีม eFootball" {...sectionProps("efootball")} />
        </>
      )}

      {/* staff */}
      {view === "staff" && (
      <Section
        title="ทีมงาน (Staff)"
        action={
          <Button
            onClick={() =>
              setData({
                ...data,
                staff: [...data.staff, { id: uid("staff"), name: "", role: { en: "", lo: "" }, socials: {} }],
              })
            }
          >
            + เพิ่มทีมงาน
          </Button>
        }
      >
        <div className="space-y-4">
          {data.staff.map((s, i) => (
            <Card key={s.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-spectre">{s.name || "—"}</span>
                <div className="flex items-center gap-1.5">
                  <Button onClick={() => moveStaff(i, -1)}>↑</Button>
                  <Button onClick={() => moveStaff(i, 1)}>↓</Button>
                  <Button variant="danger" onClick={() => setData({ ...data, staff: data.staff.filter((_, idx) => idx !== i) })}>
                    ลบ
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="ชื่อจริง"
                  value={s.name ?? ""}
                  onChange={(v) => patchStaff(i, { name: v })}
                />
                <TextField
                  label="ชื่อเล่น / Nickname (ไม่บังคับ)"
                  value={s.ign ?? ""}
                  onChange={(v) => patchStaff(i, { ign: v || undefined })}
                />
                <div className="md:col-span-2">
                  <SelectField
                    label="ตำแหน่งทางการ (จัดลำดับแถวอัตโนมัติ)"
                    value={staffRoleKey(s)}
                    onChange={(v) => patchStaff(i, { officialRole: v as StaffMember["officialRole"] })}
                    options={STAFF_ROLE_OPTIONS}
                  />
                </div>
                <div className="md:col-span-2">
                  <BilingualField
                    label="ตำแหน่งที่แสดงบนการ์ด (Display)"
                    value={s.role}
                    onChange={(v) => patchStaff(i, { role: v })}
                  />
                </div>
                <div className="md:col-span-2">
                  <BilingualField
                    label="หน้าที่รับผิดชอบ (Responsibility / Bio)"
                    value={s.bio ?? { en: "", lo: "" }}
                    onChange={(v) => patchStaff(i, { bio: v.en || v.lo ? v : undefined })}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextField
                    label="อีเมลธุรกิจ (ไม่บังคับ — เว้นว่าง = ใช้อีเมลกลางของสโมสร)"
                    value={s.email ?? ""}
                    onChange={(v) => patchStaff(i, { email: v.trim() || undefined })}
                    placeholder="name@niightmare.gg"
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageField
                    label="รูปทีมงาน"
                    value={s.photo}
                    folder="staff"
                    onChange={(path) => patchStaff(i, { photo: path || undefined })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>ช่องทางติดต่อ (วางลิงก์เฉพาะที่มี — เว้นว่าง = ไม่โชว์)</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {([
                      ["whatsapp", "WhatsApp"],
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
                          value={socialValue(s.socials[k])}
                          onChange={(e) => setStaffSocial(i, k, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
      )}
    </div>
  );
}
