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
import OpponentLogo from "@/components/OpponentLogo";
import type { UpcomingMatch } from "@/lib/types";

/** site.json — we only edit `upcomingMatch`; everything else is preserved. */
interface SiteFile {
  upcomingMatch: UpcomingMatch;
  [key: string]: unknown;
}

const STATUS_OPTS = [
  { value: "next", label: "นัดต่อไป (Next)" },
  { value: "live", label: "กำลังแข่ง (Live)" },
  { value: "practice", label: "ช่วงซ้อมทีม (Practice)" },
];
const GAME_OPTS = [
  { value: "mlbb", label: "MLBB" },
  { value: "efootball", label: "eFootball" },
];
const STATUS_TH: Record<string, string> = {
  next: "นัดต่อไป",
  live: "กำลังแข่ง",
  practice: "ช่วงซ้อมทีม",
};

// stored ISO "2025-06-20T19:00:00+07:00" ↔ datetime-local "2025-06-20T19:00"
const toLocalInput = (iso: string) => (iso || "").slice(0, 16);
const fromLocalInput = (v: string) => (v ? `${v}:00+07:00` : "");

export default function HomeEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<SiteFile>("site");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const m = data.upcomingMatch;
  const patch = (p: Partial<UpcomingMatch>) =>
    setData({ ...data, upcomingMatch: { ...m, ...p } });

  const isPractice = m.status === "practice";

  return (
    <div className="space-y-8">
      {/* save bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          สถานะ: <span className="text-spectre">{STATUS_TH[m.status] ?? m.status}</span>
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

      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            นัดต่อไป (หน้า Home)
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            แก้ไขการ์ดการแข่งขันที่โชว์เด่นอยู่หน้าแรก
          </p>
        </div>

        <Card>
          {/* live preview line */}
          <div className="mb-4 flex items-center gap-3 border-b border-edge pb-4">
            <OpponentLogo src="/logo.png" name="NM" size={32} />
            <span className="font-mono text-xs text-ash-dim">vs</span>
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={32} />
            <span className="font-mono text-xs text-spectre">
              {m.opponent || (isPractice ? "ซ้อมทีม" : "—")}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="สถานะ"
              value={m.status}
              onChange={(v) => patch({ status: v as UpcomingMatch["status"] })}
              options={STATUS_OPTS}
            />
            <SelectField
              label="เกม (งาน)"
              value={m.game}
              onChange={(v) => patch({ game: v as UpcomingMatch["game"] })}
              options={GAME_OPTS}
            />
            <div className="md:col-span-2">
              <TextField
                label="วันและเวลาแข่ง (เวลาลาว/ไทย +07:00)"
                type="datetime-local"
                value={toLocalInput(m.date)}
                onChange={(v) => patch({ date: fromLocalInput(v) })}
              />
            </div>
            <div className="md:col-span-2">
              <BilingualField
                label="งาน / ทัวร์นาเมนต์"
                value={m.tournament}
                onChange={(v) => patch({ tournament: v })}
              />
            </div>
            <div className="md:col-span-2">
              <BilingualField
                label="รอบการแข่งขัน (เช่น รอบรองชนะเลิศ — เว้นว่างได้)"
                value={m.round ?? { en: "", lo: "" }}
                onChange={(v) => patch({ round: v })}
              />
            </div>
            <TextField
              label={isPractice ? "ทีมที่ซ้อมด้วย (เว้นว่างได้)" : "ทีมคู่แข่ง"}
              value={m.opponent}
              onChange={(v) => patch({ opponent: v })}
              placeholder="เช่น Vientiane Vipers"
            />
            <div className="md:col-span-2">
              <ImageField
                label="โลโก้คู่แข่ง"
                value={m.opponentLogo}
                folder="teams"
                onChange={(p) => patch({ opponentLogo: p || undefined })}
              />
            </div>
          </div>

          {isPractice && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-ash">
              โหมด “ช่วงซ้อมทีม”: ถ้าเว้นชื่อทีมคู่แข่งไว้ การ์ดจะโชว์เป็น “TEAM
              PRACTICE” แทนการ vs ทีมอื่น
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
