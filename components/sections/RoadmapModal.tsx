"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  Check,
  Crown,
  Languages,
  Radar,
  X,
} from "lucide-react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { useModalFocus } from "@/components/ui/useModalFocus";
import { resolveRoadmap, type RoadmapContent, type RoadmapHalfId, type RoadmapStage } from "@/lib/roadmap";
import type { Tier } from "@/lib/tiers";
import type { Lang } from "@/lib/types";

const statusClass = {
  past: {
    card: "border-edge bg-void/45 opacity-85",
    node: "border-ash-dim bg-void text-ash",
    icon: Check,
    label: "text-ash",
  },
  active: {
    card: "border-amethyst/75 bg-gradient-to-br from-amethyst/[0.18] via-crypt to-void shadow-[0_0_34px_rgba(168,85,247,0.35)]",
    node: "border-amethyst bg-amethyst/15 text-glow shadow-[0_0_22px_rgba(168,85,247,0.75)]",
    icon: Radar,
    label: "text-glow",
  },
  future: {
    card: "border-edge bg-crypt/55",
    node: "border-edge-bright bg-void text-ash-dim",
    icon: CalendarClock,
    label: "text-ash-dim",
  },
} as const;

const STATUS_LABEL = {
  past: { en: "COMPLETED", lo: "ແຂ່ງແລ້ວ" },
  active: { en: "COMPETING NOW", lo: "ກຳລັງແຂ່ງ" },
  future: { en: "UP NEXT", lo: "ງານຕໍ່ໄປ" },
} as const;

const TIER_BORDER: Record<Tier, string> = {
  C: "border-win/55 border-l-win",
  B: "border-cyan-300/55 border-l-cyan-300",
  A: "border-amethyst/65 border-l-amethyst",
  S: "border-gold/70 border-l-gold",
};

const TIER_GLOW: Record<Tier, string> = {
  C: "shadow-[0_0_22px_rgba(52,211,153,0.14)]",
  B: "shadow-[0_0_22px_rgba(103,232,249,0.15)]",
  A: "shadow-[0_0_26px_rgba(168,85,247,0.2)]",
  S: "shadow-[0_0_26px_rgba(245,196,81,0.18)]",
};

const TIER_TEXT: Record<Tier, string> = {
  C: "text-win",
  B: "text-cyan-300",
  A: "text-glow",
  S: "text-gold",
};

const TIER_WASH: Record<Tier, string> = {
  C: "bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_42%),linear-gradient(135deg,rgba(6,78,59,0.28),transparent_58%)]",
  B: "bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.26),transparent_42%),linear-gradient(135deg,rgba(8,47,73,0.32),transparent_58%)]",
  A: "bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_42%),linear-gradient(135deg,rgba(88,28,135,0.32),transparent_58%)]",
  S: "bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,0.28),transparent_42%),linear-gradient(135deg,rgba(113,63,18,0.34),transparent_58%)]",
};

const TIER_LINE: Record<Tier, string> = {
  C: "via-win/85",
  B: "via-cyan-300/85",
  A: "via-amethyst/90",
  S: "via-gold/90",
};

function tagTier(tag: string): Tier | null {
  const value = tag.match(/\b([CBAS])-Tier\b/i)?.[1]?.toUpperCase();
  return value === "C" || value === "B" || value === "A" || value === "S" ? value : null;
}

function LangButton({ value, active, onClick }: { value: Lang; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 border px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-colors md:h-9 md:px-3 md:text-[10px] md:tracking-[0.16em] ${
        active ? "border-amethyst bg-amethyst/20 text-soul" : "border-edge bg-void/60 text-ash hover:border-edge-bright hover:text-soul"
      }`}
    >
      {value === "lo" ? "Lao" : "EN"}
    </button>
  );
}

function StageCard({
  stage,
  isActiveStage,
}: {
  stage: RoadmapStage;
  isActiveStage: boolean;
}) {
  const { pick } = useLanguage();
  const status = isActiveStage ? "active" : stage.status;
  const style = statusClass[status];
  const Icon = style.icon;
  const tagLabel = stage.tag.replace(/\s*\/\s*/g, " ").replace(/\s+/g, " ").trim();
  const tier = tagTier(stage.tag);
  const tierBorder = tier ? `${TIER_BORDER[tier]} ${TIER_GLOW[tier]}` : "border-edge border-l-amethyst";
  const tierText = tier ? TIER_TEXT[tier] : "text-spectre";
  const tierWash = tier ? TIER_WASH[tier] : "bg-amethyst/10";
  const tierLine = tier ? TIER_LINE[tier] : "via-amethyst/65";

  return (
    <article className={`relative overflow-hidden border border-l-4 p-2.5 transition-all duration-300 sm:p-3 md:p-4 ${style.card} ${tierBorder}`}>
      <span aria-hidden className={`pointer-events-none absolute inset-0 opacity-95 ${tierWash}`} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,7,16,0.88),rgba(22,16,31,0.68)_48%,rgba(11,7,16,0.78))]"
      />
      <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${tierLine}`} />
      <span aria-hidden className={`pointer-events-none absolute -right-10 -top-16 h-32 w-32 blur-3xl ${tierWash}`} />
      {tier && (
        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 font-display text-6xl font-black uppercase leading-none opacity-[0.08] sm:block ${tierText}`}
        >
          {tier}
        </span>
      )}
      <div className="relative z-[1] flex items-start gap-2 md:gap-3">
        <div className="relative shrink-0">
          {status === "active" && (
            <span className="absolute inset-0 rounded-full bg-amethyst/35 motion-safe:animate-ping" aria-hidden />
          )}
          <span className={`relative grid h-8 w-8 place-items-center rounded-full border sm:h-9 sm:w-9 md:h-10 md:w-10 ${style.node}`}>
            <Icon size={15} strokeWidth={2.4} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[8px] font-bold uppercase tracking-[0.1em] md:text-[9px] ${style.label}`}>
              {status === "active"
                ? pick(STATUS_LABEL.active)
                : status === "past"
                  ? pick(STATUS_LABEL.past)
                  : pick(STATUS_LABEL.future)}
            </span>
            <span className={`keep-latin font-mono text-[8px] font-bold uppercase tracking-[0.1em] md:text-[9px] ${tierText}`}>
              {tagLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-soul md:text-xs">
              {pick(stage.window)}
            </span>
          </div>
          <h3 className="keep-latin mt-1 font-display text-base font-extrabold uppercase leading-tight text-soul sm:text-lg md:text-xl">
            {stage.destination && <Crown size={18} className="mr-2 inline text-gold" />}
            {pick(stage.title)}
          </h3>
        </div>
      </div>
    </article>
  );
}

export default function RoadmapModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { site } = useContent();
  const { lang, setLang, pick } = useLanguage();
  const roadmap = resolveRoadmap((site as { roadmap?: Partial<RoadmapContent> }).roadmap);
  const [activeHalf, setActiveHalf] = useState<RoadmapHalfId>("h1");
  const half = roadmap.halves.find((h) => h.id === activeHalf) ?? roadmap.halves[0];

  useModalFocus({ containerRef: dialogRef, initialFocusRef: closeRef, onClose });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={pick(roadmap.buttonLabel)}>
      <motion.div
        className="absolute inset-0 bg-black/84 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
      />
      <motion.div
        className="relative z-10 w-full max-w-4xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 24, mass: 0.75 }}
      >
        <div className="modal-scroll clip-esports relative max-h-[94svh] overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_70px_rgba(168,85,247,0.28)]">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-crypt" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent" />

          <header className="relative z-10 overflow-hidden border-b border-edge bg-gradient-to-br from-crypt2 via-crypt to-void p-3 pr-12 md:p-6">
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 border-l border-loss/15 bg-loss/[0.05] [clip-path:polygon(34%_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <h2 className="keep-latin truncate font-display text-[clamp(1.05rem,4.8vw,2.25rem)] font-extrabold uppercase leading-tight tracking-tight text-soul">
                  {pick(roadmap.hero.title)}
                </h2>
                <p className="mt-3 hidden max-w-2xl text-xs leading-relaxed text-spectre sm:block md:text-sm">
                  {pick(roadmap.hero.intro)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center border border-edge bg-void/70 text-amethyst md:h-9 md:w-9">
                    <Languages size={16} />
                  </span>
                  <LangButton value="lo" active={lang === "lo"} onClick={() => setLang("lo")} />
                  <LangButton value="en" active={lang === "en"} onClick={() => setLang("en")} />
                </div>
              </div>
            </div>
          </header>

          <section className="relative z-10 bg-crypt p-3 md:p-6">
            <div className="grid grid-cols-2 border border-edge bg-void/50 p-1">
              {roadmap.halves.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveHalf(item.id)}
                  className={`min-h-[38px] px-2 font-display text-xs font-extrabold uppercase tracking-[0.06em] transition-all duration-300 hover:text-soul md:min-h-[46px] md:px-3 md:text-sm ${
                    activeHalf === item.id ? "bg-amethyst/18 text-soul shadow-glow-soft" : "text-spectre"
                  }`}
                >
                  {pick(item.tab)}
                </button>
              ))}
            </div>

            <motion.section
              key={half.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
              className="mt-3"
            >
              <div className="relative grid gap-2.5 md:gap-3">
                <span aria-hidden className="absolute left-[22px] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-amethyst via-loss/50 to-edge md:block" />
                {half.stages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    isActiveStage={stage.id === roadmap.activeStageId}
                  />
                ))}
              </div>
            </motion.section>

          </section>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-30 grid h-9 w-9 place-items-center border border-edge bg-void/85 text-soul shadow-[0_6px_22px_rgba(0,0,0,0.6)] backdrop-blur transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void sm:-right-3 sm:-top-3 md:h-10 md:w-10"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
