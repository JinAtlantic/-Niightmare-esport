"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { ArrowRightIcon } from "@/components/ui/Icons";

/**
 * Custom 404 in the "Premium Violet Void" language — replaces Next's white
 * default so a bad link still feels like the rest of the site. Rendered inside
 * the root layout, so it keeps the navbar + footer.
 */
export default function NotFound() {
  const { t } = useLanguage();

  return (
    <section className="page-header relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden border-b border-edge px-4 py-24 text-center">
      <div className="hero-grain" aria-hidden />

      <div className="relative z-[2] flex flex-col items-center">
        <p className="fx-rise inline-flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.4em] text-spectre/70">
          <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
          {t("common.notfound_kicker")}
        </p>

        <h1
          className="fx-rise keep-latin mt-6 font-display text-[7rem] font-bold leading-none text-soul [text-shadow:0_0_50px_rgba(168,85,247,0.5)] md:text-[11rem]"
          style={{ animationDelay: "0.08s" }}
        >
          404
        </h1>

        <div
          className="fx-rise mt-2 h-[2px] w-[120px] -skew-x-[24deg] bg-gradient-to-r from-transparent via-amethyst to-glow shadow-[0_0_16px_rgba(168,85,247,0.6)]"
          style={{ animationDelay: "0.16s" }}
          aria-hidden
        />

        <h2
          className="fx-rise mt-7 font-display text-2xl font-bold uppercase tracking-wide text-soul md:text-3xl"
          style={{ animationDelay: "0.2s" }}
        >
          {t("common.notfound_title")}
        </h2>

        <p
          className="fx-rise mt-3 max-w-md text-sm leading-relaxed text-ash md:text-base"
          style={{ animationDelay: "0.28s" }}
        >
          {t("common.notfound_body")}
        </p>

        <div
          className="fx-rise mt-9 flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "0.36s" }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-amethyst/70 bg-gradient-to-b from-amethyst to-amethyst-deep px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-soul shadow-[0_0_30px_rgba(168,85,247,0.45)] transition-all duration-300 hover:from-glow hover:to-amethyst hover:shadow-[0_0_48px_rgba(168,85,247,0.75)] focus:outline-none focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
          >
            {t("common.notfound_home")}
          </Link>
          <Link
            href="/matches"
            className="group inline-flex items-center justify-center gap-2 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
          >
            {t("common.notfound_matches")}
            <ArrowRightIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
