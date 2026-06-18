"use client";

import React from "react";
import { useLanguage } from "@/components/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero-section hero-section--reaper flex min-h-[calc(100svh-1.5rem)] flex-col justify-end px-5 pb-10 pt-28 text-left md:min-h-[calc(100svh-2rem)] md:px-14 md:pb-14">
      <div className="hero-atmos" aria-hidden>
        <picture>
          <source media="(min-width: 1024px)" srcSet="/home-reaper-desktop.webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-bg hero-bg--reaper"
            src="/home-reaper.webp"
            alt=""
            fetchPriority="high"
          />
        </picture>
        <span className="hero-bg-veil" />
        <span className="hero-fog hero-fog--1" />
        <span className="hero-fog hero-fog--2" />
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={`hero-ember hero-ember--${i + 1}`} />
        ))}
      </div>

      <div className="hero-grain" aria-hidden />

      <div className="relative z-[2] w-full max-w-7xl">
        <div className="home-hero-copy">
          <h1 className="home-hero-wordmark keep-latin font-display">
            <span className="home-hero-main">
              N<span className="home-hero-double-i">II</span>GHTMARE
            </span>
            <span className="home-hero-sub">ESPORT</span>
          </h1>
        </div>

        <p
          className="home-hero-tagline fx-rise keep-latin font-display"
          style={{ animationDelay: "0.34s" }}
        >
          {t("hero.tagline")}{" "}
          <span className="tagline-accent text-glow">
            {t("hero.tagline_accent")}
          </span>
        </p>

        <div
          className="fx-rise mt-6 h-[2px] w-[180px] -skew-x-[24deg] bg-gradient-to-r from-amethyst via-glow to-transparent shadow-[0_0_18px_rgba(168,85,247,0.65)]"
          style={{ animationDelay: "0.42s" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
