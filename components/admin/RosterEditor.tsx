"use client";

import React, { useState } from "react";
import { useData } from "@/components/admin/useData";
import { useContent } from "@/components/context/ContentContext";
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
import { STAFF_ROLES, memberGame, staffRoleKey } from "@/lib/staff";
import { countryFlag } from "@/lib/personProfile";
import { enabledGames } from "@/lib/games";

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "แถว 1 · บริหาร",
  2: "แถว 2 · ปฏิบัติงาน",
  3: "แถว 3 · เทคนิค/สนับสนุน",
};

/** Coach sections only need coaching/analysis roles. */
const COACH_ROLE_OPTIONS = STAFF_ROLES.filter(
  (r) => r.value === "head_coach" || r.value === "coach" || r.value === "analyst"
).map((r) => ({ value: r.value, label: r.label.en }));

/** Back-office row picker — empty = infer the row from the role text. */
const TIER_OPTIONS = [
  { value: "", label: "อัตโนมัติ (เดาจากชื่อตำแหน่ง)" },
  { value: "1", label: TIER_LABEL[1] },
  { value: "2", label: TIER_LABEL[2] },
  { value: "3", label: TIER_LABEL[3] },
];

const FLAG_OPTIONS = [
  { value: "", label: "ไม่แสดงธง" },
  { value: "LA", label: `${countryFlag("LA")} Laos / ລາວ` },
  { value: "PH", label: `${countryFlag("PH")} Philippines` },
  { value: "TH", label: `${countryFlag("TH")} Thailand` },
  { value: "VN", label: `${countryFlag("VN")} Vietnam` },
  { value: "KH", label: `${countryFlag("KH")} Cambodia` },
  { value: "MM", label: `${countryFlag("MM")} Myanmar` },
  { value: "ID", label: `${countryFlag("ID")} Indonesia` },
  { value: "MY", label: `${countryFlag("MY")} Malaysia` },
  { value: "SG", label: `${countryFlag("SG")} Singapore` },
  { value: "BN", label: `${countryFlag("BN")} Brunei` },
  { value: "JP", label: `${countryFlag("JP")} Japan` },
  { value: "KR", label: `${countryFlag("KR")} Korea` },
  { value: "CN", label: `${countryFlag("CN")} China` },
  { value: "US", label: `${countryFlag("US")} United States` },
];

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
  mlbb?: { players: Player[] };
  efootball?: { players: Player[] };
  games?: Record<string, { players: Player[] }>;
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
    id: uid(game),
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
          const tenures = p.tenures ?? [];
          const setTenure = (idx: number, key: "joined" | "left", v: string) => {
            const val = v.trim();
            const next = tenures.map((tn, j) => {
              if (j !== idx) return tn;
              if (key === "left") {
                const { left: _drop, ...rest } = tn;
                return val ? { ...rest, left: val } : rest;
              }
              return { ...tn, joined: val };
            });
            onPatch(i, { tenures: next.length ? next : undefined });
          };
          const addTenure = () => onPatch(i, { tenures: [...tenures, { joined: "" }] });
          const removeTenure = (idx: number) => {
            const next = tenures.filter((_, j) => j !== idx);
            onPatch(i, { tenures: next.length ? next : undefined });
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
              <TextField
                label="วันเกิด / Birth date"
                type="date"
                value={p.birthDate ?? ""}
                onChange={(v) => onPatch(i, { birthDate: v || undefined })}
              />
              <SelectField
                label="เลือกธง / Flag"
                value={p.countryCode ?? ""}
                onChange={(v) => onPatch(i, { countryCode: v.trim().toUpperCase() || undefined })}
                options={FLAG_OPTIONS}
              />
              <div className="md:col-span-2">
                <BilingualField
                  label="ชื่อประเทศ / Country name"
                  value={p.country ?? { en: "", lo: "" }}
                  onChange={(v) =>
                    onPatch(i, {
                      country: v.en?.trim() || v.lo?.trim() ? v : undefined,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>ระยะเวลาในทีม — เพิ่มได้หลายช่วง (ออกแล้วกลับมาก็กด “เพิ่มช่วงเวลา”)</Label>
                <div className="mt-2 space-y-2">
                  {tenures.map((tn, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <TextField
                        label="เข้าทีม (ปป-ดด-วว)"
                        value={tn.joined ?? ""}
                        onChange={(v) => setTenure(idx, "joined", v)}
                        placeholder="2021-12-01"
                      />
                      <TextField
                        label="ออกจากทีม (เว้นว่าง = ปัจจุบัน)"
                        value={tn.left ?? ""}
                        onChange={(v) => setTenure(idx, "left", v)}
                        placeholder="2024-05-20"
                      />
                      <Button variant="danger" onClick={() => removeTenure(idx)}>
                        ลบ
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addTenure}>+ เพิ่มช่วงเวลา</Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <TextField
                  label="อีเมล (ไม่บังคับ — ใส่แล้วจะมีปุ่มก๊อปปี้อีเมลในโปรไฟล์)"
                  value={p.email ?? ""}
                  onChange={(v) => onPatch(i, { email: v.trim() || undefined })}
                  placeholder="name@niightmare.gg"
                />
              </div>

              <div className="md:col-span-2">
                <TextField
                  label="ลิงก์ Liquipedia (ไม่บังคับ — เว้นว่าง = ไม่โชว์ปุ่มในโปรไฟล์)"
                  value={p.liquipedia ?? ""}
                  onChange={(v) => onPatch(i, { liquipedia: v.trim() || undefined })}
                  placeholder="https://liquipedia.net/mobilelegends/PlayerName"
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

/**
 * A staff section. Used twice: "coach" variant under each game lineup (no row
 * picker — the section's game is what places them), and "office" variant for the
 * back-office team (adds a row picker so each person's tier is chosen directly).
 * Operates by member id so it works on a filtered slice of the flat staff array.
 */
function StaffList({
  title,
  members,
  variant,
  addLabel,
  onAdd,
  onMove,
  onDelete,
  onPatch,
  onSocial,
}: {
  title: string;
  members: StaffMember[];
  variant: "coach" | "office";
  addLabel: string;
  onAdd: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
  onPatch: (id: string, patch: Partial<StaffMember>) => void;
  onSocial: (id: string, key: keyof StaffMember["socials"], val: string) => void;
}) {
  return (
    <Section title={title} action={<Button onClick={onAdd}>{addLabel}</Button>}>
      <div className="space-y-4">
        {members.length === 0 && (
          <p className="font-mono text-xs text-ash">— ยังไม่มีรายชื่อ —</p>
        )}
        {members.map((s) => (
          <Card key={s.id}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-spectre">{s.name || "—"}</span>
              <div className="flex items-center gap-1.5">
                <Button onClick={() => onMove(s.id, -1)}>↑</Button>
                <Button onClick={() => onMove(s.id, 1)}>↓</Button>
                <Button variant="danger" onClick={() => onDelete(s.id)}>
                  ลบ
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="ชื่อจริง" value={s.name ?? ""} onChange={(v) => onPatch(s.id, { name: v })} />
              <TextField
                label="ชื่อเล่น / Nickname (ไม่บังคับ)"
                value={s.ign ?? ""}
                onChange={(v) => onPatch(s.id, { ign: v || undefined })}
              />
              {variant === "coach" && (
                <div className="md:col-span-2">
                  <SelectField
                    label="ตำแหน่งทางการ (จัดลำดับแถวอัตโนมัติ)"
                    value={staffRoleKey(s)}
                    onChange={(v) => onPatch(s.id, { officialRole: v as StaffMember["officialRole"] })}
                    options={COACH_ROLE_OPTIONS}
                  />
                </div>
              )}
              {variant === "office" && (
                <div className="md:col-span-2">
                  <SelectField
                    label="อยู่แถวไหน (เลือกเองได้)"
                    value={s.tier ? String(s.tier) : ""}
                    onChange={(v) => onPatch(s.id, { tier: v ? (Number(v) as 1 | 2 | 3) : undefined })}
                    options={TIER_OPTIONS}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <BilingualField
                  label={variant === "office" ? "Role (ตำแหน่งที่แสดงบนการ์ด) — EN + ລາວ" : "ตำแหน่งที่แสดงบนการ์ด (Display)"}
                  value={s.role}
                  onChange={(v) => onPatch(s.id, { role: v })}
                />
              </div>
              <SelectField
                label="เลือกธง / Flag"
                value={s.countryCode ?? ""}
                onChange={(v) => onPatch(s.id, { countryCode: v.trim().toUpperCase() || undefined })}
                options={FLAG_OPTIONS}
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <BilingualField
                  label="ชื่อประเทศ / Country name"
                  value={s.country ?? { en: "", lo: "" }}
                  onChange={(v) =>
                    onPatch(s.id, {
                      country: v.en?.trim() || v.lo?.trim() ? v : undefined,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <BilingualField
                  label="หน้าที่รับผิดชอบ (Responsibility / Bio)"
                  value={s.bio ?? { en: "", lo: "" }}
                  onChange={(v) => onPatch(s.id, { bio: v.en || v.lo ? v : undefined })}
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="อีเมลธุรกิจ (ไม่บังคับ — เว้นว่าง = ใช้อีเมลกลางของสโมสร)"
                  value={s.email ?? ""}
                  onChange={(v) => onPatch(s.id, { email: v.trim() || undefined })}
                  placeholder="name@niightmare.gg"
                />
              </div>
              <div className="md:col-span-2">
                <ImageField
                  label="รูปทีมงาน"
                  value={s.photo}
                  folder="staff"
                  onChange={(path) => onPatch(s.id, { photo: path || undefined })}
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
                        onChange={(e) => onSocial(s.id, k, e.target.value)}
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
  );
}

export default function RosterEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<RosterFile>("roster");
  const site = useContent().site as { games?: unknown };
  const [view, setView] = useState<"page" | "players" | "staff">("players");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const page = pageCopy(data.page);
  const dataGames: Record<string, { players: Player[] }> = {
    mlbb: data.mlbb ?? { players: [] },
    efootball: data.efootball ?? { players: [] },
    ...(data.games ?? {}),
  };
  const gameDefinitions = enabledGames(site.games, [
    ...Object.keys(dataGames),
    ...data.staff.map((member) => memberGame(member)).filter((id): id is string => Boolean(id)),
  ]);
  const setPage = (next: RosterPageCopy) => setData({ ...data, page: next });
  const patchPage = (patch: Partial<RosterPageCopy>) => setPage({ ...page, ...patch });

  const setPlayers = (game: GameId, next: Player[]) =>
    setData({ ...data, games: { ...dataGames, [game]: { players: next } } });
  const patchPlayer = (game: GameId, i: number, patch: Partial<Player>) =>
    setPlayers(game, (dataGames[game]?.players ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setSocial = (game: GameId, i: number, key: keyof Player["socials"], val: string) => {
    const p = dataGames[game]?.players[i];
    if (!p) return;
    const socials = { ...p.socials };
    const v = val.trim();
    if (!v || v === "#") delete socials[key];
    else socials[key] = v;
    patchPlayer(game, i, { socials });
  };

  // Staff is one flat array; coaches (game set) are edited under their game,
  // the rest under the back-office tab. Operate by id so a filtered slice works.
  const backOffice = data.staff.filter((m) => !memberGame(m));
  const coachesOf = (game: GameId) => data.staff.filter((m) => memberGame(m) === game);

  const patchStaffId = (id: string, patch: Partial<StaffMember>) =>
    setData({ ...data, staff: data.staff.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const deleteStaffId = (id: string) =>
    setData({ ...data, staff: data.staff.filter((m) => m.id !== id) });
  const setStaffSocialId = (id: string, key: keyof StaffMember["socials"], val: string) => {
    const m = data.staff.find((x) => x.id === id);
    if (!m) return;
    const socials = { ...m.socials };
    const v = val.trim();
    if (!v || v === "#") delete socials[key];
    else socials[key] = v;
    patchStaffId(id, { socials });
  };
  /** Reorder within a group by swapping with the prev/next member of that group. */
  const moveStaffInGroup = (group: StaffMember[], id: string, dir: -1 | 1) => {
    const target = group[group.findIndex((m) => m.id === id) + dir];
    if (!target) return;
    const a = data.staff.findIndex((m) => m.id === id);
    const b = data.staff.findIndex((m) => m.id === target.id);
    const next = data.staff.slice();
    [next[a], next[b]] = [next[b], next[a]];
    setData({ ...data, staff: next });
  };
  const addStaff = (extra: Partial<StaffMember>) =>
    setData({
      ...data,
      staff: [...data.staff, { id: uid("staff"), name: "", role: { en: "", lo: "" }, socials: {}, ...extra }],
    });

  const sectionProps = (game: GameId) => ({
    players: dataGames[game]?.players ?? [],
    onAdd: () => setPlayers(game, [...(dataGames[game]?.players ?? []), emptyPlayer(game)]),
    onMove: (i: number, dir: -1 | 1) => setPlayers(game, move(dataGames[game]?.players ?? [], i, dir)),
    onDelete: (i: number) => setPlayers(game, (dataGames[game]?.players ?? []).filter((_, idx) => idx !== i)),
    onPatch: (i: number, patch: Partial<Player>) => patchPlayer(game, i, patch),
    onSocial: (i: number, key: keyof Player["socials"], val: string) => setSocial(game, i, key, val),
  });

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          {gameDefinitions.map((game) => `${game.shortName} ${dataGames[game.id]?.players.length ?? 0}`).join(" · ")} · ทีมงาน {data.staff.length}
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
          { id: "page", label: "หน้า Team (Page)", count: 8 },
          { id: "players", label: "นักกีฬา + โค้ช (Players)", count: gameDefinitions.reduce((sum, game) => sum + (dataGames[game.id]?.players.length ?? 0), 0) + (data.staff.length - backOffice.length) },
          { id: "staff", label: "ทีมหลังบ้าน (Staff)", count: backOffice.length },
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
          <Section title="Team page copy" hint="ข้อความบนหน้า Team (/roster) — แก้ได้โดยไม่ต้อง deploy">
            <Card>
            <div className="grid gap-3">
              <BilingualField label="Hero title" value={page.title} onChange={(v) => patchPage({ title: v })} />
              <BilingualField label="Hero intro" value={page.intro} onChange={(v) => patchPage({ intro: v })} />
              <BilingualField label="Staff heading" value={page.staffLabel} onChange={(v) => patchPage({ staffLabel: v })} />
            </div>
            </Card>
          </Section>

          <Section title="Navigation labels" hint="Labels ของ tab เกมและ tier ทีมงานบนหน้า Team">
            <Card>
            <div className="grid gap-3 md:grid-cols-2">
              {gameDefinitions.map((game) => (
                <BilingualField
                  key={game.id}
                  label={`${game.shortName} tab`}
                  value={page.divisionLabels[game.id] ?? game.name}
                  onChange={(v) => patchPage({ divisionLabels: { ...page.divisionLabels, [game.id]: v } })}
                />
              ))}
              <BilingualField
                label="Investor / Founder tier"
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

        </section>
      )}

      {view === "players" && (
        <>
          {gameDefinitions.map((game) => (
            <React.Fragment key={game.id}>
              <PlayerList title={`ทีม ${game.shortName}`} {...sectionProps(game.id)} />
              <StaffList
                title={`โค้ช ${game.shortName}`}
                members={coachesOf(game.id)}
                variant="coach"
                addLabel={`+ เพิ่มโค้ช ${game.shortName}`}
                onAdd={() => addStaff({ game: game.id, officialRole: "head_coach" })}
                onMove={(id, dir) => moveStaffInGroup(coachesOf(game.id), id, dir)}
                onDelete={deleteStaffId}
                onPatch={patchStaffId}
                onSocial={setStaffSocialId}
              />
            </React.Fragment>
          ))}
        </>
      )}

      {view === "staff" && (
        <StaffList
          title="ทีมหลังบ้าน (Staff)"
          members={backOffice}
          variant="office"
          addLabel="+ เพิ่มทีมงาน"
          onAdd={() => addStaff({})}
          onMove={(id, dir) => moveStaffInGroup(backOffice, id, dir)}
          onDelete={deleteStaffId}
          onPatch={patchStaffId}
          onSocial={setStaffSocialId}
        />
      )}
    </div>
  );
}
