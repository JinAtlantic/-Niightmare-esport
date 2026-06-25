"use client";

import React from "react";
import { BilingualField, Card, SelectField, TextArea, TextField } from "@/components/admin/ui";
import type { Bilingual } from "@/lib/types";
import type { RoadmapContent, RoadmapStage, RoadmapStageStatus } from "@/lib/roadmap";

const STATUS_OPTS: { value: RoadmapStageStatus; label: string }[] = [
  { value: "past", label: "Past / Cleared" },
  { value: "active", label: "Active / Current Battleground" },
  { value: "future", label: "Future / Locked" },
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

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h3 className={subhead}>Popup + Active Card</h3>
        <BilingualField label="Button label" value={value.buttonLabel} onChange={(buttonLabel) => onChange({ ...value, buttonLabel })} />
        <BilingualField label="Hero title" value={value.hero.title} onChange={(title) => patchHero({ title })} />
        <BilingualTextArea label="Hero intro" value={value.hero.intro} onChange={(intro) => patchHero({ intro })} rows={3} />
        <TextField
          label="Active stage ID (example: h1-wild-card, h1-destination, h2-wild-card)"
          value={value.activeStageId}
          onChange={(activeStageId) => onChange({ ...value, activeStageId })}
        />
        <BilingualField label="Active label" value={value.activeLabel} onChange={(activeLabel) => onChange({ ...value, activeLabel })} />
      </Card>

      {value.halves.map((half, halfIndex) => (
        <Card key={half.id} className="space-y-4">
          <h3 className={subhead}>{half.id.toUpperCase()} Roadmap</h3>
          <BilingualField label="Tab label" value={half.tab} onChange={(tab) => patchHalf(halfIndex, { tab })} />
          <BilingualField label="Kicker" value={half.kicker} onChange={(kicker) => patchHalf(halfIndex, { kicker })} />
          <BilingualField label="Title" value={half.title} onChange={(title) => patchHalf(halfIndex, { title })} />
          <BilingualTextArea label="Goal" value={half.goal} onChange={(goal) => patchHalf(halfIndex, { goal })} rows={3} />

          {half.stages.map((stage, stageIndex) => (
            <div key={stage.id} className="space-y-3 border border-edge bg-void/40 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="Stage ID" value={stage.id} onChange={(id) => patchStage(halfIndex, stageIndex, { id })} />
                <TextField label="Tag" value={stage.tag} onChange={(tag) => patchStage(halfIndex, stageIndex, { tag })} />
                <SelectField
                  label="Status"
                  value={stage.status}
                  onChange={(status) => patchStage(halfIndex, stageIndex, { status: status as RoadmapStageStatus })}
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
        </Card>
      ))}
    </div>
  );
}
