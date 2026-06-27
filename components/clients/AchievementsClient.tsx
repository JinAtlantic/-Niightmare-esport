"use client";

import React, { useState } from "react";
import { Award, Crown, Globe2, Users } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/context/ContentContext";
import type {
  AchievementsData,
  AchievementStaff,
  CampaignEntry,
  FormerPlayer,
  PlacementSummaryRow,
} from "@/lib/types";

/** Tournament tier colour system: C green, B cyan, A violet, S gold. */
const TIER_TONE: Record<
  CampaignEntry["tier"],
  {
    text: string;
    border: string;
    glow: string;
    wash: string;
    node: string;
    line: string;
  }
> = {
  S: {
    text: "text-gold",
    border: "border-gold/40",
    glow: "shadow-[0_0_26px_rgba(245,196,81,0.22)]",
    wash: "from-gold/[0.14] via-gold/[0.035]",
    node: "border-gold bg-gold shadow-[0_0_18px_rgba(245,196,81,0.75)]",
    line: "via-gold/70",
  },
  A: {
    text: "text-glow",
    border: "border-amethyst/45",
    glow: "shadow-[0_0_24px_rgba(168,85,247,0.24)]",
    wash: "from-amethyst/[0.14] via-amethyst/[0.035]",
    node: "border-amethyst bg-amethyst shadow-[0_0_18px_rgba(168,85,247,0.75)]",
    line: "via-amethyst/70",
  },
  B: {
    text: "text-cyan-300",
    border: "border-cyan-300/35",
    glow: "shadow-[0_0_24px_rgba(103,232,249,0.18)]",
    wash: "from-cyan-300/[0.11] via-cyan-300/[0.025]",
    node: "border-cyan-300 bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.65)]",
    line: "via-cyan-300/60",
  },
  C: {
    text: "text-win",
    border: "border-win/35",
    glow: "shadow-[0_0_22px_rgba(52,211,153,0.17)]",
    wash: "from-win/[0.11] via-win/[0.025]",
    node: "border-win bg-win shadow-[0_0_16px_rgba(52,211,153,0.6)]",
    line: "via-win/60",
  },
};

/** Medal text color for a podium finish. */
const MEDAL_TEXT: Record<NonNullable<CampaignEntry["medal"]>, string> = {
  gold: "text-gold",
  silver: "text-silver",
  bronze: "text-bronze",
};

const MEDAL_BORDER: Record<NonNullable<CampaignEntry["medal"]>, string> = {
  gold: "border-gold/45",
  silver: "border-silver/35",
  bronze: "border-bronze/40",
};

const yr = (iso: string) => iso.slice(0, 4);
const monogram = (s: string) => s.replace(/\s+/g, "").slice(0, 2).toUpperCase();
const labels = {
  date: { en: "Date", lo: "ວັນທີ" },
  rank: { en: "Rank", lo: "ອັນດັບ" },
  prize: { en: "Prize", lo: "ລາງວັນ" },
  totalRecord: { en: "Total Record", lo: "ບັນທຶກລວມ" },
  championshipCore: { en: "Championship Core", lo: "ແກນແຊມປ໌" },
  globalProof: { en: "Global Proof", lo: "ຜົນງານລະດັບໂລກ" },
};

type PodiumRank = 1 | 2 | 3;
type PlacementRank = PodiumRank | "top3" | "all";

const PODIUM_TONE: Record<
  PlacementRank,
  { label: string; text: string; border: string; glow: string; wash: string; line: string }
> = {
  1: {
    label: "1st Place",
    text: "text-gold",
    border: "border-gold/45",
    glow: "shadow-[0_0_34px_rgba(245,196,81,0.24)]",
    wash: "from-gold/[0.15] via-gold/[0.045]",
    line: "via-gold/80",
  },
  2: {
    label: "2nd Place",
    text: "text-silver",
    border: "border-silver/40",
    glow: "shadow-[0_0_30px_rgba(192,197,207,0.2)]",
    wash: "from-silver/[0.13] via-silver/[0.035]",
    line: "via-silver/70",
  },
  3: {
    label: "3rd Place",
    text: "text-bronze",
    border: "border-bronze/45",
    glow: "shadow-[0_0_30px_rgba(178,111,55,0.2)]",
    wash: "from-bronze/[0.13] via-bronze/[0.035]",
    line: "via-bronze/70",
  },
  top3: {
    label: "Top 3",
    text: "text-amethyst",
    border: "border-amethyst/45",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.18)]",
    wash: "from-amethyst/[0.12] via-amethyst/[0.035]",
    line: "via-amethyst/70",
  },
  all: {
    label: "All Placements",
    text: "text-soul",
    border: "border-edge-bright",
    glow: "shadow-[0_0_24px_rgba(201,180,246,0.12)]",
    wash: "from-spectre/[0.08] via-spectre/[0.02]",
    line: "via-spectre/55",
  },
};

const DEFAULT_PLACEMENT_SUMMARY: PlacementSummaryRow[] = [
  { tier: "S", first: 0, second: 0, third: 0, top3: 0, all: 3 },
  { tier: "A", first: 0, second: 0, third: 0, top3: 0, all: 2 },
  { tier: "B", first: 3, second: 3, third: 2, top3: 8, all: 14 },
  { tier: "C", first: 0, second: 0, third: 0, top3: 0, all: 0 },
  { tier: "Total", first: 3, second: 3, third: 2, top3: 8, all: 19 },
];

function formatDate(iso: string, lang: "en" | "lo"): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.valueOf())) return iso;
  return new Intl.DateTimeFormat(lang === "lo" ? "lo-LA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date).replace(",", "");
}

function placementTone(e: CampaignEntry): string {
  return e.medal ? MEDAL_TEXT[e.medal] : TIER_TONE[e.tier].text;
}

function tenure(p: FormerPlayer): string {
  const a = yr(p.joined);
  const b = yr(p.left);
  return a === b ? a : `${a}–${b}`;
}

/** One result on the vertical campaign timeline. */
function TimelineEntry({ e, delay }: { e: CampaignEntry; delay: number }) {
  const { lang, pick } = useLanguage();
  const tier = TIER_TONE[e.tier];
  const rankTone = placementTone(e);
  const medalBorder = e.medal ? MEDAL_BORDER[e.medal] : tier.border;
  return (
    <Reveal delay={delay} className="relative pl-8 md:pl-12">
      {/* spine node */}
      <span
        aria-hidden
        className={`absolute left-0 top-6 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 ${tier.node}`}
      />
      <div
        className={`group relative overflow-hidden border bg-crypt/70 p-4 transition-colors duration-300 hover:border-edge-bright md:p-5 ${tier.border} ${tier.glow}`}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tier.wash} to-transparent opacity-70`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tier.line} to-transparent opacity-80`}
        />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`font-mono text-xs font-bold uppercase tracking-[0.22em] ${tier.text} [text-shadow:0_0_16px_rgba(199,125,255,0.36)]`}>
                {e.tier}-Tier
              </p>
              <h3 className="keep-latin mt-2 font-display text-lg font-bold uppercase leading-tight text-soul [text-shadow:0_0_18px_rgba(236,231,242,0.16)] md:text-xl">
                {e.tournament}
              </h3>
            </div>

            {e.worlds && (
              <span className="inline-flex shrink-0 items-center gap-1.5 border border-amethyst/35 bg-amethyst/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-glow">
                <Globe2 size={11} strokeWidth={2.25} />
                Worlds
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 border-t border-edge/80 pt-4">
            <div className="min-w-0 pr-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash">
                {pick(labels.date)}
              </p>
              <p className="mt-1.5 font-mono text-xs font-semibold uppercase tabular-nums text-soul">
                {formatDate(e.date, lang)}
              </p>
            </div>
            <div className={`min-w-0 border-x border-edge/80 px-3 ${medalBorder}`}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash">
                {pick(labels.rank)}
              </p>
              <p className={`mt-1.5 font-display text-base font-bold uppercase leading-none ${rankTone} md:text-lg`}>
                {e.place}
              </p>
            </div>
            <div className="min-w-0 pl-3 text-right">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash">
                {pick(labels.prize)}
              </p>
              <p className={`mt-1.5 font-mono text-xs font-bold tabular-nums ${rankTone} md:text-sm`}>
                {e.prize}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function placementTierTone(tier: PlacementSummaryRow["tier"]) {
  if (tier === "Total") {
    return {
      text: "text-soul",
      border: "border-amethyst/45",
      bg: "bg-amethyst/10",
      glow: "shadow-[0_0_28px_rgba(168,85,247,0.18)]",
    };
  }
  const tone = TIER_TONE[tier];
  return {
    text: tone.text,
    border: tone.border,
    bg: "bg-void/45",
    glow: tone.glow,
  };
}

function PodiumDashboard({ rows }: { rows: PlacementSummaryRow[] }) {
  const summary = rows.length ? rows : DEFAULT_PLACEMENT_SUMMARY;
  const total = summary.find((row) => row.tier === "Total") ?? {
    tier: "Total",
    first: summary.reduce((sum, row) => sum + row.first, 0),
    second: summary.reduce((sum, row) => sum + row.second, 0),
    third: summary.reduce((sum, row) => sum + row.third, 0),
    top3: summary.reduce((sum, row) => sum + row.top3, 0),
    all: summary.reduce((sum, row) => sum + row.all, 0),
  };
  const cards: { key: PlacementRank; value: number }[] = [
    { key: 1, value: total.first },
    { key: 2, value: total.second },
    { key: 3, value: total.third },
    { key: "top3", value: total.top3 },
    { key: "all", value: total.all },
  ];

  return (
    <div className="clip-esports relative overflow-hidden border border-edge bg-gradient-to-br from-crypt2/90 via-crypt/55 to-void p-5 shadow-glow-soft md:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
      />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amethyst">
            Liquipedia Placement Summary
          </p>
          <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.08em] text-soul md:text-4xl">
            Podium Record
          </h3>
        </div>
        <p className="max-w-md font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-ash md:text-right">
          All-time official placements by tournament tier
        </p>
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-5">
        {cards.map((card) => {
          const tone = PODIUM_TONE[card.key];
          return (
            <div key={card.key} className={`relative overflow-hidden border ${tone.border} bg-void/50 p-4 ${tone.glow}`}>
              <span aria-hidden className={`absolute inset-0 bg-gradient-to-br ${tone.wash} to-transparent`} />
              <span aria-hidden className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tone.line} to-transparent`} />
              <div className="relative">
                <p className={`font-display text-4xl font-black leading-none tabular-nums ${tone.text} md:text-5xl`}>
                  {card.value}
                </p>
                <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-soul">
                  {tone.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-5 overflow-hidden border border-edge bg-void/35">
        <div className="grid grid-cols-[minmax(84px,1fr)_repeat(5,minmax(44px,72px))] border-b border-edge bg-crypt/60 px-3 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ash md:grid-cols-[minmax(160px,1fr)_repeat(5,88px)]">
          <span>Tier</span>
          <span className="text-right text-gold">1st</span>
          <span className="text-right text-silver">2nd</span>
          <span className="text-right text-bronze">3rd</span>
          <span className="text-right text-amethyst">Top 3</span>
          <span className="text-right text-soul">All</span>
        </div>
        <div className="divide-y divide-edge/80">
          {summary.map((row) => {
            const tone = placementTierTone(row.tier);
              return (
                <div
                  key={row.tier}
                  className={`grid grid-cols-[minmax(84px,1fr)_repeat(5,minmax(44px,72px))] items-center px-3 py-3 font-mono text-xs tabular-nums md:grid-cols-[minmax(160px,1fr)_repeat(5,88px)] ${row.tier === "Total" ? "bg-amethyst/10" : ""}`}
                >
                  <div className="min-w-0">
                    <span className={`inline-flex border ${tone.border} ${tone.bg} px-2 py-1 font-display text-xs font-black uppercase tracking-[0.12em] ${tone.text} ${tone.glow}`}>
                      {row.tier === "Total" ? "Total" : `${row.tier}-Tier`}
                    </span>
                  </div>
                  <span className="text-right font-bold text-gold">{row.first}</span>
                  <span className="text-right font-bold text-silver">{row.second}</span>
                  <span className="text-right font-bold text-bronze">{row.third}</span>
                  <span className="text-right font-bold text-amethyst">{row.top3}</span>
                  <span className="text-right font-bold text-soul">{row.all}</span>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}

/** A past player in the Legacy roll. */
function FormerRow({ p }: { p: FormerPlayer }) {
  return (
    <div className="flex h-full items-center gap-3 border border-edge bg-crypt/30 p-3.5 transition-colors hover:border-edge-bright">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-edge bg-void/60 font-display text-xs font-bold uppercase text-spectre/55">
        {monogram(p.ign)}
      </span>
      <div className="min-w-0">
        <p className="keep-latin truncate font-display text-sm font-bold uppercase text-soul">{p.ign}</p>
        <p className="font-mono text-[11px] text-ash">
          <span className="keep-latin">{p.role}</span>
          <span className="text-ash-dim"> · </span>
          <span className="tabular-nums">{tenure(p)}</span>
        </p>
        {p.note && (
          <p className="keep-latin truncate font-mono text-[10px] text-amethyst/75">{p.note}</p>
        )}
      </div>
    </div>
  );
}

function LegacyStaffRow({ s }: { s: AchievementStaff }) {
  const { pick } = useLanguage();
  return (
    <div className="flex h-full items-center gap-3 border border-edge bg-crypt/30 p-3.5 transition-colors hover:border-edge-bright">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-edge bg-void/60 text-amethyst/75">
        <Users size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="keep-latin truncate font-display text-sm font-bold uppercase text-soul">{s.ign}</p>
        <p className="font-mono text-[11px] text-ash">
          <span>{pick(s.role)}</span>
          {s.since && (
            <>
              <span className="text-ash-dim"> · </span>
              <span className="tabular-nums">{s.since}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: { en: "Overview", lo: "ພາບລວມ" } },
  { id: "campaign", label: { en: "Campaign", lo: "ໄທມ໌ໄລນ໌" } },
  { id: "legacy", label: { en: "Legacy", lo: "ອະດີດ" } },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AchievementsClient() {
  const { pick } = useLanguage();
  const { achievements, roster } = useContent();
  const ACH = achievements as unknown as AchievementsData;
  const [tab, setTab] = useState<TabId>("overview");
  const featuredTrophy = ACH.trophies[0];
  const currentStaffNames = new Set(
    ((roster as { staff?: { ign?: string; name?: string }[] }).staff ?? [])
      .flatMap((member) => [member.ign, member.name])
      .filter(Boolean)
      .map((name) => String(name).trim().toLowerCase())
  );
  const legacyStaff = (ACH.staff ?? []).filter((member) => {
    const ign = member.ign.trim().toLowerCase();
    return ign && !currentStaffNames.has(ign);
  });

  return (
    <>
      <PageHeader
        kicker={pick(ACH.page.kicker)}
        title={pick(ACH.page.title)}
        subtitle={pick(ACH.page.intro)}
        subtitleClassName="text-base font-medium text-spectre md:text-lg"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        {/* TABS — split the record into focused views so nothing scrolls far */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-1 border-b border-edge">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`group relative -mb-px px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors md:px-8 md:text-base ${
                  active ? "text-soul" : "text-ash hover:text-soul"
                }`}
              >
                <span className="keep-latin">{pick(t.label)}</span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[2px] -skew-x-[24deg] bg-gradient-to-r from-amethyst to-glow transition-opacity duration-300 ${
                    active ? "opacity-100 shadow-[0_0_14px_rgba(168,85,247,0.7)]" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* re-keyed so each view fades in fresh on switch */}
        <div key={tab} className="animate-fadeIn">
          {/* ── OVERVIEW — tale of the tape + trophies + staff ──────────── */}
          {tab === "overview" && (
            <div className="space-y-10">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <div className="clip-esports relative overflow-hidden border border-edge bg-gradient-to-br from-crypt2/85 via-crypt/60 to-void p-5 shadow-glow-soft md:p-7">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
                  />
                  <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-glow">
                        {pick(labels.totalRecord)}
                      </p>
                      <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-none text-soul md:text-5xl">
                        {pick(ACH.page.title)}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
                        {pick(ACH.page.intro)}
                      </p>
                    </div>
                    <div className="grid h-16 w-16 shrink-0 place-items-center border border-amethyst/35 bg-amethyst/10 text-glow shadow-glow">
                      <Crown size={30} strokeWidth={1.65} />
                    </div>
                  </div>

                  <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {ACH.stats.map((s) => (
                      <div key={s.id} className="border border-edge bg-void/45 p-4 transition-colors hover:border-edge-bright">
                        <p className="font-mono text-3xl font-bold leading-none tabular-nums text-soul md:text-4xl">
                          {s.value}
                        </p>
                        <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.12em] text-spectre">
                          {pick(s.label)}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-relaxed text-ash">{pick(s.detail)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {featuredTrophy && (
                  <div className="clip-esports relative overflow-hidden border border-gold/35 bg-gradient-to-b from-gold/[0.11] via-crypt/70 to-void p-5 shadow-glow-gold md:p-7">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-gold/80">
                          {pick(labels.championshipCore)}
                        </p>
                        <h3 className="keep-latin mt-3 font-display text-2xl font-bold uppercase leading-tight text-soul">
                          {featuredTrophy.tournament}
                        </h3>
                      </div>
                      <Award size={34} strokeWidth={1.65} className="shrink-0 text-gold" />
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3 border-t border-gold/20 pt-5">
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ash-dim">
                          {pick(labels.date)}
                        </p>
                        <p className="mt-2 font-mono text-sm font-bold tabular-nums text-soul">
                          {yr(featuredTrophy.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ash-dim">
                          {pick(labels.prize)}
                        </p>
                        <p className="mt-2 font-mono text-sm font-bold tabular-nums text-gold">
                          {featuredTrophy.prize}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <PodiumDashboard rows={ACH.placementSummary ?? DEFAULT_PLACEMENT_SUMMARY} />

              <div className="hidden border border-edge bg-crypt/25 p-5 md:p-6">
                <div className="flex flex-col gap-2 text-center md:flex-row md:items-end md:justify-between md:text-left">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amethyst">
                      {pick(labels.globalProof)}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-[0.08em] text-soul">
                      COACHING STAFF
                    </h3>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">
                    BEHIND THE WINS
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ACH.staff.map((s) => (
                    <div key={s.ign} className="flex items-center gap-3 border border-edge bg-void/40 px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center border border-edge bg-void/50 text-amethyst">
                        <Users size={16} strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="keep-latin font-display text-sm font-bold uppercase tracking-[0.04em] text-soul">
                          {s.ign}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                          {pick(s.role)}
                          <span className="text-ash-dim"> · since {s.since}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CAMPAIGN — full timeline ────────────────────────────────── */}
          {tab === "campaign" && (
            <div className="relative mx-auto max-w-3xl">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-2 left-0 w-px bg-gradient-to-b from-amethyst/60 via-edge-bright to-transparent"
              />
              <div className="space-y-4">
                {ACH.campaign.map((e, i) => (
                  <TimelineEntry key={`${e.date}-${e.tournament}`} e={e} delay={i * 40} />
                ))}
              </div>
            </div>
          )}

          {/* ── LEGACY — former players ─────────────────────────────────── */}
          {tab === "legacy" && (
            <div className="space-y-8">
              <div>
                <SectionLabel centered kicker="PAST PLAYERS">LEGACY ROSTER</SectionLabel>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ACH.formerPlayers.map((p) => (
                    <FormerRow key={p.ign} p={p} />
                  ))}
                </div>
              </div>

              {legacyStaff.length > 0 && (
                <div>
                  <SectionLabel centered kicker="PAST STAFF">LEGACY STAFF</SectionLabel>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {legacyStaff.map((s) => (
                      <LegacyStaffRow key={s.ign} s={s} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <p className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ash-dim">
          Competitive record sourced from Liquipedia
        </p>
      </section>
    </>
  );
}
