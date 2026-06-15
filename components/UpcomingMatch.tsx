"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import { formatDateTime } from "@/lib/format";
import { useContent } from "@/components/ContentContext";
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

/** A framed team crest with its name. `home` adds the violet glow ring. */
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
    <div className="flex w-[32vw] max-w-[190px] flex-col items-center gap-3.5">
      <div
        className={`relative grid h-[94px] w-[94px] place-items-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-[#1A0A2E] to-[#08060F] transition-transform duration-300 hover:scale-[1.05] md:h-[128px] md:w-[128px] ${
          home
            ? "border-amethyst/70 shadow-[0_0_40px_rgba(168,85,247,0.45)]"
            : "border-edge-bright shadow-[0_0_18px_rgba(0,0,0,0.5)]"
        }`}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="h-full w-full object-contain p-1.5" />
        ) : (
          <span
            className="keep-latin font-display text-2xl font-bold text-ash md:text-4xl"
            aria-hidden
          >
            {initials(name)}
          </span>
        )}
      </div>
      <span
        className={`keep-latin text-center font-display text-sm font-bold uppercase leading-tight tracking-[0.1em] md:text-lg ${
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
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-ash-dim">{label}</span>
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

      <div className="relative mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-28">
        {/* status badge — clean (no dot/icon), with a slow light sweep */}
        <div className="flex justify-center">
          <span
            className={`relative inline-flex items-center overflow-hidden rounded-full border bg-void/70 px-7 py-2.5 backdrop-blur ${s.ring} ${s.glow}`}
          >
            {status === "next" && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/15 to-transparent motion-safe:animate-slashSlide"
              />
            )}
            <span
              className={`relative font-display text-sm font-bold uppercase tracking-[0.42em] ${s.text}`}
            >
              {t(s.key)}
            </span>
          </span>
        </div>

        {/* head-to-head */}
        <div className="mt-14 flex items-center justify-center gap-3 sm:gap-10 md:gap-16">
          <TeamSide logo="/logo.png" name="NIIGHTMARE" home />

          {hasOpponent ? (
            <>
              <div className="relative flex flex-col items-center">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(199,125,255,0.35), transparent 70%)" }}
                />
                <span className="font-display text-4xl font-bold uppercase italic tracking-[0.08em] text-glow [text-shadow:0_0_34px_rgba(199,125,255,0.65)] md:text-6xl">
                  {t("common.vs")}
                </span>
              </div>
              <TeamSide logo={match.opponentLogo} name={match.opponent} />
            </>
          ) : (
            <div className="flex w-[32vw] max-w-[190px] flex-col items-center gap-3.5">
              <div className="grid h-[94px] w-[94px] place-items-center rounded-full border-2 border-dashed border-edge-bright bg-void/40 md:h-[128px] md:w-[128px]">
                <GameIcon size={44} className="text-ash" />
              </div>
              <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-spectre md:text-lg">
                {t("sections.upcoming_practice_label")}
              </span>
            </div>
          )}
        </div>

        {/* tournament + round */}
        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <p className="font-display text-xl font-bold uppercase tracking-[0.06em] text-soul md:text-3xl">
            {pick(match.tournament)}
          </p>
          {round && (
            <span className="inline-flex items-center border border-amethyst/40 bg-amethyst/[0.08] px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-spectre">
              {pick(round)}
            </span>
          )}
        </div>

        {/* time + countdown */}
        <div className="mt-10 flex flex-col items-center gap-7">
          <p className="font-mono text-sm tracking-[0.08em] text-ash">
            {cd ? formatDateTime(match.date, lang) : "—"}
          </p>

          {showCountdown && cd && <CountdownBlock cd={cd} />}

          {status === "live" && (
            <span className="inline-flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-[0.18em] text-loss">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-loss opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-loss" />
              </span>
              {t("sections.upcoming_status_live")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
