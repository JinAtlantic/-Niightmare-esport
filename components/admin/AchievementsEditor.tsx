"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  BilingualField,
  Button,
  Card,
  Section,
  SelectField,
  TextField,
} from "@/components/admin/ui";
import achievementsSeed from "@/data/achievements.json";
import type {
  AchievementsData,
  AchievementStaff,
  AchievementStat,
  CampaignEntry,
  FormerPlayer,
  Medal,
  PlacementSummaryRow,
  PlacementSummaryTier,
  TournamentTier,
  Trophy,
} from "@/lib/types";

const seed = achievementsSeed as AchievementsData;
const tierOptions: { value: TournamentTier; label: string }[] = ["S", "A", "B", "C"].map((tier) => ({
  value: tier as TournamentTier,
  label: `${tier}-Tier`,
}));
const medalOptions = [
  { value: "", label: "None" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
];
const placementTierOptions: { value: PlacementSummaryTier; label: string }[] = [
  { value: "S", label: "S-Tier" },
  { value: "A", label: "A-Tier" },
  { value: "B", label: "B-Tier" },
  { value: "C", label: "C-Tier" },
  { value: "Total", label: "Total" },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function move<T>(items: T[], index: number, dir: -1 | 1) {
  const next = [...items];
  const to = index + dir;
  if (to < 0 || to >= next.length) return next;
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

function num(value: string) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function SaveBar({
  count,
  saving,
  error,
  savedAt,
  onSave,
}: {
  count: string;
  saving: boolean;
  error: string;
  savedAt: number | null;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex flex-col items-start justify-between gap-2 border-b border-edge bg-void/95 px-4 py-2 backdrop-blur md:-mx-6 md:flex-row md:items-center md:px-6">
      <p className="font-mono text-xs text-ash">{count}</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
        {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">Saved</span>}
        <a href="/achievements" target="_blank" rel="noopener noreferrer">
          <Button className="min-h-[34px] px-3 py-1">Preview</Button>
        </a>
        <Button onClick={onSave} disabled={saving} className="min-h-[34px] px-3 py-1">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function AchievementsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<AchievementsData>("achievements");

  if (loading) return <p className="font-mono text-sm text-ash">Loading...</p>;
  if (!data) return <p className="font-mono text-sm text-loss">{error || "No achievements data"}</p>;

  const page = data.page ?? seed.page;
  const stats = data.stats ?? [];
  const trophies = data.trophies ?? [];
  const placementSummary = data.placementSummary ?? seed.placementSummary ?? [];
  const campaign = data.campaign ?? [];
  const formerPlayers = data.formerPlayers ?? [];
  const staff = data.staff ?? [];

  const patch = (next: Partial<AchievementsData>) => setData({ ...data, ...next });
  const patchStat = (index: number, value: Partial<AchievementStat>) =>
    patch({ stats: stats.map((item, i) => (i === index ? { ...item, ...value } : item)) });
  const patchTrophy = (index: number, value: Partial<Trophy>) =>
    patch({ trophies: trophies.map((item, i) => (i === index ? { ...item, ...value } : item)) });
  const patchPlacementSummary = (index: number, value: Partial<PlacementSummaryRow>) =>
    patch({ placementSummary: placementSummary.map((item, i) => (i === index ? { ...item, ...value } : item)) });
  const patchCampaign = (index: number, value: Partial<CampaignEntry>) =>
    patch({ campaign: campaign.map((item, i) => (i === index ? { ...item, ...value } : item)) });
  const patchFormer = (index: number, value: Partial<FormerPlayer>) =>
    patch({ formerPlayers: formerPlayers.map((item, i) => (i === index ? { ...item, ...value } : item)) });
  const patchStaff = (index: number, value: Partial<AchievementStaff>) =>
    patch({ staff: staff.map((item, i) => (i === index ? { ...item, ...value } : item)) });

  return (
    <div className="space-y-6">
      <SaveBar
        count={`${stats.length} stats / ${placementSummary.length} placement rows / ${trophies.length} trophies / ${campaign.length} campaign rows / ${formerPlayers.length + staff.length} legacy people`}
        saving={saving}
        error={error}
        savedAt={savedAt}
        onSave={() => void save()}
      />

      <Section title="Achievements page copy" hint="Hero copy on /achievements" defaultOpen>
        <Card className="grid gap-3">
          <BilingualField label="Kicker" value={page.kicker} onChange={(kicker) => patch({ page: { ...page, kicker } })} />
          <BilingualField label="Title" value={page.title} onChange={(title) => patch({ page: { ...page, title } })} />
          <BilingualField label="Intro" value={page.intro} onChange={(intro) => patch({ page: { ...page, intro } })} />
        </Card>
      </Section>

      <Section
        title="Overview stats"
        hint="Top stat cards"
        action={<Button onClick={() => patch({ stats: [...stats, { id: uid("stat"), value: "0", label: { en: "New stat", lo: "" }, detail: { en: "", lo: "" } }] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {stats.map((item, index) => (
            <Card key={`${item.id}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-soul">{item.label.en || item.id}</p>
                <div className="flex gap-2">
                  <Button onClick={() => patch({ stats: move(stats, index, -1) })}>Up</Button>
                  <Button onClick={() => patch({ stats: move(stats, index, 1) })}>Down</Button>
                  <Button variant="danger" onClick={() => patch({ stats: stats.filter((_, i) => i !== index) })}>Delete</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="ID" value={item.id} onChange={(id) => patchStat(index, { id })} />
                <TextField label="Value" value={item.value} onChange={(value) => patchStat(index, { value })} />
              </div>
              <BilingualField label="Label" value={item.label} onChange={(label) => patchStat(index, { label })} />
              <BilingualField label="Detail" value={item.detail} onChange={(detail) => patchStat(index, { detail })} />
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Placement summary"
        hint="Liquipedia Placement Summary shown on the Overview tab"
        action={<Button onClick={() => patch({ placementSummary: [...placementSummary, { tier: "B", first: 0, second: 0, third: 0, top3: 0, all: 0 }] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {placementSummary.map((item, index) => (
            <Card key={`${item.tier}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">
                  {item.tier === "Total" ? "Total" : `${item.tier}-Tier`}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => patch({ placementSummary: move(placementSummary, index, -1) })}>Up</Button>
                  <Button onClick={() => patch({ placementSummary: move(placementSummary, index, 1) })}>Down</Button>
                  <Button variant="danger" onClick={() => patch({ placementSummary: placementSummary.filter((_, i) => i !== index) })}>Delete</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-6">
                <SelectField label="Tier" value={item.tier} onChange={(tier) => patchPlacementSummary(index, { tier: tier as PlacementSummaryTier })} options={placementTierOptions} />
                <TextField label="1st" type="number" value={String(item.first)} onChange={(first) => patchPlacementSummary(index, { first: num(first) })} />
                <TextField label="2nd" type="number" value={String(item.second)} onChange={(second) => patchPlacementSummary(index, { second: num(second) })} />
                <TextField label="3rd" type="number" value={String(item.third)} onChange={(third) => patchPlacementSummary(index, { third: num(third) })} />
                <TextField label="Top 3" type="number" value={String(item.top3)} onChange={(top3) => patchPlacementSummary(index, { top3: num(top3) })} />
                <TextField label="All" type="number" value={String(item.all)} onChange={(all) => patchPlacementSummary(index, { all: num(all) })} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Trophy cabinet"
        hint="Champion cards"
        action={<Button onClick={() => patch({ trophies: [{ tournament: "New Tournament", date: "", result: "", opponent: "", prize: "", tier: "B" }, ...trophies] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {trophies.map((item, index) => (
            <Card key={`${item.tournament}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{item.tournament}</p>
                <div className="flex gap-2">
                  <Button onClick={() => patch({ trophies: move(trophies, index, -1) })}>Up</Button>
                  <Button onClick={() => patch({ trophies: move(trophies, index, 1) })}>Down</Button>
                  <Button variant="danger" onClick={() => patch({ trophies: trophies.filter((_, i) => i !== index) })}>Delete</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="Tournament" value={item.tournament} onChange={(tournament) => patchTrophy(index, { tournament })} />
                <TextField label="Date" type="date" value={item.date} onChange={(date) => patchTrophy(index, { date })} />
                <SelectField label="Tier" value={item.tier} onChange={(tier) => patchTrophy(index, { tier: tier as TournamentTier })} options={tierOptions} />
                <TextField label="Result" value={item.result} onChange={(result) => patchTrophy(index, { result })} />
                <TextField label="Opponent" value={item.opponent} onChange={(opponent) => patchTrophy(index, { opponent })} />
                <TextField label="Prize" value={item.prize} onChange={(prize) => patchTrophy(index, { prize })} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Campaign timeline"
        hint="Full achievements timeline"
        action={<Button onClick={() => patch({ campaign: [{ date: "", tournament: "New Tournament", place: "", medal: null, tier: "B", result: "", opponent: "", prize: "", worlds: false }, ...campaign] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {campaign.map((item, index) => (
            <Card key={`${item.date}-${item.tournament}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{item.tournament}</p>
                <div className="flex gap-2">
                  <Button onClick={() => patch({ campaign: move(campaign, index, -1) })}>Up</Button>
                  <Button onClick={() => patch({ campaign: move(campaign, index, 1) })}>Down</Button>
                  <Button variant="danger" onClick={() => patch({ campaign: campaign.filter((_, i) => i !== index) })}>Delete</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <TextField label="Date" type="date" value={item.date} onChange={(date) => patchCampaign(index, { date })} />
                <SelectField label="Tier" value={item.tier} onChange={(tier) => patchCampaign(index, { tier: tier as TournamentTier })} options={tierOptions} />
                <SelectField label="Medal" value={item.medal ?? ""} onChange={(medal) => patchCampaign(index, { medal: medal ? (medal as Medal) : null })} options={medalOptions} />
                <TextField label="Place" value={item.place} onChange={(place) => patchCampaign(index, { place })} />
                <TextField label="Tournament" value={item.tournament} onChange={(tournament) => patchCampaign(index, { tournament })} className="md:col-span-2" />
                <TextField label="Result" value={item.result} onChange={(result) => patchCampaign(index, { result })} />
                <TextField label="Opponent" value={item.opponent} onChange={(opponent) => patchCampaign(index, { opponent })} />
                <TextField label="Prize" value={item.prize} onChange={(prize) => patchCampaign(index, { prize })} />
                <label className="flex items-center gap-2 pt-6 font-mono text-[11px] text-ash">
                  <input
                    type="checkbox"
                    checked={item.worlds}
                    onChange={(event) => patchCampaign(index, { worlds: event.target.checked })}
                    className="h-4 w-4 accent-amethyst"
                  />
                  Worlds stage
                </label>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Legacy roster"
        hint="People who used to play for NIIGHTMARE"
        action={<Button onClick={() => patch({ formerPlayers: [{ ign: "New Player", name: "", role: "", joined: "", left: "", note: "" }, ...formerPlayers] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {formerPlayers.map((item, index) => (
            <Card key={`${item.ign}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{item.ign}</p>
                <Button variant="danger" onClick={() => patch({ formerPlayers: formerPlayers.filter((_, i) => i !== index) })}>Delete</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="IGN" value={item.ign} onChange={(ign) => patchFormer(index, { ign })} />
                <TextField label="Name" value={item.name} onChange={(name) => patchFormer(index, { name })} />
                <TextField label="Role" value={item.role} onChange={(role) => patchFormer(index, { role })} />
                <TextField label="Joined" type="date" value={item.joined} onChange={(joined) => patchFormer(index, { joined })} />
                <TextField label="Left" type="date" value={item.left} onChange={(left) => patchFormer(index, { left })} />
                <TextField label="Note" value={item.note} onChange={(note) => patchFormer(index, { note })} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Legacy staff / coaches"
        hint="Past NIIGHTMARE staff only. Current staff should stay on the roster page."
        action={<Button onClick={() => patch({ staff: [...staff, { ign: "New Staff", role: { en: "Coach", lo: "" }, since: "" }] })}>+ Add</Button>}
      >
        <div className="grid gap-3">
          {staff.map((item, index) => (
            <Card key={`${item.ign}-${index}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="keep-latin font-display text-sm font-bold uppercase tracking-wide text-soul">{item.ign}</p>
                <Button variant="danger" onClick={() => patch({ staff: staff.filter((_, i) => i !== index) })}>Delete</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="IGN" value={item.ign} onChange={(ign) => patchStaff(index, { ign })} />
                <TextField label="Since" value={item.since} onChange={(since) => patchStaff(index, { since })} />
              </div>
              <BilingualField label="Role" value={item.role} onChange={(role) => patchStaff(index, { role })} />
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
