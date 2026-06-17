"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { X, Briefcase } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SocialLinks from "@/components/ui/SocialLinks";
import CopyEmailButton from "@/components/ui/CopyEmailButton";
import type { StaffMember } from "@/lib/types";

/**
 * Staff / management detail dialog. Same premium shell as PlayerModal (framer
 * bloom, pinned portrait + scrolling content on desktop, whole-panel scroll on
 * mobile, fixed close). Order: Real Name → Nickname → Official Role →
 * Responsibility → Contact (business email + socials).
 */
export default function StaffModal({
  member,
  onClose,
}: {
  member: StaffMember;
  onClose: () => void;
}) {
  const { pick, t } = useLanguage();
  const { site } = useContent();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const title = member.name || member.ign || "";
  const nickname = member.ign && member.name && member.ign !== member.name ? member.ign : null;
  const bio = member.bio ? pick(member.bio) : t("roster.responsibility_fallback");
  const email = member.email || site.contact.email;
  const monogram = title
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
      aria-label={`${title} — ${t("roster.staff_kicker")}`}
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
        <div className="modal-scroll clip-esports relative flex max-h-[85vh] flex-col overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt shadow-[0_0_60px_rgba(168,85,247,0.35)] md:max-h-[80vh] md:flex-row md:overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent"
          />

          {/* LEFT — portrait (pinned on desktop) */}
          <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden border-b border-edge bg-gradient-to-br from-amethyst-deep/30 via-crypt to-void md:aspect-auto md:w-[42%] md:border-b-0 md:border-r">
            {member.photo ? (
              <Image
                src={member.photo}
                alt={title}
                fill
                sizes="(min-width: 768px) 320px, 100vw"
                className="object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="keep-latin select-none font-display text-8xl font-bold text-spectre/20">
                  {monogram}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — scrollable content (desktop) */}
          <div className="modal-scroll relative flex flex-1 flex-col p-6 md:max-h-[80vh] md:overflow-y-auto md:p-8">
            <p className="mb-4 inline-flex items-center gap-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-spectre/70">
              <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
              {t("roster.staff_kicker")}
            </p>

            {/* Real name — prominent */}
            <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-wide text-soul [text-shadow:0_2px_24px_rgba(168,85,247,0.3)] md:text-4xl">
              {title}
            </h2>

            {/* Nickname */}
            {nickname && (
              <p className="keep-latin mt-2 font-mono text-sm text-spectre">{nickname}</p>
            )}

            {/* Official role — neon violet */}
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ash-dim">
                {t("roster.official_role")}
              </p>
              <p className="mt-1.5 inline-flex w-fit items-center border-l-2 border-amethyst pl-2.5 font-display text-base font-bold uppercase tracking-[0.12em] text-glow">
                {pick(member.role)}
              </p>
            </div>

            {/* Responsibility / bio */}
            <div className="mt-6">
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-spectre/80">
                <Briefcase size={14} strokeWidth={2} className="text-amethyst" />
                {t("roster.responsibility")}
              </p>
              <p className="text-sm leading-relaxed text-ash">{bio}</p>
            </div>

            {/* Contact — business email + socials */}
            <div className="mt-7 border-t border-edge pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <CopyEmailButton email={email} />
                <SocialLinks socials={member.socials} size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* close — pinned */}
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
