"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/context/LanguageContext";
import { EfootballIcon, MlbbIcon, PlayIcon } from "@/components/ui/Icons";
import { formatDateTime } from "@/lib/format";
import { useContent } from "@/components/context/ContentContext";
import type { MatchStatus, UpcomingMatch as UpcomingMatchData } from "@/lib/types";

type Countdown = { d: number; h: number; m: number; s: number; done: boolean };

function toCountdown(targetMs: number): Countdown {
  const d = targetMs - Date.now();
  if (d <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(d / 864e5),
    h: Math.floor((d % 864e5) / 36e5),
    m: Math.floor((d % 36e5) / 6e4),
    s: Math.floor((d % 6e4) / 1e3),
    done: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

function initials(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

const STATUS: Record<MatchStatus, { key: string; text: string; ring: string; glow: string }> = {
  next: {
    key: "sections.upcoming_status_next",
    text: "text-glow",
    ring: "border-amethyst/60",
    glow: "shadow-[0_0_26px_rgba(168,85,247,0.5)]",
  },
  live: {
    key: "sections.upcoming_status_live",
    text: "text-loss",
    ring: "border-loss/60",
    glow: "shadow-[0_0_26px_rgba(251,113,133,0.55)]",
  },
  practice: {
    key: "sections.upcoming_status_practice",
    text: "text-spectre",
    ring: "border-spectre/50",
    glow: "shadow-[0_0_20px_rgba(201,180,246,0.45)]",
  },
};

/**
 * One contender's zone in the split arena: a side label, full crest and name
 * over a directional color wash — violet for the home side, rose-steel for the
 * challenger — so the two halves read as opposing camps, not a mirrored pair.
 */
function TeamSide({
  logo,
  name,
  home = false,
}: {
  logo?: string | null;
  name: string;
  home?: boolean;
}) {
  return (
    <div className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden px-2 py-6 md:gap-5 md:px-5 md:py-14 lg:py-16">
      {/* directional wash — softly fading toward the centre seam */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          home
            ? "bg-gradient-to-r from-amethyst/[0.14] via-amethyst/[0.03] to-transparent"
            : "bg-gradient-to-l from-loss/[0.045] via-amethyst/[0.018] to-transparent"
        }`}
      />
      <div
        className="relative grid h-[68px] w-[68px] shrink-0 place-items-center transition-transform duration-300 group-hover:scale-[1.06] md:h-[156px] md:w-[156px] lg:h-[184px] lg:w-[184px]"
      >
        {logo ? (
          <Image
            src={logo}
            alt={name}
            fill
            sizes="(min-width: 1024px) 184px, (min-width: 768px) 156px, 88px"
            className={`object-contain ${
              home
                ? "drop-shadow-[0_0_26px_rgba(168,85,247,0.55)]"
                : "drop-shadow-[0_0_18px_rgba(0,0,0,0.65)]"
            }`}
          />
        ) : (
          <span
            className="keep-latin font-display text-xl font-bold text-ash md:text-5xl"
            aria-hidden
          >
            {initials(name)}
          </span>
        )}
      </div>
      <span
        className={`keep-latin relative max-w-full text-center font-display text-[0.95rem] font-bold uppercase leading-tight tracking-[0.04em] md:text-3xl md:tracking-[0.07em] lg:text-4xl ${
          home ? "text-soul" : "text-spectre"
        }`}
      >
        {name}
      </span>
    </div>
  );
}

/** Segmented, glowing countdown — the section's signature flair. */
function CountdownBlock({ cd }: { cd: Countdown }) {
  const cell = (v: string, label: string) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid h-[60px] w-[54px] place-items-center overflow-hidden rounded-md border border-amethyst/30 bg-gradient-to-b from-crypt2/80 to-void/85 shadow-[0_0_20px_rgba(168,85,247,0.16)] md:h-[80px] md:w-[72px]">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent"
        />
        <span className="font-mono text-[clamp(24px,6vw,42px)] font-bold tabular-nums leading-none text-soul [text-shadow:0_0_18px_rgba(199,125,255,0.5)]">
          {v}
        </span>
      </div>
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-soul/80">{label}</span>
    </div>
  );
  const sep = (
    <span className="flex h-[60px] items-center font-mono text-2xl font-bold text-amethyst/50 md:h-[80px] md:text-3xl">
      :
    </span>
  );
  return (
    <div className="flex items-start gap-2 md:gap-3">
      {cell(String(cd.d), "Days")}
      {sep}
      {cell(pad(cd.h), "Hrs")}
      {sep}
      {cell(pad(cd.m), "Min")}
      {sep}
      {cell(pad(cd.s), "Sec")}
    </div>
  );
}

export default function UpcomingMatch() {
  const { t, pick, lang } = useLanguage();
  const { site } = useContent();
  const match = site.upcomingMatch as UpcomingMatchData;
  const status: MatchStatus = match.status ?? "next";
  const s = STATUS[status] ?? STATUS.next;
  const GameIcon = match.game === "efootball" ? EfootballIcon : MlbbIcon;

  const hasOpponent = Boolean(match.opponent && match.opponent.trim());
  const round = match.round && (match.round.en || match.round.lo) ? match.round : null;

  // Countdown renders client-side only to avoid time-zone hydration mismatch.
  const [cd, setCd] = useState<Countdown | null>(null);
  useEffect(() => {
    const target = new Date(match.date).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => setCd(toCountdown(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [match.date]);

  const showCountdown = status === "next" && cd != null && !cd.done;

  return (
    <section className="relative overflow-hidden border-y border-edge bg-[#0b0813]">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      {/* ambient glow + center spotlight on the matchup */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 120% at 50% 0%, rgba(168,85,247,0.20), transparent 60%), radial-gradient(40% 60% at 50% 52%, rgba(199,125,255,0.10), transparent 70%)",
        }}
        aria-hidden
      />
      {/* faint cyberpunk grid — fills the open flanks on large screens */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(120%_100%_at_50%_0%,#000,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.9) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
        aria-hidden
      />
      {/* ambient blobs — violet left, rose right; only worth painting on wide screens */}
      <div
        className="pointer-events-none absolute -left-28 top-8 hidden h-72 w-72 rounded-full bg-amethyst/20 blur-[120px] md:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-28 bottom-8 hidden h-72 w-72 rounded-full bg-loss/15 blur-[120px] md:block"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 md:max-w-5xl md:px-6 md:py-28 lg:max-w-6xl">
        {/* section title — bold headline */}
        <div className="mb-7 text-center md:mb-12">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-[0.16em] text-soul [text-shadow:0_0_34px_rgba(168,85,247,0.5)] md:text-5xl lg:text-6xl">
            {t("sections.upcoming_match")}
          </h2>
          <span
            aria-hidden
            className="mx-auto mt-4 block h-[2px] w-20 bg-gradient-to-r from-transparent via-amethyst to-transparent md:mt-5 md:w-28"
          />
        </div>

        {/* ── the fixture card: one premium broadcast frame ───────────────── */}
        <div className="relative overflow-hidden rounded-md border border-edge-bright bg-gradient-to-b from-crypt/85 to-void/85 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_60px_-10px_rgba(168,85,247,0.18)] backdrop-blur-xl">
          {/* top blade edge + HUD corner ticks */}
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-amethyst/55" />
          <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-amethyst/55" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-amethyst/35" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-amethyst/35" />

          {/* eyebrow bar — game name + status, both centered */}
          <div className="flex flex-col items-center gap-3 border-b border-edge px-4 py-4 md:py-5">
            <span className="font-display text-base font-bold uppercase tracking-[0.26em] text-spectre md:text-xl">
              {match.game === "efootball" ? "eFootball" : "Mobile Legends: Bang Bang"}
            </span>
            <span
              className={`relative inline-flex items-center overflow-hidden rounded-full border bg-void/70 px-5 py-1.5 ${s.ring} ${s.glow}`}
            >
              {status === "next" && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/15 to-transparent motion-safe:animate-slashSlide"
                />
              )}
              <span className={`relative font-display text-[11px] font-bold uppercase tracking-[0.32em] ${s.text}`}>
                {t(s.key)}
              </span>
            </span>
          </div>

          {/* ── the clash: split arena ─────────────────────────────────────── */}
          {/* MOBILE: a vertical fight-card stack — each camp gets the full width
              and a big crest, split by the forged VS on a hairline seam. */}
          <div className="relative md:hidden">
            <div className="relative flex flex-col items-center gap-2.5 overflow-hidden px-5 pb-10 pt-9">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amethyst/[0.16] via-amethyst/[0.03] to-transparent"
              />
              <div className="relative grid h-[104px] w-[104px] place-items-center">
                <Image
                  src="/logo.png"
                  alt="NIIGHTMARE"
                  fill
                  sizes="104px"
                  className="object-contain drop-shadow-[0_0_26px_rgba(168,85,247,0.55)]"
                />
              </div>
              <span className="keep-latin relative max-w-full text-center font-display text-[1.7rem] font-bold uppercase leading-none tracking-[0.03em] text-soul">
                NIIGHTMARE
              </span>
            </div>

            {/* forged VS on a hairline seam between the two camps */}
            <div className="relative z-10 flex h-0 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-amethyst/45 to-transparent"
              />
              <div className="relative grid place-items-center">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(199,125,255,0.40), transparent 70%)" }}
                />
                <span
                  aria-hidden
                  className="absolute h-[56px] w-[56px] rotate-45 rounded-sm border border-amethyst/55 bg-gradient-to-br from-crypt2 to-void shadow-[0_0_26px_rgba(168,85,247,0.4)]"
                />
                <span
                  aria-hidden
                  className="absolute h-[46px] w-[46px] rotate-45 rounded-sm border border-amethyst/25"
                />
                <span className="relative grid h-[56px] w-[56px] place-items-center font-display text-2xl font-bold uppercase leading-none text-glow [text-shadow:0_0_30px_rgba(199,125,255,0.75)]">
                  {t("common.vs")}
                </span>
              </div>
            </div>

            {hasOpponent ? (
              <div className="relative flex flex-col items-center gap-2.5 overflow-hidden px-5 pb-9 pt-10">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-loss/[0.07] via-amethyst/[0.02] to-transparent"
                />
                <div className="relative grid h-[104px] w-[104px] place-items-center">
                  {match.opponentLogo ? (
                    <Image
                      src={match.opponentLogo}
                      alt={match.opponent}
                      fill
                      sizes="104px"
                      className="object-contain drop-shadow-[0_0_18px_rgba(0,0,0,0.65)]"
                    />
                  ) : (
                    <span className="keep-latin font-display text-4xl font-bold text-ash" aria-hidden>
                      {initials(match.opponent)}
                    </span>
                  )}
                </div>
                <span className="keep-latin relative max-w-full text-center font-display text-[1.7rem] font-bold uppercase leading-none tracking-[0.03em] text-spectre">
                  {match.opponent}
                </span>
              </div>
            ) : (
              <div className="relative flex flex-col items-center gap-3 overflow-hidden px-5 pb-9 pt-10">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-ash-dim">
                  {t("sections.upcoming_status_practice")}
                </span>
                <div className="grid h-[96px] w-[96px] place-items-center rounded-full border-2 border-dashed border-edge-bright bg-void/40">
                  <GameIcon size={40} className="text-ash" />
                </div>
                <span className="text-center font-display text-lg font-bold uppercase tracking-[0.07em] text-spectre">
                  {t("sections.upcoming_practice_label")}
                </span>
              </div>
            )}
          </div>

          {/* DESKTOP: split arena, side-by-side */}
          <div className="relative hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch md:grid">
            <TeamSide logo="/logo.png" name="NIIGHTMARE" home />

            {/* the blade seam + forged VS — the matchup's centerpiece */}
            <div className="relative z-10 flex items-center justify-center px-1 py-0 md:px-2">
              {/* seam: a faint skewed blade through the matchup */}
              <span
                aria-hidden
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -skew-x-[12deg] bg-gradient-to-b from-transparent via-amethyst/40 to-transparent"
              />
              <div className="relative grid place-items-center">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(199,125,255,0.38), transparent 70%)" }}
                />
                <span
                  aria-hidden
                  className="absolute h-[52px] w-[52px] rotate-45 rounded-sm border border-amethyst/55 bg-gradient-to-br from-crypt2 to-void shadow-[0_0_26px_rgba(168,85,247,0.4)] md:h-[92px] md:w-[92px] lg:h-[108px] lg:w-[108px]"
                />
                <span
                  aria-hidden
                  className="absolute h-[42px] w-[42px] rotate-45 rounded-sm border border-amethyst/25 md:h-[74px] md:w-[74px] lg:h-[88px] lg:w-[88px]"
                />
                <span className="relative inline-grid h-[52px] w-[52px] place-items-center font-display text-2xl font-bold uppercase leading-none tracking-normal text-glow [text-shadow:0_0_30px_rgba(199,125,255,0.75)] md:h-[92px] md:w-[92px] md:text-6xl lg:h-[108px] lg:w-[108px] lg:text-7xl">
                  {t("common.vs")}
                </span>
              </div>
            </div>

            {hasOpponent ? (
              <TeamSide logo={match.opponentLogo} name={match.opponent} />
            ) : (
              <div className="relative flex flex-1 flex-col items-center justify-center gap-3.5 overflow-hidden px-5 py-7 md:py-10">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-ash-dim">
                  {t("sections.upcoming_status_practice")}
                </span>
                <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full border-2 border-dashed border-edge-bright bg-void/40 md:h-[120px] md:w-[120px]">
                  <GameIcon size={42} className="text-ash" />
                </div>
                <span className="text-center font-display text-lg font-bold uppercase tracking-[0.07em] text-spectre md:text-2xl">
                  {t("sections.upcoming_practice_label")}
                </span>
              </div>
            )}
          </div>

          {/* ── tale of the tape: tournament · round · kickoff, cleanly divided ── */}
          <dl className="grid grid-cols-1 divide-y divide-edge border-t border-edge md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="flex items-baseline justify-between gap-4 px-5 py-4 text-left md:flex-col md:items-center md:gap-2 md:px-4 md:py-6 md:text-center">
              <dt className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amethyst md:text-sm">Tournament</dt>
              <dd className="min-w-0 text-right font-display text-base font-bold uppercase tracking-[0.03em] text-soul md:text-center md:text-2xl">
                {pick(match.tournament)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-5 py-4 text-left md:flex-col md:items-center md:gap-2 md:px-4 md:py-6 md:text-center">
              <dt className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amethyst md:text-sm">Round</dt>
              <dd className="min-w-0 text-right font-display text-base font-bold uppercase tracking-[0.03em] text-soul md:text-center md:text-2xl">
                {round ? pick(round) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-5 py-4 text-left md:flex-col md:items-center md:gap-2 md:px-4 md:py-6 md:text-center">
              <dt className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amethyst md:text-sm">Kickoff</dt>
              <dd className="min-w-0 text-right font-display text-base font-bold uppercase tracking-[0.03em] text-soul md:text-center md:text-2xl">
                {cd ? formatDateTime(match.date, lang) : "—"}
              </dd>
            </div>
          </dl>

          {/* ── footer band: countdown (upcoming) or live + watch CTA ─────────── */}
          {(showCountdown || status === "live") && (
            <div className="flex flex-col items-center gap-5 border-t border-edge bg-white/[0.015] px-4 py-7 md:gap-6 md:px-6 md:py-9">
              {showCountdown && cd && (
                <>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-soul/80">
                    Starts in
                  </span>
                  <CountdownBlock cd={cd} />
                </>
              )}

              {status === "live" && (
                <>
                  <span className="inline-flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-[0.18em] text-loss">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-loss opacity-70 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-loss" />
                    </span>
                    {t("sections.upcoming_status_live")}
                  </span>

                  {match.streamUrl && (
                    <a
                      href={match.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex w-full max-w-sm items-center justify-center gap-2.5 rounded-md border border-loss/60 bg-gradient-to-b from-loss/25 to-loss/10 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.2em] text-soul shadow-[0_0_30px_rgba(251,113,133,0.5)] transition-all duration-300 hover:from-loss/35 hover:to-loss/15 hover:shadow-[0_0_48px_rgba(251,113,133,0.78)] focus:outline-none focus-visible:ring-2 focus-visible:ring-loss focus-visible:ring-offset-2 focus-visible:ring-offset-void sm:w-auto md:text-base"
                    >
                      <PlayIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                      {t("sections.watch_live")}
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
