"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Globe2,
  Languages,
  Shield,
  Swords,
  Ticket,
  Trophy,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import {
  resolveMlbbEsportSystem,
  type MlbbEsportSystemContent,
  type MlbbSystemPillarAccent,
} from "@/lib/mlbbEsportSystem";
import type { Lang } from "@/lib/types";

const ACCENT: Record<
  MlbbSystemPillarAccent,
  { icon: LucideIcon; blade: string; badge: string; glow: string }
> = {
  national: {
    icon: Shield,
    blade: "border-l-amethyst",
    badge: "border-amethyst/55 bg-amethyst/12 text-glow",
    glow: "shadow-[0_0_24px_-10px_rgba(168,85,247,0.85)]",
  },
  mekong: {
    icon: Waves,
    blade: "border-l-[#38BDF8]",
    badge: "border-[#38BDF8]/55 bg-[#38BDF8]/12 text-[#7DD3FC]",
    glow: "shadow-[0_0_24px_-10px_rgba(56,189,248,0.8)]",
  },
  global: {
    icon: Crown,
    blade: "border-l-gold",
    badge: "border-gold/60 bg-gold/12 text-gold",
    glow: "shadow-[0_0_28px_-10px_rgba(245,196,81,0.9)]",
  },
};

function LanguageButton({
  value,
  active,
  onClick,
}: {
  value: Lang;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
        active
          ? "border-amethyst bg-amethyst/20 text-soul"
          : "border-edge bg-void/60 text-ash hover:border-edge-bright hover:text-soul"
      }`}
    >
      {value === "lo" ? "Lao" : "EN"}
    </button>
  );
}

export default function MlbbEsportSystemModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { site } = useContent();
  const { lang, setLang, pick } = useLanguage();
  const [tab, setTab] = useState<"pillars" | "calendar">("pillars");
  const content = resolveMlbbEsportSystem(
    (site as { mlbbEsportSystem?: Partial<MlbbEsportSystemContent> }).mlbbEsportSystem
  );

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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={pick(content.buttonLabel)}
    >
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

          <div className="relative z-10 overflow-hidden border-b border-edge bg-gradient-to-br from-crypt2 via-crypt to-void p-5 md:p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 border-l border-amethyst/15 bg-amethyst/[0.05] [clip-path:polygon(34%_0,100%_0,100%_100%,0_100%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-spectre">
                  <Globe2 size={14} className="text-amethyst" />
                  {pick(content.hero.kicker)}
                </p>
                <h2 className="keep-latin mt-3 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-soul md:text-5xl">
                  {pick(content.hero.title)}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-spectre md:text-base">
                  {pick(content.hero.intro)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3">
                <span className="inline-flex items-center gap-2 border border-loss/45 bg-loss/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-loss">
                  <Ticket size={14} />
                  {pick(content.hero.badge)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center border border-edge bg-void/70 text-amethyst">
                    <Languages size={16} />
                  </span>
                  {/* Language switcher: updates the shared site language context,
                      so all bilingual content in this dialog re-renders instantly. */}
                  <LanguageButton value="lo" active={lang === "lo"} onClick={() => setLang("lo")} />
                  <LanguageButton value="en" active={lang === "en"} onClick={() => setLang("en")} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-crypt p-5 md:p-7">
            <div className="grid grid-cols-2 border border-edge bg-void/50 p-1">
              {(["pillars", "calendar"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`min-h-[44px] px-3 font-display text-sm font-extrabold uppercase tracking-[0.12em] transition-colors ${
                    tab === id ? "bg-amethyst/18 text-soul shadow-glow-soft" : "text-ash hover:text-soul"
                  }`}
                >
                  {pick(content.tabs[id])}
                </button>
              ))}
            </div>

            {tab === "pillars" ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {content.pillars.map((pillar, i) => {
                  const accent = ACCENT[pillar.accent] ?? ACCENT.national;
                  const Icon = accent.icon;
                  return (
                    <article
                      key={i}
                      className={`relative overflow-hidden border border-edge border-l-4 ${accent.blade} bg-gradient-to-br from-crypt2/75 via-crypt/60 to-void p-4 ${accent.glow}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${accent.badge}`}>
                          {pick(pillar.eyebrow)}
                        </span>
                        <Icon size={22} className="text-spectre" />
                      </div>
                      <h3 className="mt-4 font-display text-xl font-extrabold uppercase leading-tight text-soul">
                        {pick(pillar.title)}
                      </h3>
                      <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-glow">
                        {pick(pillar.subtitle)}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-spectre">{pick(pillar.body)}</p>
                      <ul className="mt-4 space-y-2">
                        {pillar.details.map((detail, k) => (
                          <li key={k} className="flex items-start gap-2 text-sm text-ash">
                            <Check size={15} className="mt-0.5 shrink-0 text-win" />
                            <span>{pick(detail)}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5">
                <div className="grid gap-4">
                  {content.calendar.map((step, i) => (
                    <article key={i} className="relative grid gap-4 border border-edge bg-void/45 p-4 md:grid-cols-[120px_1fr] md:p-5">
                      <div className="flex items-center gap-3 md:block">
                        <div className="grid h-14 w-14 place-items-center border border-amethyst/50 bg-amethyst/10 font-display text-xl font-extrabold text-glow md:h-16 md:w-16">
                          {step.quarter}
                        </div>
                        <p className="keep-latin mt-0 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-spectre md:mt-3">
                          {pick(step.window)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-soul md:text-2xl">
                          {pick(step.title)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-spectre">{pick(step.body)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.tags.map((tag, k) => (
                            <span key={k} className="border border-edge bg-crypt px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ash">
                              {pick(tag)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {i < content.calendar.length - 1 && (
                        <ChevronRight
                          aria-hidden
                          size={18}
                          className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 rotate-90 text-amethyst md:block"
                        />
                      )}
                    </article>
                  ))}
                </div>
                <div className="mt-5 border border-gold/40 bg-gold/10 p-4">
                  <p className="flex items-start gap-3 text-sm leading-relaxed text-spectre">
                    <Trophy size={18} className="mt-0.5 shrink-0 text-gold" />
                    <span>{pick(content.sponsorNote)}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3 border-t border-edge pt-5 sm:grid-cols-3">
              {[
                { icon: Swords, label: { en: "Pro Circuit", lo: "Pro Circuit" } },
                { icon: CalendarDays, label: { en: "Season Windows", lo: "ຊ່ວງລະດູການ" } },
                { icon: Crown, label: { en: "World Championship Path", lo: "ເສັ້ນທາງຊິງແຊ້ມໂລກ" } },
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
          </div>
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
