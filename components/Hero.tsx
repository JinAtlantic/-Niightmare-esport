"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import TeamLogo from "@/components/TeamLogo";
import { ArrowRightIcon } from "@/components/Icons";
import site from "@/data/site.json";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="diagonal-split noise-overlay scanlines relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
      {/* Floating diagonal scythe-slash lines */}
      <div className="hero-slash top-1/3 animate-fadeIn" aria-hidden />
      <div
        className="hero-slash top-2/3 opacity-50"
        style={{ animationDelay: "0.2s" }}
        aria-hidden
      />

      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-accent/15 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <div className="animate-fadeInUp">
          <TeamLogo size={200} pulse />
        </div>

        <h1
          className="mt-10 max-w-3xl font-display text-4xl font-bold uppercase leading-tight tracking-[0.04em] text-text-primary animate-fadeInUp md:text-6xl"
          style={{ animationDelay: "0.1s" }}
        >
          {t("hero.tagline")}
        </h1>

        <p
          className="mt-4 max-w-xl text-base text-text-muted animate-fadeInUp md:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          {t("hero.subtitle")}
        </p>

        <div
          className="mt-9 flex flex-col items-center gap-4 animate-fadeInUp sm:flex-row"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/roster"
            className="hover-glow group inline-flex items-center gap-2 bg-primary px-7 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white"
          >
            {t("hero.btn_roster")}
            <ArrowRightIcon
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <a
            href={site.communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-glow inline-flex items-center gap-2 border border-primary px-7 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-text-primary hover:bg-primary/15"
          >
            {t("hero.btn_follow")}
          </a>
        </div>
      </div>

      {/* Bottom fade into the page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-void"
        aria-hidden
      />
    </section>
  );
}
