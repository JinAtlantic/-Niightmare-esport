"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Crown,
  Languages,
  Lock,
  Radar,
  X,
} from "lucide-react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { resolveRoadmap, type RoadmapContent, type RoadmapHalfId, type RoadmapStage } from "@/lib/roadmap";
import type { Lang } from "@/lib/types";

const statusClass = {
  past: {
    card: "border-edge bg-void/35 opacity-65",
    node: "border-ash-dim bg-void text-ash",
    icon: Check,
    label: "border-win/40 bg-win/10 text-win",
  },
  active: {
    card: "border-amethyst/75 bg-gradient-to-br from-amethyst/[0.18] via-crypt to-void shadow-[0_0_34px_rgba(168,85,247,0.35)]",
    node: "border-amethyst bg-amethyst/15 text-glow shadow-[0_0_22px_rgba(168,85,247,0.75)]",
    icon: Radar,
    label: "border-loss/55 bg-loss/12 text-loss",
  },
  future: {
    card: "border-edge bg-crypt/55",
    node: "border-edge-bright bg-void text-ash-dim",
    icon: Lock,
    label: "border-edge bg-void/50 text-ash-dim",
  },
} as const;

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
  activeLabel,
  isActiveStage,
}: {
  stage: RoadmapStage;
  activeLabel: string;
  isActiveStage: boolean;
}) {
  const { pick } = useLanguage();
  const status = isActiveStage ? "active" : stage.status;
  const style = statusClass[status];
  const Icon = style.icon;
  const tagLabel = stage.tag.replace(/\s*\/\s*/g, " ").replace(/\s+/g, " ").trim();

  return (
    <article className={`relative overflow-hidden border border-l-4 border-l-amethyst p-2.5 transition-all duration-300 sm:p-3 md:p-4 ${style.card}`}>
      <div className="flex items-start gap-2 md:gap-3">
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
            <span className={`border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] md:px-2 md:py-1 md:text-[9px] ${style.label}`}>
              {status === "active" ? activeLabel : status === "past" ? "CLEARED" : "LOCKED"}
            </span>
            <span className="keep-latin border border-edge bg-void/45 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-spectre md:px-2 md:py-1 md:text-[9px]">
              {tagLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="border border-glow/45 bg-glow/10 px-2 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-glow shadow-[0_0_16px_rgba(199,125,255,0.16)] md:text-xs">
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const { site } = useContent();
  const { lang, setLang, pick } = useLanguage();
  const roadmap = resolveRoadmap((site as { roadmap?: Partial<RoadmapContent> }).roadmap);
  const [activeHalf, setActiveHalf] = useState<RoadmapHalfId>("h1");
  const half = roadmap.halves.find((h) => h.id === activeHalf) ?? roadmap.halves[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-5" role="dialog" aria-modal="true" aria-label={pick(roadmap.buttonLabel)}>
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

          <header className="relative z-10 overflow-hidden border-b border-edge bg-gradient-to-br from-crypt2 via-crypt to-void p-3 md:p-6">
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 border-l border-loss/15 bg-loss/[0.05] [clip-path:polygon(34%_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="keep-latin font-display text-[1.65rem] font-extrabold uppercase leading-none tracking-tight text-soul md:text-4xl">
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

          <main className="relative z-10 bg-crypt p-3 md:p-6">
            <div className="grid grid-cols-2 border border-edge bg-void/50 p-1">
              {roadmap.halves.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveHalf(item.id)}
                  className={`min-h-[38px] px-2 font-display text-xs font-extrabold uppercase tracking-[0.06em] transition-all duration-300 hover:text-soul md:min-h-[46px] md:px-3 md:text-sm ${
                    activeHalf === item.id ? "bg-amethyst/18 text-soul shadow-glow-soft" : "text-ash"
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
              <div className="mb-3 border border-edge bg-void/45 p-2.5 md:p-4">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-amethyst md:text-[10px]">
                  {pick(half.kicker)}
                </p>
                <h3 className="mt-1 font-display text-lg font-extrabold uppercase leading-tight text-soul md:text-2xl">
                  {pick(half.title)}
                </h3>
                <p className="mt-1.5 hidden text-xs leading-relaxed text-spectre sm:block md:text-sm">{pick(half.goal)}</p>
              </div>

              <div className="relative grid gap-2.5 md:gap-3">
                <span aria-hidden className="absolute left-[22px] top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-amethyst via-loss/50 to-edge md:block" />
                {half.stages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    isActiveStage={stage.id === roadmap.activeStageId}
                    activeLabel={pick(roadmap.activeLabel)}
                  />
                ))}
              </div>
            </motion.section>

          </main>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-30 grid h-9 w-9 place-items-center border border-edge bg-void/85 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:h-10 md:w-10"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
