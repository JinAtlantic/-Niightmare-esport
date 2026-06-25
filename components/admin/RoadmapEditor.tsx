"use client";

import React from "react";
import { Button, Card, BilingualField, SelectField, TextField } from "@/components/admin/ui";
import type {
  RoadmapContent,
  RoadmapStatus,
  RoadmapStep,
  RoadmapTier,
} from "@/lib/roadmap";

const TIER_OPTS = [
  { value: "C", label: "C-Tier" },
  { value: "B", label: "B-Tier" },
  { value: "A", label: "A-Tier" },
  { value: "S", label: "S-Tier" },
];

const STATUS_OPTS = [
  { value: "done", label: "ผ่านแล้ว (Cleared)" },
  { value: "active", label: "กำลังแข่ง (Live Now)" },
  { value: "eliminated", label: "ตกรอบ (Eliminated)" },
  { value: "upcoming", label: "รอบต่อไป (Up Next)" },
  { value: "locked", label: "ยังไม่ถึง (Locked)" },
];

const EMPTY_STEP: RoadmapStep = {
  tournament: { en: "", lo: "" },
  stage: { en: "", lo: "" },
  tier: "B",
  window: "",
  location: { en: "", lo: "" },
  status: "upcoming",
};

const subhead = "font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre";

/**
 * Admin editor for the Matches-page Esports Roadmap (site.roadmap). Edits the
 * "where we stand" banner and every stage (tournament, tier, dates, location,
 * prize, status, note), with add / remove / reorder.
 */
export default function RoadmapEditor({
  value,
  onChange,
}: {
  value: RoadmapContent;
  onChange: (v: RoadmapContent) => void;
}) {
  const patchNow = (p: Partial<RoadmapContent["now"]>) =>
    onChange({ ...value, now: { ...value.now, ...p } });

  const patchStep = (i: number, p: Partial<RoadmapStep>) =>
    onChange({ ...value, steps: value.steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });

  const addStep = () => onChange({ ...value, steps: [...value.steps, { ...EMPTY_STEP }] });
  const removeStep = (i: number) =>
    onChange({ ...value, steps: value.steps.filter((_, idx) => idx !== i) });
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.steps.length) return;
    const steps = [...value.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    onChange({ ...value, steps });
  };

  return (
    <div className="space-y-4">
      {/* banner */}
      <Card className="space-y-3">
        <h3 className={subhead}>แบนเนอร์ “สถานะปัจจุบัน”</h3>
        <BilingualField label="Kicker (เช่น WHERE WE STAND)" value={value.now.kicker} onChange={(kicker) => patchNow({ kicker })} />
        <BilingualField label="หัวข้อใหญ่ (Headline)" value={value.now.headline} onChange={(headline) => patchNow({ headline })} />
        <BilingualField label="คำอธิบายสั้น (Blurb)" value={value.now.blurb} onChange={(blurb) => patchNow({ blurb })} />
        <BilingualField label="ป้ายสถานะ (เช่น UP NEXT · MSC 2026)" value={value.now.state} onChange={(state) => patchNow({ state })} />
      </Card>

      {/* steps */}
      {value.steps.map((step, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className={subhead}>ขั้นที่ {i + 1}</h3>
            <div className="flex gap-1.5">
              <Button onClick={() => moveStep(i, -1)} disabled={i === 0}>↑</Button>
              <Button onClick={() => moveStep(i, 1)} disabled={i === value.steps.length - 1}>↓</Button>
              <Button variant="danger" onClick={() => removeStep(i)}>ลบ</Button>
            </div>
          </div>

          <BilingualField label="ชื่อทัวร์นาเมนต์" value={step.tournament} onChange={(tournament) => patchStep(i, { tournament })} />
          <BilingualField label="ประเภท / รอบ (Stage)" value={step.stage} onChange={(stage) => patchStep(i, { stage })} />

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField label="Tier (Liquipedia)" value={step.tier} onChange={(v) => patchStep(i, { tier: v as RoadmapTier })} options={TIER_OPTS} />
            <SelectField label="สถานะของทีม" value={step.status} onChange={(v) => patchStep(i, { status: v as RoadmapStatus })} options={STATUS_OPTS} />
          </div>

          <TextField label="ช่วงเวลา (เช่น Jul 1 – Aug 1, 2026)" value={step.window} onChange={(window) => patchStep(i, { window })} placeholder="Jul 1 – Aug 1, 2026" />
          <BilingualField label="สถานที่" value={step.location} onChange={(location) => patchStep(i, { location })} />
          <TextField
            label="เงินรางวัล (เว้นว่างได้ — เช่น $3,000,000)"
            value={step.prize ?? ""}
            onChange={(v) => patchStep(i, { prize: v.trim() ? v : undefined })}
            placeholder="$3,000,000"
          />
          <BilingualField
            label="โน้ตสถานะ (เว้นว่างได้)"
            value={step.note ?? { en: "", lo: "" }}
            onChange={(note) => patchStep(i, { note: note.en.trim() || note.lo.trim() ? note : undefined })}
          />

          <label className="flex items-center gap-2 font-mono text-[11px] text-ash">
            <input
              type="checkbox"
              checked={!!step.apex}
              onChange={(e) => patchStep(i, { apex: e.target.checked || undefined })}
              className="h-4 w-4 accent-amethyst"
            />
            ขั้นสูงสุด — แสดงมงกุฎทอง (Apex)
          </label>
        </Card>
      ))}

      <Button variant="primary" onClick={addStep}>+ เพิ่มขั้น</Button>
    </div>
  );
}
