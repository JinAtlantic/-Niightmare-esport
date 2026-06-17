"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  X,
  Smartphone,
  Headphones,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import SocialLinks from "@/components/ui/SocialLinks";
import CopyEmailButton from "@/components/ui/CopyEmailButton";
import type { Player } from "@/lib/types";

function SectionHead({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-spectre/80">
      <Icon size={14} strokeWidth={2} className="text-amethyst" />
      {label}
    </p>
  );
}

/** A labelled gear row. */
function GearRow({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-edge bg-void/50 text-amethyst">
        <Icon size={17} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash-dim">{label}</p>
        <p className="keep-latin truncate font-display text-sm font-bold uppercase tracking-[0.04em] text-soul">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Player detail dialog. Framer-Motion violet bloom on open/close. Desktop: fixed
 * height, the portrait is pinned on the left while only the right content column
 * scrolls (thin violet scrollbar). Mobile: stacked, the whole panel scrolls. The
 * close button is pinned to the dialog corner and never scrolls away.
 */
export default function PlayerModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const { pick, t } = useLanguage();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const tba = t("roster.tba");
  const winRate = player.winRate || "—";

  // ESC to close + lock body scroll + focus the close button.
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
      aria-label={`${player.ign} — ${t("roster.profile_kicker")}`}
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
        className="relative z-10 w-full max-w-3xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 10 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 24, mass: 0.7 }}
      >
        {/* panel: mobile = whole panel scrolls; desktop = fixed height, only the
            right column scrolls (left portrait is pinned). */}
        <div className="modal-scroll clip-esports relative flex max-h-[85vh] flex-col overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_60px_rgba(168,85,247,0.35)] md:max-h-[80vh] md:flex-row md:overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
          />

          {/* LEFT — portrait (pinned on desktop, fills the column height) */}
          <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden border-b border-edge bg-gradient-to-br from-amethyst-deep/30 via-crypt to-void md:aspect-auto md:w-[42%] md:border-b-0 md:border-r">
            {player.photo ? (
              <Image
                src={player.photo}
                alt={player.ign}
                fill
                sizes="(min-width: 768px) 320px, 100vw"
                style={{
                  objectPosition: `${crop.x}% ${crop.y}%`,
                  transform: `scale(${crop.zoom})`,
                  transformOrigin: `${crop.x}% ${crop.y}%`,
                }}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="keep-latin select-none font-display text-8xl font-bold text-spectre/20">
                  {monogram}
                </span>
              </div>
            )}
            <span
              className={`absolute left-3 top-3 z-10 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm ${
                player.sub
                  ? "border-edge-bright bg-void/60 text-ash"
                  : "border-amethyst/60 bg-amethyst/10 text-spectre shadow-[0_0_12px_rgba(168,85,247,0.55)]"
              }`}
            >
              {player.sub ? t("roster.badge_sub") : t("roster.badge_main")}
            </span>
          </div>

          {/* RIGHT — scrollable content (desktop) */}
          <div className="modal-scroll relative flex flex-1 flex-col p-6 md:max-h-[80vh] md:overflow-y-auto md:p-8">
            <p className="mb-4 inline-flex items-center gap-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-spectre/70">
              <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
              {t("roster.profile_kicker")}
            </p>

            {/* IGN — most prominent */}
            <h2 className="keep-latin font-display text-3xl font-bold uppercase leading-none tracking-wide text-soul [text-shadow:0_2px_24px_rgba(168,85,247,0.3)] md:text-4xl">
              {player.ign}
            </h2>

            {/* ROLE — neon violet, right under IGN */}
            <p className="mt-3 inline-flex w-fit items-center border-l-2 border-amethyst pl-2.5 font-display text-base font-bold uppercase tracking-[0.12em] text-glow">
              {pick(player.role)}
            </p>

            {/* Real name */}
            {player.name && (
              <p className="mt-2 font-mono text-sm text-spectre">{player.name}</p>
            )}

            {/* SIGNATURE HEROES + WIN RATE */}
            <div className="mt-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-spectre/80">
                  <Swords size={14} strokeWidth={2} className="text-amethyst" />
                  {t("roster.signature_heroes")}
                </p>
                <div className="text-right leading-none">
                  <p className="flex items-center justify-end gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ash-dim">
                    <Trophy size={11} className="text-amethyst" />
                    {t("roster.win_rate")}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums text-glow">
                    {winRate}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => {
                  const name = player.heroes?.[i];
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amethyst/40 bg-void/40 p-3 transition-colors duration-300 hover:border-amethyst/70"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amethyst/10 text-amethyst">
                        <Swords size={18} strokeWidth={1.75} />
                      </span>
                      <span className="keep-latin w-full truncate text-center font-mono text-[10px] uppercase tracking-wide text-soul">
                        {name || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GEAR */}
            <div className="mt-6">
              <SectionHead Icon={Smartphone} label={t("roster.gear_label")} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <GearRow Icon={Smartphone} label={t("roster.gear_device")} value={player.gear?.device || tba} />
                <GearRow Icon={Headphones} label={t("roster.gear_audio")} value={player.gear?.audio || tba} />
              </div>
            </div>

            {/* SOCIAL — bottom (business email copy button shown when set) */}
            <div className="mt-7 border-t border-edge pt-6">
              <div className="flex flex-wrap items-center gap-2">
                {player.email && <CopyEmailButton email={player.email} />}
                <SocialLinks socials={player.socials} size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* close — pinned to the dialog corner, never scrolls away */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-2 top-2 z-30 grid h-10 w-10 place-items-center border border-edge bg-void/80 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
