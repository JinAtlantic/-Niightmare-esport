"use client";

import React from "react";
import { BilingualField, Button, Card, SelectField, TextArea } from "@/components/admin/ui";
import type {
  MlbbEsportSystemContent,
  MlbbSystemCalendarStep,
  MlbbSystemPillar,
  MlbbSystemPillarAccent,
} from "@/lib/mlbbEsportSystem";
import type { Bilingual } from "@/lib/types";

const ACCENT_OPTS: { value: MlbbSystemPillarAccent; label: string }[] = [
  { value: "national", label: "National / Violet" },
  { value: "mekong", label: "Mekong / Cyan" },
  { value: "global", label: "Global / Gold" },
];

const subhead = "font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre";

const emptyBi = (): Bilingual => ({ en: "", lo: "" });

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

export default function MlbbEsportSystemEditor({
  value,
  onChange,
}: {
  value: MlbbEsportSystemContent;
  onChange: (v: MlbbEsportSystemContent) => void;
}) {
  const patchHero = (p: Partial<MlbbEsportSystemContent["hero"]>) =>
    onChange({ ...value, hero: { ...value.hero, ...p } });

  const patchTabs = (p: Partial<MlbbEsportSystemContent["tabs"]>) =>
    onChange({ ...value, tabs: { ...value.tabs, ...p } });

  const patchPillar = (i: number, p: Partial<MlbbSystemPillar>) =>
    onChange({ ...value, pillars: value.pillars.map((pillar, idx) => (idx === i ? { ...pillar, ...p } : pillar)) });

  const patchCalendar = (i: number, p: Partial<MlbbSystemCalendarStep>) =>
    onChange({ ...value, calendar: value.calendar.map((step, idx) => (idx === i ? { ...step, ...p } : step)) });

  const patchPillarDetail = (i: number, k: number, detail: Bilingual) =>
    patchPillar(i, {
      details: value.pillars[i].details.map((item, idx) => (idx === k ? detail : item)),
    });

  const addPillarDetail = (i: number) =>
    patchPillar(i, { details: [...value.pillars[i].details, emptyBi()] });

  const removePillarDetail = (i: number, k: number) =>
    patchPillar(i, { details: value.pillars[i].details.filter((_, idx) => idx !== k) });

  const patchCalendarTag = (i: number, k: number, tag: Bilingual) =>
    patchCalendar(i, {
      tags: value.calendar[i].tags.map((item, idx) => (idx === k ? tag : item)),
    });

  const addCalendarTag = (i: number) =>
    patchCalendar(i, { tags: [...value.calendar[i].tags, emptyBi()] });

  const removeCalendarTag = (i: number, k: number) =>
    patchCalendar(i, { tags: value.calendar[i].tags.filter((_, idx) => idx !== k) });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h3 className={subhead}>Popup Button + Hero</h3>
        <BilingualField label="ຊື່ປຸ່ມໃນໜ້າ Match" value={value.buttonLabel} onChange={(buttonLabel) => onChange({ ...value, buttonLabel })} />
        <BilingualField label="Kicker" value={value.hero.kicker} onChange={(kicker) => patchHero({ kicker })} />
        <BilingualField label="Title" value={value.hero.title} onChange={(title) => patchHero({ title })} />
        <BilingualTextArea label="Intro" value={value.hero.intro} onChange={(intro) => patchHero({ intro })} rows={4} />
        <BilingualField label="Badge" value={value.hero.badge} onChange={(badge) => patchHero({ badge })} />
      </Card>

      <Card className="space-y-3">
        <h3 className={subhead}>Tabs</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <BilingualField label="Tab 1" value={value.tabs.pillars} onChange={(pillars) => patchTabs({ pillars })} />
          <BilingualField label="Tab 2" value={value.tabs.calendar} onChange={(calendar) => patchTabs({ calendar })} />
        </div>
      </Card>

      {value.pillars.map((pillar, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className={subhead}>3 Pillars - {i + 1}</h3>
            <SelectField
              label="Accent"
              value={pillar.accent}
              onChange={(accent) => patchPillar(i, { accent: accent as MlbbSystemPillarAccent })}
              options={ACCENT_OPTS}
              className="w-56"
            />
          </div>
          <BilingualField label="Eyebrow" value={pillar.eyebrow} onChange={(eyebrow) => patchPillar(i, { eyebrow })} />
          <BilingualField label="Title" value={pillar.title} onChange={(title) => patchPillar(i, { title })} />
          <BilingualField label="Subtitle" value={pillar.subtitle} onChange={(subtitle) => patchPillar(i, { subtitle })} />
          <BilingualTextArea label="Body" value={pillar.body} onChange={(body) => patchPillar(i, { body })} rows={4} />
          <div className="space-y-2 border-t border-edge pt-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wide text-spectre">Key Details</h4>
              <Button onClick={() => addPillarDetail(i)}>+ Add</Button>
            </div>
            {pillar.details.map((detail, k) => (
              <div key={k} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <BilingualField label={`Detail ${k + 1}`} value={detail} onChange={(next) => patchPillarDetail(i, k, next)} />
                <Button variant="danger" onClick={() => removePillarDetail(i, k)} className="self-end">
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {value.calendar.map((step, i) => (
        <Card key={i} className="space-y-3">
          <h3 className={subhead}>Annual Calendar - {step.quarter || i + 1}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ash">
                Quarter
              </span>
              <input
                className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-sm text-soul outline-none transition-colors focus:border-amethyst"
                value={step.quarter}
                onChange={(e) => patchCalendar(i, { quarter: e.target.value })}
              />
            </label>
            <BilingualField label="Window" value={step.window} onChange={(window) => patchCalendar(i, { window })} />
          </div>
          <BilingualField label="Title" value={step.title} onChange={(title) => patchCalendar(i, { title })} />
          <BilingualTextArea label="Body" value={step.body} onChange={(body) => patchCalendar(i, { body })} rows={4} />
          <div className="space-y-2 border-t border-edge pt-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wide text-spectre">Tags</h4>
              <Button onClick={() => addCalendarTag(i)}>+ Add</Button>
            </div>
            {step.tags.map((tag, k) => (
              <div key={k} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <BilingualField label={`Tag ${k + 1}`} value={tag} onChange={(next) => patchCalendarTag(i, k, next)} />
                <Button variant="danger" onClick={() => removeCalendarTag(i, k)} className="self-end">
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <BilingualTextArea
          label="Sponsor note"
          value={value.sponsorNote}
          onChange={(sponsorNote) => onChange({ ...value, sponsorNote })}
          rows={3}
        />
      </Card>
    </div>
  );
}
