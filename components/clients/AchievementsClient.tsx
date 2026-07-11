"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Globe2, Users } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import Reveal from "@/components/ui/Reveal";
import AuroraHalos from "@/components/ui/AuroraHalos";
import { useContent } from "@/components/context/ContentContext";
import {
  derivePlacementSummary,
  deriveTotalWinnings,
} from "@/lib/achievementsDerived";
import type {
  AchievementsData,
  CampaignEntry,
  PlacementSummaryRow,
  Tournament,
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

const labels = {
  date: { en: "Date", lo: "ວັນທີ" },
  rank: { en: "Rank", lo: "ອັນດັບ" },
  prize: { en: "Prize", lo: "ລາງວັນ" },
  totalRecord: { en: "Total Record", lo: "ບັນທຶກລວມ" },
  championshipCore: { en: "Championship Core", lo: "ແກນແຊມປ໌" },
  globalProof: { en: "Global Proof", lo: "ຜົນງານລະດັບໂລກ" },
  prizeWon: { en: "Total prize won", lo: "ເງິນລາງວັນທັງໝົດ" },
};

// Bilingual copy for the placement table so it switches with the language.
// Lao kept compact so the six columns still fit on small phones.
const PLACEMENT = {
  heading: { en: "Placement Table", lo: "ຕາຕະລາງອັນດັບ" },
  tier: { en: "Tier", lo: "ລະດັບ" },
  first: { en: "1st", lo: "ທີ1" },
  second: { en: "2nd", lo: "ທີ2" },
  third: { en: "3rd", lo: "ທີ3" },
  top3: { en: "Top 3", lo: "3 ອັນດັບ" },
  all: { en: "All", lo: "ທັງໝົດ" },
  total: { en: "Total", lo: "ລວມ" },
  other: { en: "Other", lo: "ອື່ນໆ" },
};

const DEFAULT_PLACEMENT_SUMMARY: PlacementSummaryRow[] = [
  { tier: "S", first: 0, second: 0, third: 0, top3: 0, all: 3 },
  { tier: "A", first: 0, second: 0, third: 0, top3: 0, all: 2 },
  { tier: "B", first: 3, second: 3, third: 2, top3: 8, all: 14 },
  { tier: "C", first: 0, second: 0, third: 0, top3: 0, all: 0 },
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
  if (tier === "Other") {
    return {
      text: "text-spectre",
      border: "border-edge-bright",
      bg: "bg-void/45",
      glow: "shadow-[0_0_18px_rgba(168,85,247,0.1)]",
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
  const { pick, lang } = useLanguage();
  const baseRows = (rows.length ? rows : DEFAULT_PLACEMENT_SUMMARY).filter((row) => row.tier !== "Total");
  const total: PlacementSummaryRow = {
    tier: "Total",
    first: baseRows.reduce((sum, row) => sum + row.first, 0),
    second: baseRows.reduce((sum, row) => sum + row.second, 0),
    third: baseRows.reduce((sum, row) => sum + row.third, 0),
    top3: baseRows.reduce((sum, row) => sum + row.top3, 0),
    all: baseRows.reduce((sum, row) => sum + row.all, 0),
  };
  const summary = [...baseRows, total];

  return (
    <div className="clip-esports relative overflow-hidden border border-edge bg-gradient-to-br from-crypt2/90 via-crypt/55 to-void p-3.5 shadow-glow-soft sm:p-5 md:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
      />
      <div className="relative">
        <h3 className="font-display text-2xl font-black uppercase tracking-[0.08em] text-soul md:text-4xl">
          {pick(PLACEMENT.heading)}
        </h3>
      </div>

      <div className="relative mt-6 overflow-x-auto border border-edge bg-void/35">
        <div className="grid grid-cols-[minmax(44px,1.1fr)_repeat(5,minmax(34px,1fr))] border-b border-edge bg-crypt/60 px-2.5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.04em] text-ash sm:text-[10px] md:grid-cols-[minmax(160px,1fr)_repeat(5,96px)] md:px-3 md:text-[11px] md:tracking-[0.14em]">
          <span className="whitespace-nowrap">{pick(PLACEMENT.tier)}</span>
          <span className="whitespace-nowrap text-right text-gold">{pick(PLACEMENT.first)}</span>
          <span className="whitespace-nowrap text-right text-silver">{pick(PLACEMENT.second)}</span>
          <span className="whitespace-nowrap text-right text-bronze">{pick(PLACEMENT.third)}</span>
          <span className="whitespace-nowrap text-right text-amethyst">{pick(PLACEMENT.top3)}</span>
          <span className="whitespace-nowrap text-right text-soul">{pick(PLACEMENT.all)}</span>
        </div>
        <div className="divide-y divide-edge/80">
          {summary.map((row) => {
            const tone = placementTierTone(row.tier);
              return (
                <div
                  key={row.tier}
                  className={`grid grid-cols-[minmax(44px,1.1fr)_repeat(5,minmax(34px,1fr))] items-center px-2.5 py-3.5 font-mono text-base tabular-nums sm:text-lg md:grid-cols-[minmax(160px,1fr)_repeat(5,96px)] md:px-3 md:text-xl ${row.tier === "Total" ? "bg-amethyst/10" : ""}`}
                >
                  <div className="min-w-0">
                    <span className={`inline-flex whitespace-nowrap border ${tone.border} ${tone.bg} px-1.5 py-0.5 font-display text-[10px] font-black uppercase tracking-[0.02em] ${tone.text} ${tone.glow} md:px-2 md:py-1 md:text-xs md:tracking-[0.12em]`}>
                      {row.tier === "Total"
                        ? pick(PLACEMENT.total)
                        : row.tier === "Other"
                          ? pick(PLACEMENT.other)
                          : lang === "lo"
                            ? row.tier
                            : `${row.tier}-Tier`}
                    </span>
                  </div>
                  <span className="text-right font-extrabold text-gold">{row.first}</span>
                  <span className="text-right font-extrabold text-silver">{row.second}</span>
                  <span className="text-right font-extrabold text-bronze">{row.third}</span>
                  <span className="text-right font-extrabold text-amethyst">{row.top3}</span>
                  <span className="text-right font-extrabold text-soul">{row.all}</span>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}

/** Animate a number from 0 → target on mount (ease-out), like a prize counter.
 *  Honours prefers-reduced-motion by jumping straight to the final value. */
function useCountUp(target: number, durationMs = 1300): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function AchievementsClient() {
  const { pick } = useLanguage();
  const { achievements, matches } = useContent();
  const ACH = achievements as unknown as AchievementsData;

  // Live figures derived from the /matches tournament list, so Total Winnings,
  // per-tier entries and podium finishes track the real results automatically.
  const tournaments = useMemo(
    () => (matches as { tournaments?: Tournament[] }).tournaments ?? [],
    [matches],
  );
  const derivedSummary = useMemo(() => derivePlacementSummary(tournaments), [tournaments]);
  const totalWinnings = useMemo(() => deriveTotalWinnings(tournaments), [tournaments]);
  const placementCount = derivedSummary.reduce((n, r) => n + r.all, 0);
  // Count up to the live prize total; fall back to the authored seed figure if
  // the tournament list is empty (e.g. a data outage).
  const countedWinnings = useCountUp(totalWinnings);
  const seedWinnings = ACH.stats.find((s) => s.id === "winnings")?.value ?? "$0";
  const prizeDisplay =
    totalWinnings > 0 ? `$${countedWinnings.toLocaleString("en-US")}` : seedWinnings;

  return (
    <>
      <PageHeader
        kicker={pick(ACH.page.kicker)}
        title={pick(ACH.page.title)}
        subtitle={pick(ACH.page.intro)}
        subtitleClassName="text-base font-medium text-spectre md:text-lg"
      />

      <section className="relative isolate overflow-hidden px-4 py-10 md:px-6 md:py-12">
        {/* premium two-tone ambient colour — tuned centrally in AuroraHalos */}
        <AuroraHalos />

        <div className="relative z-[1] mx-auto max-w-7xl animate-fadeIn">
          <div className="space-y-10">
              <div className="grid gap-4">
                <div className="clip-esports relative overflow-hidden border border-edge bg-gradient-to-br from-crypt2/85 via-crypt/60 to-void px-5 py-11 shadow-glow-soft md:px-10 md:py-16">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
                  />
                  {/* ambient prize glow behind the figure */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-[22rem] max-w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amethyst/20 blur-[90px]"
                  />

                  <div className="relative flex flex-col items-center text-center">
                    {/* eyebrow — section identity, flanked by hairlines */}
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-amethyst/70 md:w-12" />
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-soul md:text-xs">
                        {pick(labels.prizeWon)}
                      </span>
                      <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-amethyst/70 md:w-12" />
                    </div>

                    {/* the prize figure — the one thing this section is remembered by */}
                    <p
                      aria-label={
                        totalWinnings > 0 ? `$${totalWinnings.toLocaleString("en-US")}` : seedWinnings
                      }
                      className="mt-6 bg-[linear-gradient(176deg,#FBE9C0_2%,#F5C451_18%,#C77DFF_60%,#A855F7_100%)] bg-clip-text font-display text-6xl font-black leading-[0.88] tracking-tight tabular-nums text-transparent [filter:drop-shadow(0_0_34px_rgba(168,85,247,0.42))] sm:text-7xl md:text-[8.5rem]"
                    >
                      {prizeDisplay}
                    </p>
                  </div>
                </div>
              </div>

              <PodiumDashboard rows={placementCount > 0 ? derivedSummary : ACH.placementSummary ?? DEFAULT_PLACEMENT_SUMMARY} />

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
        </div>
      </section>
    </>
  );
}
