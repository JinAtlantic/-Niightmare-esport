"use client";

import React from "react";
import { BilingualField, Collapsible, SelectField, TextArea, TextField } from "@/components/admin/ui";
import type { Bilingual } from "@/lib/types";
import type { RoadmapContent, RoadmapStage, RoadmapStageStatus } from "@/lib/roadmap";

const STATUS_OPTS: { value: RoadmapStageStatus; label: string }[] = [
  { value: "past", label: "แข่งแล้ว" },
  { value: "active", label: "กำลังแข่ง" },
  { value: "future", label: "งานถัดไป" },
];

const subhead = "font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre";

function BilingualTextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  rows?: number;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
        {label}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <TextArea label="EN" value={value.en} rows={rows} onChange={(en) => onChange({ ...value, en })} />
        <TextArea label="ລາວ" value={value.lo} rows={rows} onChange={(lo) => onChange({ ...value, lo })} />
      </div>
    </div>
  );
}

export default function RoadmapEditor({
  value,
  onChange,
}: {
  value: RoadmapContent;
  onChange: (v: RoadmapContent) => void;
}) {
  const patchHero = (p: Partial<RoadmapContent["hero"]>) =>
    onChange({ ...value, hero: { ...value.hero, ...p } });

  const patchHalf = (halfIndex: number, p: Partial<RoadmapContent["halves"][number]>) =>
    onChange({
      ...value,
      halves: value.halves.map((half, index) => (index === halfIndex ? { ...half, ...p } : half)),
    });

  const patchStage = (halfIndex: number, stageIndex: number, p: Partial<RoadmapStage>) => {
    const half = value.halves[halfIndex];
    patchHalf(halfIndex, {
      stages: half.stages.map((stage, index) => (index === stageIndex ? { ...stage, ...p } : stage)),
    });
  };

  const patchStageStatus = (
    halfIndex: number,
    stageIndex: number,
    status: RoadmapStageStatus,
  ) => {
    const selectedId = value.halves[halfIndex].stages[stageIndex].id;
    const activeStageId =
      status === "active"
        ? selectedId
        : value.activeStageId === selectedId
          ? ""
          : value.activeStageId;

    onChange({
      ...value,
      activeStageId,
      halves: value.halves.map((half, currentHalfIndex) => ({
        ...half,
        stages: half.stages.map((stage, currentStageIndex) => {
          if (currentHalfIndex === halfIndex && currentStageIndex === stageIndex) {
            return { ...stage, status };
          }
          return status === "active" && stage.status === "active"
            ? { ...stage, status: "future" as const }
            : stage;
        }),
      })),
    });
  };

  return (
    <div className="space-y-4">
      <Collapsible title="Popup settings" hint="ปุ่มเปิด popup และหัวข้อ Roadmap" defaultOpen>
        <div className="space-y-3">
        <h3 className={subhead}>Popup</h3>
        <BilingualField label="Button label" value={value.buttonLabel} onChange={(buttonLabel) => onChange({ ...value, buttonLabel })} />
        <BilingualField label="Hero title" value={value.hero.title} onChange={(title) => patchHero({ title })} />
        <BilingualTextArea label="Hero intro" value={value.hero.intro} onChange={(intro) => patchHero({ intro })} rows={3} />
        </div>
      </Collapsible>

      {value.halves.map((half, halfIndex) => (
        <Collapsible key={half.id} title={`${half.id.toUpperCase()} Roadmap`} hint="แก้ tab และ tournament stages">
          <div className="space-y-4">
          <h3 className={subhead}>{half.id.toUpperCase()} Roadmap</h3>
          <BilingualField label="Tab label" value={half.tab} onChange={(tab) => patchHalf(halfIndex, { tab })} />

          {half.stages.map((stage, stageIndex) => (
            <div key={stage.id} className="space-y-3 border border-edge bg-void/40 p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Tag" value={stage.tag} onChange={(tag) => patchStage(halfIndex, stageIndex, { tag })} />
                <SelectField
                  label="สถานะบน Roadmap"
                  value={stage.status}
                  onChange={(status) => patchStageStatus(halfIndex, stageIndex, status as RoadmapStageStatus)}
                  options={STATUS_OPTS}
                />
              </div>
              <BilingualField label="Title" value={stage.title} onChange={(title) => patchStage(halfIndex, stageIndex, { title })} />
              <BilingualField label="Window" value={stage.window} onChange={(window) => patchStage(halfIndex, stageIndex, { window })} />
              <label className="flex items-center gap-2 font-mono text-[11px] text-ash">
                <input
                  type="checkbox"
                  checked={!!stage.destination}
                  onChange={(e) => patchStage(halfIndex, stageIndex, { destination: e.target.checked || undefined })}
                  className="h-4 w-4 accent-amethyst"
                />
                Destination card
              </label>
            </div>
          ))}
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
