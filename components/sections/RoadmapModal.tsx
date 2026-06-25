"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X, Flag, Swords, Globe2, Crown, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import {
  ROADMAP_INTRO,
  ROADMAP_STEPS,
  type RoadmapStep,
  type RoadmapTier,
} from "@/lib/roadmap";

/**
 * Per-tier visual language. Full class strings (no interpolation) so Tailwind's
 * JIT keeps them. The ascent climbs in prominence: bronze qualifier → blue
 * regional → gold global → the gold/crimson World Championship apex (the single
 * brightest thing on screen).
 */
const TIER: Record<
  RoadmapTier,
  {
    badge: string;
    ring: string; // node ring + glow
    cardBorder: string;
    cardGlow: string;
    icon: LucideIcon;
    iconText: string;
  }
> = {
  qualifier: {
    badge: "border-bronze/45 bg-bronze/10 text-bronze",
    ring: "border-bronze shadow-[0_0_14px_rgba(206,138,87,0.55)]",
    cardBorder: "border-bronze/25",
    cardGlow: "",
    icon: Flag,
    iconText: "text-bronze",
  },
  regional: {
    badge: "border-[#38BDF8]/45 bg-[#38BDF8]/10 text-[#7DD3FC]",
    ring: "border-[#38BDF8] shadow-[0_0_14px_rgba(56,189,248,0.6)]",
    cardBorder: "border-[#38BDF8]/25",
    cardGlow: "",
    icon: Swords,
    iconText: "text-[#7DD3FC]",
  },
  global: {
    badge: "border-gold/45 bg-gold/10 text-gold",
    ring: "border-gold shadow-[0_0_18px_rgba(245,196,81,0.7)]",
    cardBorder: "border-gold/30",
    cardGlow: "shadow-[0_0_30px_-12px_rgba(245,196,81,0.45)]",
    icon: Globe2,
    iconText: "text-gold",
  },
  worlds: {
    badge: "border-gold/60 bg-gradient-to-r from-gold/20 via-gold/10 to-loss/20 text-gold",
    ring: "border-gold shadow-[0_0_24px_rgba(245,196,81,0.95)]",
    cardBorder: "border-gold/55",
    cardGlow: "shadow-[0_0_44px_-8px_rgba(245,196,81,0.55)]",
    icon: Crown,
    iconText: "text-gold",
  },
};

function Stage({ step }: { step: RoadmapStep }) {
  const { pick } = useLanguage();
  const c = TIER[step.tier];
  const Icon = c.icon;
  const apex = step.tier === "worlds";

  return (
    <li className="relative pl-14 md:pl-16">
      {/* spine node — icon in a tier-coloured ring */}
      <span
        aria-hidden
        className={`absolute left-5 top-1 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border-2 bg-void ${c.ring}`}
      >
        <Icon size={17} strokeWidth={2} className={c.iconText} />
      </span>

      <div
        className={`relative overflow-hidden border bg-gradient-to-br from-crypt2/70 via-crypt/60 to-void p-4 md:p-5 ${c.cardBorder} ${c.cardGlow}`}
      >
        {/* apex gets a top hairline to read as the prize */}
        {apex && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
          />
        )}
        {/* big ghost phase number */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 top-1 select-none font-display text-5xl font-bold leading-none text-soul/[0.05] md:text-6xl"
        >
          {step.phase}
        </span>

        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${c.badge}`}
          >
            {pick(step.tierTag)}
          </span>
          <span className="keep-latin font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            {pick(step.system)}
          </span>
        </div>

        <h3
          className={`mt-2.5 font-display text-xl font-extrabold uppercase leading-tight tracking-tight md:text-2xl ${
            apex
              ? "text-gold [text-shadow:0_0_24px_rgba(245,196,81,0.4)]"
              : "text-soul"
          }`}
        >
          {pick(step.title)}
        </h3>

        <p className="mt-2 max-w-prose text-sm leading-relaxed text-spectre/85">
          {pick(step.detail)}
        </p>
      </div>
    </li>
  );
}

/**
 * "Esports Roadmap" dialog — a vertical, ascending timeline of the four
 * competitive stages. Framer-Motion bloom on open/close, ESC + backdrop close,
 * body-scroll lock, focus pinned to the close button. Mount it inside an
 * <AnimatePresence> so the exit animation plays.
 */
export default function RoadmapModal({ onClose }: { onClose: () => void }) {
  const { pick } = useLanguage();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

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
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={pick(ROADMAP_INTRO.title)}
    >
      <motion.div
        className="absolute inset-0 bg-black/82 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
        transition={
          reduce
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 260, damping: 24, mass: 0.7 }
        }
      >
        <div className="modal-scroll clip-esports relative flex max-h-[88vh] flex-col overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_60px_rgba(168,85,247,0.35)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
          />
          {/* HUD corner ticks — broadcast frame */}
          <span aria-hidden className="pointer-events-none absolute right-0 top-0 z-20 h-4 w-4 border-r-2 border-t-2 border-amethyst/55" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-20 h-4 w-4 border-b-2 border-l-2 border-amethyst/40" />

          {/* HEADER */}
          <div className="relative border-b border-edge bg-gradient-to-b from-amethyst/[0.12] to-transparent px-6 py-7 md:px-8">
            <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-spectre/80">
              <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
              {pick(ROADMAP_INTRO.kicker)}
            </p>
            <h2 className="keep-latin mt-3 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-soul [text-shadow:0_2px_28px_rgba(168,85,247,0.32)] md:text-4xl">
              {pick(ROADMAP_INTRO.title)}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-spectre/85">
              {pick(ROADMAP_INTRO.blurb)}
            </p>
          </div>

          {/* TIMELINE */}
          <div className="relative px-6 py-8 md:px-8">
            {/* ascending spine: bronze → blue → gold (climbs in value) */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-10 left-[44px] top-9 w-[2px] md:left-[52px]"
              style={{
                background:
                  "linear-gradient(to bottom, #CE8A57 0%, #38BDF8 38%, #F5C451 72%, #F5C451 100%)",
              }}
            />
            <ol className="space-y-5">
              {ROADMAP_STEPS.map((step) => (
                <Stage key={step.phase} step={step} />
              ))}
            </ol>
          </div>
        </div>

        {/* close — pinned to the dialog corner */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-30 grid h-10 w-10 place-items-center border border-edge bg-void/80 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
