"use client";

import React from "react";
import { Check, X, Lock, ChevronRight, Swords, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import Reveal from "@/components/ui/Reveal";
import { ROADMAP_NOW, ROADMAP_STEPS, type RoadmapStatus } from "@/lib/roadmap";
import type { Bilingual } from "@/lib/types";

/**
 * Per-status visual language. The connector below each node ("line") fills
 * bright through the stages already cleared and goes quiet afterwards, so the
 * spine itself reads as a progress bar — you can see at a glance how far up the
 * ladder the team currently is. Full class strings so Tailwind's JIT keeps them.
 */
const STATUS: Record<
  RoadmapStatus,
  {
    label: Bilingual;
    chip: string;
    node: string;
    line: string;
    icon: LucideIcon;
    /** Dim the whole row for stages not yet reached. */
    muted?: boolean;
  }
> = {
  done: {
    label: { en: "Cleared", lo: "ຜ່ານແລ້ວ" },
    chip: "border-win/45 bg-win/10 text-win",
    node: "border-win bg-win/15 text-win shadow-[0_0_14px_rgba(52,211,153,0.5)]",
    line: "bg-win/45",
    icon: Check,
  },
  active: {
    label: { en: "Live Now", lo: "ກຳລັງແຂ່ງ" },
    chip: "border-loss/50 bg-loss/10 text-loss",
    node: "border-loss bg-loss/15 text-loss shadow-[0_0_20px_rgba(251,113,133,0.75)]",
    line: "bg-loss/40",
    icon: Swords,
  },
  eliminated: {
    label: { en: "Eliminated", lo: "ຕົກຮອບ" },
    chip: "border-loss/40 bg-void/50 text-loss/80",
    node: "border-loss/55 bg-void text-loss/80",
    line: "bg-edge",
    icon: X,
  },
  upcoming: {
    label: { en: "Up Next", lo: "ຮອບຕໍ່ໄປ" },
    chip: "border-amethyst/50 bg-amethyst/10 text-glow",
    node: "border-amethyst bg-amethyst/15 text-glow shadow-[0_0_20px_rgba(168,85,247,0.6)]",
    line: "bg-edge",
    icon: ChevronRight,
  },
  locked: {
    label: { en: "Locked", lo: "ຍັງບໍ່ເຖິງ" },
    chip: "border-edge bg-void/50 text-ash-dim",
    node: "border-edge bg-void text-ash-dim",
    line: "bg-edge",
    icon: Lock,
    muted: true,
  },
};

/** The stage to spotlight — the live one, else the next one up. */
const CURRENT_PHASE =
  ROADMAP_STEPS.find((s) => s.status === "active")?.phase ??
  ROADMAP_STEPS.find((s) => s.status === "upcoming")?.phase ??
  null;

/**
 * Inline "Esports Roadmap" — a single straight, vertical status line. A summary
 * banner up top says where NIIGHTMARE stands right now; the spine below fills
 * bright through cleared stages and dims toward the locked ones, with the
 * current stage pulsing. Easy to scan, fully responsive.
 */
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
          const s = STATUS[step.status];
          const Icon = s.icon;
          const isLast = i === ROADMAP_STEPS.length - 1;
          const isCurrent = step.phase === CURRENT_PHASE;

          return (
            <Reveal key={step.phase} delay={i * 70}>
              <div className={`relative flex gap-4 ${isLast ? "pb-0" : "pb-7"}`}>
                {/* connector — progress fill toward the next node */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={`absolute left-[17px] top-9 h-full w-[2px] ${s.line}`}
                  />
                )}

                {/* node */}
                <span className="relative z-[1] shrink-0">
                  {isCurrent && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-amethyst/60 motion-safe:animate-ping"
                    />
                  )}
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 ${s.node}`}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                </span>

                {/* content */}
                <div className={`min-w-0 flex-1 pb-1 ${s.muted ? "opacity-65" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ash-dim">
                      Phase {step.phase}
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ash">
                      {pick(step.tierTag)}
                    </span>
                    <span
                      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${s.chip}`}
                    >
                      {pick(s.label)}
                    </span>
                  </div>

                  <h4
                    className={`mt-1.5 font-display text-lg font-extrabold uppercase leading-tight tracking-tight md:text-xl ${
                      isCurrent ? "text-glow" : "text-soul"
                    }`}
                  >
                    {pick(step.title)}
                  </h4>
                  <p className="keep-latin mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                    {pick(step.system)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-spectre/80">
                    {pick(step.detail)}
                  </p>

                  {/* live context line for cleared champion / next-up stage */}
                  {step.note && (
                    <p
                      className={`mt-2.5 inline-flex border-l-2 bg-void/40 py-1 pl-2.5 pr-3 font-mono text-[11px] leading-relaxed ${
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
        Status tracked across the MLBB competitive season
      </p>
    </div>
  );
}
