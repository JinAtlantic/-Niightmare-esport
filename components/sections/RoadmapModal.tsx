"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Languages,
  Lock,
  Radar,
  Route,
  Shield,
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
      className={`h-9 border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
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

  return (
    <article className={`relative overflow-hidden border border-l-4 border-l-amethyst p-4 transition-all duration-300 md:p-5 ${style.card}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {status === "active" && (
            <span className="absolute inset-0 rounded-full bg-amethyst/35 motion-safe:animate-ping" aria-hidden />
          )}
          <span className={`relative grid h-11 w-11 place-items-center rounded-full border ${style.node}`}>
            <Icon size={18} strokeWidth={2.4} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${style.label}`}>
              {status === "active" ? activeLabel : status === "past" ? "CLEARED" : "LOCKED"}
            </span>
            <span className="keep-latin border border-edge bg-void/45 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-spectre">
              {stage.tag}
            </span>
          </div>
          <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst">
            {pick(stage.label)} / {pick(stage.window)}
          </p>
          <h3 className="keep-latin mt-2 font-display text-xl font-extrabold uppercase leading-tight text-soul md:text-2xl">
            {stage.destination && <Crown size={20} className="mr-2 inline text-gold" />}
            {pick(stage.title)}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-spectre">{pick(stage.body)}</p>
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={pick(roadmap.buttonLabel)}>
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
        className="relative z-10 w-full max-w-5xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 24, mass: 0.75 }}
      >
        <div className="modal-scroll clip-esports relative max-h-[90vh] overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_70px_rgba(168,85,247,0.28)]">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-crypt" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent" />

          <header className="relative z-10 overflow-hidden border-b border-edge bg-gradient-to-br from-crypt2 via-crypt to-void p-5 md:p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 border-l border-loss/15 bg-loss/[0.05] [clip-path:polygon(34%_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-spectre">
                  <Route size={14} className="text-amethyst" />
                  {pick(roadmap.hero.kicker)}
                </p>
                <h2 className="keep-latin mt-3 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-soul md:text-5xl">
                  {pick(roadmap.hero.title)}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-spectre md:text-base">
                  {pick(roadmap.hero.intro)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center border border-edge bg-void/70 text-amethyst">
                    <Languages size={16} />
                  </span>
                  <LangButton value="lo" active={lang === "lo"} onClick={() => setLang("lo")} />
                  <LangButton value="en" active={lang === "en"} onClick={() => setLang("en")} />
                </div>
              </div>
            </div>

            <div className="relative mt-5 border border-loss/45 bg-loss/10 p-4 shadow-[0_0_26px_rgba(251,113,133,0.16)]">
              <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-loss">
                <Radar size={14} />
                {pick(roadmap.activeBadge)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-spectre">{pick(roadmap.activeDetail)}</p>
            </div>
          </header>

          <main className="relative z-10 bg-crypt p-5 md:p-7">
            <div className="grid grid-cols-2 border border-edge bg-void/50 p-1">
              {roadmap.halves.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveHalf(item.id)}
                  className={`min-h-[46px] px-3 font-display text-sm font-extrabold uppercase tracking-[0.08em] transition-all duration-300 hover:text-soul ${
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
              className="mt-5"
            >
              <div className="mb-5 border border-edge bg-void/45 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
                  {pick(half.kicker)}
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-soul md:text-3xl">
                  {pick(half.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-spectre">{pick(half.goal)}</p>
              </div>

              <div className="relative grid gap-4">
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

            <div className="mt-6 grid gap-3 border-t border-edge pt-5 sm:grid-cols-3">
              {[
                { icon: Shield, label: { en: "National Gate", lo: "ດ່ານລະດັບຊາດ" } },
                { icon: Radar, label: { en: "Active Mission", lo: "ພາລະກິດປັດຈຸບັນ" } },
                { icon: Crown, label: { en: "World Crown Path", lo: "ເສັ້ນທາງບັນລັງໂລກ" } },
              ].map(({ icon: Icon, label }) => (
                <div key={label.en} className="flex items-center gap-3 border border-edge bg-crypt/60 p-3">
                  <span className="grid h-9 w-9 place-items-center border border-amethyst/40 bg-void text-amethyst">
                    <Icon size={17} />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-spectre">
                    {pick(label)}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-30 grid h-10 w-10 place-items-center border border-edge bg-void/85 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
