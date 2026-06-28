"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  X,
  Database,
} from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import SocialLinks from "@/components/ui/SocialLinks";
import CopyEmailButton from "@/components/ui/CopyEmailButton";
import { formatDate } from "@/lib/format";
import { calculateAge, countryFlag, formatBirthDate } from "@/lib/personProfile";
import type { Player } from "@/lib/types";

function SectionHead({ label }: { label: string }) {
  return (
    <p className="mb-3 border-l-2 border-amethyst pl-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-spectre/85">
      {label}
    </p>
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
  const { pick, t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const tba = t("roster.tba");
  const bio = player.description ? pick(player.description) : "";
  const flag = countryFlag(player.countryCode);
  const countryName = player.country ? pick(player.country) : player.countryCode?.toUpperCase();
  const birthDate = formatBirthDate(player.birthDate, lang);
  const age = calculateAge(player.birthDate);

  // Roster tenure periods — some players leave and return, so this can be
  // several "<joined> – <left|Present>" spans. Empty when none are set.
  const tenures = (player.tenures ?? []).filter((tn) => tn.joined);

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
        <div className="modal-scroll clip-esports relative flex max-h-[85vh] flex-col overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_60px_rgba(168,85,247,0.35)] md:max-h-[80vh] md:min-h-[440px] md:flex-row md:overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
          />
          {/* HUD corner ticks — broadcast frame (on the square corners that
              clip-esports leaves intact: top-right + bottom-left) */}
          <span aria-hidden className="pointer-events-none absolute right-0 top-0 z-20 h-4 w-4 border-r-2 border-t-2 border-amethyst/55" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-20 h-4 w-4 border-b-2 border-l-2 border-amethyst/40" />

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
              <div className="absolute inset-0 overflow-hidden">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.22),transparent_62%)]" />
                <div aria-hidden className="absolute left-1/2 top-1/2 h-[2px] w-[150%] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] bg-gradient-to-r from-transparent via-amethyst/25 to-transparent" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="keep-latin select-none font-display text-8xl font-bold text-spectre/25">
                    {monogram}
                  </span>
                </div>
              </div>
            )}
            {/* base gradient grounds the portrait into the panel */}
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 bg-gradient-to-t from-crypt via-crypt/25 to-transparent" />
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

            {(flag || countryName || birthDate || age !== null) && (
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {(flag || countryName) && (
                  <div className="border border-edge bg-void/45 px-3 py-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">
                      {t("roster.country_label")}
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-mono text-xs font-semibold uppercase text-soul">
                      {flag && <span className="text-base leading-none">{flag}</span>}
                      {countryName && <span className="truncate">{countryName}</span>}
                    </p>
                  </div>
                )}
                {birthDate && (
                  <div className="border border-edge bg-void/45 px-3 py-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">
                      {t("roster.birth_date")}
                    </p>
                    <p className="mt-1 keep-latin font-mono text-xs font-semibold text-soul">{birthDate}</p>
                  </div>
                )}
                {age !== null && (
                  <div className="border border-edge bg-void/45 px-3 py-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ash-dim">
                      {t("roster.age_label")}
                    </p>
                    <p className="mt-1 keep-latin font-mono text-xs font-semibold text-soul">
                      {age} {t("roster.years_old")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ABOUT — short career bio */}
            <div className="mt-7">
              <SectionHead label={t("roster.about_label")} />
              {bio ? (
                <p className="keep-latin text-sm leading-relaxed text-spectre">{bio}</p>
              ) : (
                <p className="font-mono text-sm text-ash-dim">{tba}</p>
              )}
            </div>

            {tenures.length > 0 && (
              <div className="mt-6">
                <SectionHead label={t("roster.team_period")} />
                <div className="grid gap-2">
                  {tenures.map((tn, idx) => (
                    <p key={idx} className="border border-edge bg-void/40 px-3 py-2">
                      <span className="keep-latin font-mono text-xs font-medium tracking-wide text-spectre">
                        {formatDate(tn.joined, lang)} – {tn.left ? formatDate(tn.left, lang) : t("roster.present")}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* SOCIAL — pinned to the bottom on desktop so the column fills evenly */}
            <div className="mt-7 border-t border-edge pt-6 md:mt-auto">
              <div className="flex flex-wrap items-center gap-2">
                {player.email && <CopyEmailButton email={player.email} />}
                <SocialLinks socials={player.socials} size={18} />
                {player.liquipedia && (
                  <a
                    href={player.liquipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${player.ign} — Liquipedia`}
                    title="Liquipedia"
                    className="hover-glow inline-flex h-11 items-center gap-2 border border-edge bg-crypt px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  >
                    <Database size={16} strokeWidth={1.75} />
                    Liquipedia
                  </a>
                )}
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
