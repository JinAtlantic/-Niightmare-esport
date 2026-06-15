"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import { formatDateTime } from "@/lib/format";
import site from "@/data/site.json";
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

const STATUS: Record<
  MatchStatus,
  { key: string; dot: string; text: string; ring: string; glow: string }
> = {
  next: {
    key: "sections.upcoming_status_next",
    dot: "bg-amethyst",
    text: "text-amethyst",
    ring: "border-amethyst/50",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.45)]",
  },
  live: {
    key: "sections.upcoming_status_live",
    dot: "bg-loss",
    text: "text-loss",
    ring: "border-loss/50",
    glow: "shadow-[0_0_20px_rgba(251,113,133,0.5)]",
  },
  practice: {
    key: "sections.upcoming_status_practice",
    dot: "bg-spectre",
    text: "text-spectre",
    ring: "border-spectre/40",
    glow: "shadow-[0_0_16px_rgba(201,180,246,0.4)]",
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
    <div className="flex w-[34vw] max-w-[180px] flex-col items-center gap-3.5">
      <div
        className={`relative grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-[#1A0A2E] to-[#08060F] transition-transform duration-300 hover:scale-[1.04] md:h-[120px] md:w-[120px] ${
          home
            ? "border-amethyst/70 shadow-[0_0_34px_rgba(168,85,247,0.4)]"
            : "border-edge-bright shadow-[0_0_18px_rgba(0,0,0,0.5)]"
        }`}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={name}
            className="h-full w-full object-contain p-1.5"
          />
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

function CountdownBlock({ cd }: { cd: Countdown }) {
  const cell = (v: string, label: string) => (
    <div className="flex flex-col items-center">
      <span className="font-mono text-[clamp(20px,5vw,30px)] font-bold tabular-nums leading-none text-soul [text-shadow:0_0_22px_rgba(168,85,247,0.35)]">
        {v}
      </span>
      <span className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ash-dim">
        {label}
      </span>
    </div>
  );
  const sep = (
    <span className="self-start pt-1 font-mono text-[clamp(18px,4vw,26px)] font-bold text-amethyst/60">
      :
    </span>
  );
  return (
    <div className="flex items-center gap-3 md:gap-4">
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
  const match = site.upcomingMatch as UpcomingMatchData;
  const status: MatchStatus = match.status ?? "next";
  const s = STATUS[status] ?? STATUS.next;
  const GameIcon = match.game === "efootball" ? EfootballIcon : MlbbIcon;

  const hasOpponent = Boolean(match.opponent && match.opponent.trim());
  const round =
    match.round && (match.round.en || match.round.lo) ? match.round : null;

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
    <section className="relative overflow-hidden border-y border-edge bg-[#0c0915]">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 130% at 50% 0%, rgba(168,85,247,0.16), transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
        {/* status badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-2.5 rounded-full border bg-void/70 px-4 py-1.5 backdrop-blur ${s.ring} ${s.glow}`}
          >
            <span className="relative flex h-2 w-2">
              {status === "live" && (
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping ${s.dot}`}
                />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`}
              />
            </span>
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-[0.3em] ${s.text}`}
            >
              {t(s.key)}
            </span>
            <span aria-hidden className="h-3 w-px bg-edge-bright" />
            <GameIcon size={14} className={s.text} />
          </span>
        </div>

        {/* head-to-head */}
        <div className="mt-12 flex items-center justify-center gap-3 sm:gap-8 md:gap-14">
          <TeamSide logo="/logo.png" name="NIIGHTMARE" home />

          {hasOpponent ? (
            <>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-bold uppercase italic tracking-[0.1em] text-glow [text-shadow:0_0_28px_rgba(199,125,255,0.55)] md:text-5xl">
                  {t("common.vs")}
                </span>
              </div>
              <TeamSide logo={match.opponentLogo} name={match.opponent} />
            </>
          ) : (
            <div className="flex w-[34vw] max-w-[180px] flex-col items-center gap-3.5">
              <div className="grid h-[88px] w-[88px] place-items-center rounded-full border-2 border-dashed border-edge-bright bg-void/40 md:h-[120px] md:w-[120px]">
                <GameIcon size={40} className="text-ash" />
              </div>
              <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-spectre md:text-lg">
                {t("sections.upcoming_practice_label")}
              </span>
            </div>
          )}
        </div>

        {/* tournament + round */}
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="font-display text-lg font-bold uppercase tracking-[0.08em] text-soul md:text-2xl">
            {pick(match.tournament)}
          </p>
          {round && (
            <span className="inline-flex items-center border border-amethyst/40 bg-amethyst/[0.08] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-spectre">
              {pick(round)}
            </span>
          )}
        </div>

        {/* time + countdown */}
        <div className="mt-8 flex flex-col items-center gap-6">
          <p className="font-mono text-sm tracking-[0.06em] text-ash">
            {cd ? formatDateTime(match.date, lang) : "—"}
          </p>

          {showCountdown && cd && <CountdownBlock cd={cd} />}

          {status === "live" && (
            <span className="inline-flex items-center gap-2 font-display text-base font-bold uppercase tracking-[0.16em] text-loss">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-loss opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-loss" />
              </span>
              {t("sections.upcoming_status_live")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
