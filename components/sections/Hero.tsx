"use client";

import React from "react";
import { useLanguage } from "@/components/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section
      className="hero-section flex flex-col items-center justify-center px-5 pb-20 pt-10 text-center md:px-14"
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
        {/* reaper portrait with ghost-haunt afterimage — a still focal point;
            the moving accent now lives in the wordmark below it. */}
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

        {/* brand wordmark — white glyphs with a slow violet light sweep.
            NB: no `fx-rise` class here — the rise + sweep are both driven by
            `.repper-wordmark` so `.fx-rise` can't override the sweep. */}
        <p className="repper-wordmark font-display keep-latin">
          NIIGHTMARE<span className="repper-esport">ESPORT</span>
        </p>

        {/* tagline — the slogan, hard and bright with an accented key word */}
        <p
          className="fx-rise font-display text-[clamp(1.05rem,3vw,2.1rem)] font-bold uppercase leading-[1.05] tracking-[0.12em] text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.35)]"
          style={{ animationDelay: "0.32s" }}
        >
          {t("hero.tagline")}{" "}
          <span className="tagline-accent text-glow">
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
    </section>
  );
}
