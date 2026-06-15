"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { formatDateTime } from "@/lib/format";
import site from "@/data/site.json";
import type { Bilingual, GameId } from "@/lib/types";

type Countdown = { d: number; h: number; m: number; s: number; done: boolean };

function diffToCountdown(targetMs: number): Countdown {
  const diff = targetMs - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(diff / 864e5),
    h: Math.floor((diff % 864e5) / 36e5),
    m: Math.floor((diff % 36e5) / 6e4),
    s: Math.floor((diff % 6e4) / 1e3),
    done: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Hero() {
  const { t, pick, lang } = useLanguage();
  const match = site.upcomingMatch as {
    date: string;
    game: GameId;
    tournament: Bilingual;
    opponent: string;
  };

  // Countdown + formatted date render client-side only, so server and client
  // markup always agree (no time-zone hydration mismatch).
  const [cd, setCd] = useState<Countdown | null>(null);
  useEffect(() => {
    const target = new Date(match.date).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => setCd(diffToCountdown(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [match.date]);

  return (
    <section
      className="hero-section flex flex-col items-center justify-center px-5 pb-36 pt-10 text-center md:px-14"
      style={{ minHeight: "calc(100svh - 4rem)" }}
    >
      {/* atmospheric depth — dim background scene, drifting fog, embers */}
      <div className="hero-atmos" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-bg" src="/background.jpg" alt="" />
        <span className="hero-bg-veil" />
        <span className="hero-fog hero-fog--1" />
        <span className="hero-fog hero-fog--2" />
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={`hero-ember hero-ember--${i + 1}`} />
        ))}
      </div>

      <div className="hero-grain" aria-hidden />

      <div className="relative z-[2] w-full max-w-[1180px]">
        {/* reaper portrait with ghost-haunt afterimage */}
        <h1 className="logo-stage logo-stage--repper">
          <span className="logo-aura" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-ghost" src="/repper.webp" aria-hidden alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="logo-main"
            src="/repper.webp"
            alt="NIIGHTMARE Esports — Lao PDR"
            fetchPriority="high"
          />
        </h1>

        {/* brand wordmark */}
        <p
          className="repper-wordmark fx-rise font-display keep-latin"
          style={{ animationDelay: "0.24s" }}
        >
          NIIGHTMARE<span className="repper-esport">ESPORT</span>
        </p>

        {/* tagline — the slogan, hard and bright with an accented key word */}
        <p
          className="fx-rise font-display text-[clamp(1.05rem,3vw,2.1rem)] font-bold uppercase leading-[1.05] tracking-[0.12em] text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.35)]"
          style={{ animationDelay: "0.32s" }}
        >
          {t("hero.tagline")}{" "}
          <span className="text-glow [text-shadow:0_0_30px_rgba(199,125,255,0.7)]">
            {t("hero.tagline_accent")}
          </span>
        </p>

        {/* scythe-blade divider */}
        <div
          className="fx-rise mx-auto mt-6 h-[2px] w-[120px] -skew-x-[24deg] bg-gradient-to-r from-transparent via-amethyst to-glow shadow-[0_0_16px_rgba(168,85,247,0.6)]"
          style={{ animationDelay: "0.42s" }}
          aria-hidden
        />
      </div>

      {/* NEXT MATCH strip */}
      <div
        className="next-line fx-rise absolute inset-x-0 bottom-0 z-[3] border-t border-edge bg-gradient-to-b from-crypt/0 via-crypt/80 to-crypt2/95 backdrop-blur-md"
        style={{ animationDelay: "0.62s" }}
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-2 px-5 py-4 md:px-14">
          <span className="flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-ash">
            <span className="fx-ping h-[7px] w-[7px] rounded-full bg-amethyst" />
            {t("sections.upcoming_match")}
          </span>
          <span className="whitespace-nowrap font-mono text-[13px] tracking-[0.06em] text-spectre">
            {cd ? formatDateTime(match.date, lang) : "—"}
          </span>
          <span className="whitespace-nowrap font-display text-[clamp(15px,1.7vw,20px)] font-semibold tracking-[0.04em] text-soul">
            <span className="keep-latin">NIIGHTMARE</span>
            <span className="mx-2.5 text-[0.8em] text-ash-dim">{t("common.vs")}</span>
            <span className="keep-latin text-spectre">{match.opponent}</span>
          </span>
          <span className="text-[13px] text-ash">{pick(match.tournament)}</span>

          <span className="ml-auto flex items-center gap-2.5">
            <span className="font-mono text-[clamp(16px,2vw,22px)] font-bold tabular-nums tracking-[0.06em] text-soul">
              {cd && !cd.done ? (
                <>
                  {cd.d}
                  <span className="mx-0.5 text-[0.58em] font-medium text-ash-dim">D</span>{" "}
                  {pad(cd.h)}
                  <span className="text-[0.58em] text-ash-dim">:</span>
                  {pad(cd.m)}
                  <span className="text-[0.58em] text-ash-dim">:</span>
                  {pad(cd.s)}
                </>
              ) : (
                "—"
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash-dim">
              {t("hero.until_kickoff")}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
