"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import { ArrowRightIcon, DiscordIcon } from "@/components/ui/Icons";

export default function Hero() {
  const { t, lang } = useLanguage();
  const { site } = useContent();
  const communityUrl =
    (site as { communityUrl?: string }).communityUrl || "/contact";

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

        {/* Primary path for new visitors: convert the first impression into a
            follow (community) or a click into the team (roster). */}
        <div
          className="fx-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "0.52s" }}
        >
          <a
            href={communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2.5 rounded-md border border-amethyst/70 bg-gradient-to-b from-amethyst to-amethyst-deep px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-soul shadow-[0_0_30px_rgba(168,85,247,0.45)] transition-all duration-300 hover:from-glow hover:to-amethyst hover:shadow-[0_0_48px_rgba(168,85,247,0.75)] focus:outline-none focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
          >
            <DiscordIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
            {t("nav.join_community")}
          </a>
          <Link
            href="/roster"
            className="group inline-flex items-center justify-center gap-2 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
          >
            {t("hero.btn_roster")}
            <ArrowRightIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
