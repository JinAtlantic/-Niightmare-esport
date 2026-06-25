"use client";

import React from "react";
import {
  Check,
  X,
  Lock,
  ChevronRight,
  Swords,
  Crown,
  MapPin,
  CalendarDays,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import Reveal from "@/components/ui/Reveal";
import {
  resolveRoadmap,
  type RoadmapContent,
  type RoadmapStatus,
  type RoadmapTier,
} from "@/lib/roadmap";
import type { Bilingual } from "@/lib/types";

/**
 * Per-TIER colour language (the event's weight) — bronze C → cyan B → silver A →
 * gold S — carried across the card's left blade, the tier badge, the spine node
 * and the cleared connector. Full class strings so Tailwind's JIT keeps them.
 */
const TIER: Record<
  RoadmapTier,
  { label: string; badge: string; blade: string; node: string; line: string; glow: string; stageText: string }
> = {
  C: {
    label: "C-Tier",
    badge: "border-bronze/55 bg-bronze/12 text-bronze",
    blade: "border-l-bronze",
    node: "border-bronze text-bronze",
    line: "bg-bronze/55",
    glow: "shadow-[0_0_14px_rgba(206,138,87,0.55)]",
    stageText: "text-bronze",
  },
  B: {
    label: "B-Tier",
    badge: "border-[#38BDF8]/55 bg-[#38BDF8]/12 text-[#7DD3FC]",
    blade: "border-l-[#38BDF8]",
    node: "border-[#38BDF8] text-[#7DD3FC]",
    line: "bg-[#38BDF8]/55",
    glow: "shadow-[0_0_14px_rgba(56,189,248,0.6)]",
    stageText: "text-[#7DD3FC]",
  },
  A: {
    label: "A-Tier",
    badge: "border-spectre/55 bg-spectre/12 text-spectre",
    blade: "border-l-spectre",
    node: "border-spectre text-spectre",
    line: "bg-spectre/55",
    glow: "shadow-[0_0_14px_rgba(201,180,246,0.6)]",
    stageText: "text-spectre",
  },
  S: {
    label: "S-Tier",
    badge: "border-gold/60 bg-gold/12 text-gold",
    blade: "border-l-gold",
    node: "border-gold text-gold",
    line: "bg-gold/55",
    glow: "shadow-[0_0_18px_rgba(245,196,81,0.75)]",
    stageText: "text-gold/90",
  },
};

/** Per-STATUS language (where the team is) — the status chip + node icon + a
 *  small dot used in the sub-stage list. */
const STATUS: Record<RoadmapStatus, { label: Bilingual; chip: string; icon: LucideIcon; dot: string }> = {
  done: { label: { en: "Cleared", lo: "ຜ່ານແລ້ວ" }, chip: "border-win/50 bg-win/10 text-win", icon: Check, dot: "bg-win" },
  active: { label: { en: "Live Now", lo: "ກຳລັງແຂ່ງ" }, chip: "border-loss/55 bg-loss/10 text-loss", icon: Swords, dot: "bg-loss" },
  eliminated: { label: { en: "Eliminated", lo: "ຕົກຮອບ" }, chip: "border-loss/40 bg-void/50 text-loss/80", icon: X, dot: "bg-loss/70" },
  upcoming: { label: { en: "Up Next", lo: "ຮອບຕໍ່ໄປ" }, chip: "border-amethyst/55 bg-amethyst/10 text-glow", icon: ChevronRight, dot: "bg-amethyst" },
  locked: { label: { en: "Locked", lo: "ຍັງບໍ່ເຖິງ" }, chip: "border-edge bg-void/50 text-ash-dim", icon: Lock, dot: "bg-edge-bright" },
};

/** Field labels for the info grid. */
const L = {
  date: { en: "Date", lo: "ວັນທີ" } as Bilingual,
  location: { en: "Location", lo: "ສະຖານທີ່" } as Bilingual,
  prize: { en: "Prize Pool", lo: "ເງິນລາງວັນ" } as Bilingual,
};

/** One clearly-bordered fact cell in the info grid. */
function InfoCell({
  icon: Icon,
  label,
  value,
  valueClass = "text-soul",
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={`p-3 md:p-3.5 ${className}`}>
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash-dim">
        <Icon size={12} strokeWidth={2} className="text-amethyst/75" />
        {label}
      </p>
      <p className={`keep-latin mt-1.5 font-display text-[15px] font-bold uppercase leading-tight tracking-[0.02em] ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Inline "Esports Roadmap" — a straight vertical status line under the Matches
 * filters. Tier colours show each stop's weight; the spine + status chips show
 * where NIIGHTMARE stands. Content comes from site.roadmap (admin-editable),
 * falling back to DEFAULT_ROADMAP.
 */
export default function RoadmapTimeline() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const { now, steps } = resolveRoadmap(
    (site as { roadmap?: Partial<RoadmapContent> }).roadmap
  );

  // The stop to spotlight — the live one, else the next one up.
  const currentIndex = (() => {
    const a = steps.findIndex((s) => s.status === "active");
    if (a !== -1) return a;
    return steps.findIndex((s) => s.status === "upcoming");
  })();

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── NOW — headline status banner ─────────────────────────────────── */}
      <Reveal>
        <div className="relative overflow-hidden border border-amethyst/35 bg-gradient-to-br from-crypt2/75 via-crypt/60 to-void p-5 shadow-glow-soft md:p-6">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent" />
          <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-spectre/80">
            <span className="h-[6px] w-[6px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
            {pick(now.kicker)}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="keep-latin font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-soul [text-shadow:0_2px_24px_rgba(168,85,247,0.3)] md:text-2xl">
              {pick(now.headline)}
            </h3>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 border border-amethyst/50 bg-amethyst/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-glow">
              <ChevronRight size={13} strokeWidth={2.5} />
              {pick(now.state)}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-spectre/90">{pick(now.blurb)}</p>
        </div>
      </Reveal>

      {/* ── THE LINE — one straight vertical status spine ────────────────── */}
      <div className="mt-8">
        {steps.map((step, i) => {
          const t = TIER[step.tier] ?? TIER.C;
          const s = STATUS[step.status] ?? STATUS.locked;
          const Icon = s.icon;
          const isLast = i === steps.length - 1;
          const isCurrent = i === currentIndex;
          const cleared = step.status === "done";
          const muted = step.status === "locked";

          return (
            <Reveal key={i} delay={i * 70}>
              <div className={`relative flex gap-3.5 sm:gap-4 ${isLast ? "pb-0" : "pb-7"}`}>
                {/* connector — tier-coloured when cleared, quiet otherwise */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={`absolute left-[19px] top-11 h-full w-[2px] ${cleared ? t.line : "bg-edge"}`}
                  />
                )}

                {/* node — tier ring + status icon */}
                <span className="relative z-[1] shrink-0">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-void ${t.node} ${t.glow} ${muted ? "opacity-60" : ""}`}>
                    <Icon size={17} strokeWidth={2.5} />
                  </span>
                </span>

                {/* card */}
                <div
                  className={`relative min-w-0 flex-1 overflow-hidden border border-edge border-l-4 ${t.blade} bg-gradient-to-br from-crypt2/65 via-crypt/55 to-void p-4 md:p-5 ${
                    step.apex ? "shadow-[0_0_36px_-10px_rgba(245,196,81,0.45)]" : ""
                  } ${muted ? "opacity-85" : ""}`}
                >
                  {step.apex && (
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}

                  {/* header: tier badge ↔ status chip */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center border px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.16em] ${t.badge}`}>
                      {t.label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${s.chip}`}>
                      <Icon size={12} strokeWidth={2.5} />
                      {pick(s.label)}
                    </span>
                  </div>

                  {/* tournament name (the hero line) + stage */}
                  <h4
                    className={`keep-latin mt-3 flex items-start gap-2 font-display text-xl font-extrabold uppercase leading-[1.1] tracking-tight md:text-[26px] ${
                      step.apex ? "text-gold [text-shadow:0_0_24px_rgba(245,196,81,0.4)]" : isCurrent ? "text-glow" : "text-soul"
                    }`}
                  >
                    {step.apex && <Crown size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-gold" />}
                    {pick(step.tournament)}
                  </h4>
                  <p className={`mt-1.5 font-display text-sm font-bold uppercase tracking-[0.08em] ${t.stageText}`}>
                    {pick(step.stage)}
                  </p>

                  {/* info grid — each fact in its own bordered cell */}
                  <div className="mt-4 grid grid-cols-2 border border-edge bg-void/30">
                    <InfoCell
                      icon={CalendarDays}
                      label={pick(L.date)}
                      value={step.window}
                      className={`border-r border-edge ${step.prize ? "border-b" : ""}`}
                    />
                    <InfoCell
                      icon={MapPin}
                      label={pick(L.location)}
                      value={pick(step.location)}
                      className={step.prize ? "border-b border-edge" : ""}
                    />
                    {step.prize && (
                      <InfoCell icon={Coins} label={pick(L.prize)} value={step.prize} valueClass="text-gold" className="col-span-2" />
                    )}
                  </div>

                  {step.note && (
                    <p
                      className={`mt-3.5 border-l-2 bg-void/40 py-2 pl-3 pr-3 font-mono text-[12px] leading-relaxed ${
                        step.status === "done" ? "border-win/60 text-win/90" : "border-amethyst/60 text-spectre"
                      }`}
                    >
                      {pick(step.note)}
                    </p>
                  )}

                  {/* sub-stages — Wildcard / Groups / Knockout etc. */}
                  {step.subStages && step.subStages.length > 0 && (
                    <div className="mt-4 border-t border-edge/70 pt-3.5">
                      <p className="mb-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-ash-dim">
                        {pick({ en: "Stages", lo: "ຮອບຍ່ອຍ" })}
                      </p>
                      <ul className="space-y-2">
                        {step.subStages.map((sub, k) => {
                          const ss = STATUS[sub.status] ?? STATUS.locked;
                          return (
                            <li key={k} className="flex items-center gap-2.5">
                              <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${ss.dot}`} />
                              <span className="keep-latin min-w-0 flex-1 truncate font-display text-[13px] font-bold uppercase tracking-[0.02em] text-soul">
                                {pick(sub.label)}
                              </span>
                              {sub.window && (
                                <span className="keep-latin shrink-0 font-mono text-[10px] text-ash-dim">{sub.window}</span>
                              )}
                              <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] ${ss.chip}`}>
                                {pick(ss.label)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ash-dim">
        2026 season · tiers per Liquipedia
      </p>
    </div>
  );
}
