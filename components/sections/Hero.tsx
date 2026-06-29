"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import TeamSupport from "@/components/community/TeamSupport";
import { ArrowRightIcon } from "@/components/ui/Icons";

const COPY = {
  shopCta: { en: "Shop the Jersey", lo: "ສັ່ງເສື້ອທີມ" },
};

export default function Hero() {
  const { t, lang, pick } = useLanguage();

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
        <span className="hero-dust hero-dust--mist" />
        <span className="hero-dust hero-dust--far" />
        <span className="hero-dust hero-dust--near" />
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={`hero-ember hero-ember--${i + 1}`} />
        ))}
      </div>

      <div className="hero-grain" aria-hidden />

      <div className="home-hero-content relative z-[2] w-full max-w-7xl">
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
          {t("hero.tagline")}
          {/* Lao reads as one phrase (no inter-word space); EN keeps the gap. */}
          {lang === "lo" ? "" : " "}
          <span className="tagline-accent text-glow">
            {t("hero.tagline_accent")}
          </span>
        </p>

        <div
          className="fx-rise mt-6 h-[2px] w-[180px] -skew-x-[24deg] bg-gradient-to-r from-amethyst via-glow to-transparent shadow-[0_0_18px_rgba(168,85,247,0.65)]"
          style={{ animationDelay: "0.42s" }}
          aria-hidden
        />

        <div
          className="fx-rise mt-8 flex flex-col items-start gap-4 md:items-end"
          style={{ animationDelay: "0.52s" }}
        >
          {/* primary hero action — left on mobile, right on desktop */}
          <Link
            href="/shop"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-md border border-amethyst bg-gradient-to-r from-amethyst/30 via-amethyst/15 to-transparent px-7 py-4 font-display text-sm font-black uppercase tracking-[0.16em] text-soul shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300 hover:border-glow hover:shadow-[0_0_44px_rgba(168,85,247,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-[24deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-700 ease-out group-hover:left-[150%]"
            />
            <span className="relative">{pick(COPY.shopCta)}</span>
            <ArrowRightIcon
              size={18}
              className="relative transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </Link>

          {/* quiet support utility row */}
          <TeamSupport />
        </div>
      </div>
    </section>
  );
}
