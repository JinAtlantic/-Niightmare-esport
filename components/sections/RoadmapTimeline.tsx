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
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import Reveal from "@/components/ui/Reveal";
import {
  ROADMAP_NOW,
  ROADMAP_STEPS,
  type RoadmapStatus,
  type RoadmapTier,
} from "@/lib/roadmap";
import type { Bilingual } from "@/lib/types";

/**
 * Per-TIER colour language (the event's weight). Each tier owns a distinct hue —
 * bronze C → cyan B → silver A → gold S — carried across the card's left blade,
 * the tier badge, the spine node, and the cleared connector. Full class strings
 * so Tailwind's JIT keeps them.
 */
const TIER: Record<
  RoadmapTier,
  {
    label: string;
    badge: string; // prominent tier pill
    blade: string; // card left border colour
    node: string; // node ring + text
    line: string; // bright connector when the stage is cleared
    glow: string; // node glow shadow
  }
> = {
  C: {
    label: "C-Tier",
    badge: "border-bronze/55 bg-bronze/12 text-bronze",
    blade: "border-l-bronze",
    node: "border-bronze text-bronze",
    line: "bg-bronze/55",
    glow: "shadow-[0_0_14px_rgba(206,138,87,0.55)]",
  },
  B: {
    label: "B-Tier",
    badge: "border-[#38BDF8]/55 bg-[#38BDF8]/12 text-[#7DD3FC]",
    blade: "border-l-[#38BDF8]",
    node: "border-[#38BDF8] text-[#7DD3FC]",
    line: "bg-[#38BDF8]/55",
    glow: "shadow-[0_0_14px_rgba(56,189,248,0.6)]",
  },
  A: {
    label: "A-Tier",
    badge: "border-spectre/55 bg-spectre/12 text-spectre",
    blade: "border-l-spectre",
    node: "border-spectre text-spectre",
    line: "bg-spectre/55",
    glow: "shadow-[0_0_14px_rgba(201,180,246,0.6)]",
  },
  S: {
    label: "S-Tier",
    badge: "border-gold/60 bg-gold/12 text-gold",
    blade: "border-l-gold",
    node: "border-gold text-gold",
    line: "bg-gold/55",
    glow: "shadow-[0_0_18px_rgba(245,196,81,0.75)]",
  },
};

/** Per-STATUS language (where the team is) — the status chip + node icon. */
const STATUS: Record<
  RoadmapStatus,
  { label: Bilingual; chip: string; icon: LucideIcon }
> = {
  done: {
    label: { en: "Cleared", lo: "ຜ່ານແລ້ວ" },
    chip: "border-win/50 bg-win/10 text-win",
    icon: Check,
  },
  active: {
    label: { en: "Live Now", lo: "ກຳລັງແຂ່ງ" },
    chip: "border-loss/55 bg-loss/10 text-loss",
    icon: Swords,
  },
  eliminated: {
    label: { en: "Eliminated", lo: "ຕົກຮອບ" },
    chip: "border-loss/40 bg-void/50 text-loss/80",
    icon: X,
  },
  upcoming: {
    label: { en: "Up Next", lo: "ຮອບຕໍ່ໄປ" },
    chip: "border-amethyst/55 bg-amethyst/10 text-glow",
    icon: ChevronRight,
  },
  locked: {
    label: { en: "Locked", lo: "ຍັງບໍ່ເຖິງ" },
    chip: "border-edge bg-void/50 text-ash-dim",
    icon: Lock,
  },
};

/** The stop to spotlight — the live one, else the next one up. */
const CURRENT_PHASE =
  ROADMAP_STEPS.find((s) => s.status === "active")?.phase ??
  ROADMAP_STEPS.find((s) => s.status === "upcoming")?.phase ??
  null;

export default function RoadmapTimeline() {
  const { pick } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── NOW — headline status banner ─────────────────────────────────── */}
      <Reveal>
        <div className="relative overflow-hidden border border-amethyst/35 bg-gradient-to-br from-crypt2/75 via-crypt/60 to-void p-5 shadow-glow-soft md:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
          />
          <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-spectre/80">
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amethyst opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
            </span>
            {pick(ROADMAP_NOW.kicker)}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="keep-latin font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-soul [text-shadow:0_2px_24px_rgba(168,85,247,0.3)] md:text-2xl">
              {pick(ROADMAP_NOW.headline)}
            </h3>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 border border-amethyst/50 bg-amethyst/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-glow">
              <ChevronRight size={13} strokeWidth={2.5} />
              {pick(ROADMAP_NOW.state)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-spectre/80">
            {pick(ROADMAP_NOW.blurb)}
          </p>
        </div>
      </Reveal>

      {/* ── THE LINE — one straight vertical status spine ────────────────── */}
      <div className="mt-8">
        {ROADMAP_STEPS.map((step, i) => {
          const t = TIER[step.tier];
          const s = STATUS[step.status];
          const Icon = s.icon;
          const isLast = i === ROADMAP_STEPS.length - 1;
          const isCurrent = step.phase === CURRENT_PHASE;
          const cleared = step.status === "done";
          const muted = step.status === "locked";

          return (
            <Reveal key={step.phase} delay={i * 70}>
              <div className={`relative flex gap-4 ${isLast ? "pb-0" : "pb-7"}`}>
                {/* connector — tier-coloured when cleared, quiet otherwise */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={`absolute left-[19px] top-11 h-full w-[2px] ${
                      cleared ? t.line : "bg-edge"
                    }`}
                  />
                )}

                {/* node — tier ring + status icon */}
                <span className="relative z-[1] shrink-0">
                  {isCurrent && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-amethyst/60 motion-safe:animate-ping"
                    />
                  )}
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full border-2 bg-void ${t.node} ${t.glow} ${
                      muted ? "opacity-60" : ""
                    }`}
                  >
                    <Icon size={17} strokeWidth={2.5} />
                  </span>
                </span>

                {/* card — tier blade + prominent tournament & tier ─────────── */}
                <div
                  className={`relative flex-1 overflow-hidden border border-edge border-l-4 ${t.blade} bg-gradient-to-br from-crypt2/65 via-crypt/55 to-void p-4 md:p-5 ${
                    step.apex ? "shadow-[0_0_36px_-10px_rgba(245,196,81,0.45)]" : ""
                  } ${muted ? "opacity-80" : ""}`}
                >
                  {step.apex && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                    />
                  )}

                  {/* top row: tier badge + status chip + phase */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center border px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.14em] ${t.badge}`}
                    >
                      {t.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${s.chip}`}
                    >
                      <Icon size={11} strokeWidth={2.5} />
                      {pick(s.label)}
                    </span>
                    <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ash-dim">
                      {step.phase}
                    </span>
                  </div>

                  {/* tournament name — the hero line */}
                  <h4
                    className={`keep-latin mt-2.5 flex items-center gap-2 font-display text-xl font-extrabold uppercase leading-tight tracking-tight md:text-2xl ${
                      step.apex
                        ? "text-gold [text-shadow:0_0_24px_rgba(245,196,81,0.4)]"
                        : isCurrent
                          ? "text-glow"
                          : "text-soul"
                    }`}
                  >
                    {step.apex && <Crown size={20} strokeWidth={2} className="shrink-0 text-gold" />}
                    {pick(step.tournament)}
                  </h4>

                  {/* meta: stage · location · window · prize */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ash">
                    <span className={`font-semibold uppercase tracking-[0.12em] ${t.node.includes("gold") ? "text-gold/90" : ""}`}>
                      {pick(step.stage)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-ash-dim">
                      <MapPin size={11} strokeWidth={2} />
                      <span className="keep-latin">{pick(step.location)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-ash-dim">
                      <CalendarDays size={11} strokeWidth={2} />
                      <span className="keep-latin">{step.window}</span>
                    </span>
                    {step.prize && (
                      <span className="keep-latin font-bold tabular-nums text-gold/90">
                        {step.prize}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-spectre/80">
                    {pick(step.detail)}
                  </p>

                  {step.note && (
                    <p
                      className={`mt-3 inline-flex border-l-2 bg-void/40 py-1 pl-2.5 pr-3 font-mono text-[11px] leading-relaxed ${
                        step.status === "done"
                          ? "border-win/60 text-win/90"
                          : "border-amethyst/60 text-spectre"
                      }`}
                    >
                      {pick(step.note)}
                    </p>
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
