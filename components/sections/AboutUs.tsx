"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { resolveAbout, type AboutUsContent } from "@/lib/about";
import { safeHref } from "@/lib/safety";

/**
 * Home-page "About Us" band — a single, centred manifesto led by the big
 * "WHO WE ARE" section heading (scythe-tick flanked, matching RecentResults),
 * then a reaper-voiced statement with one outlined violet accent word echoing
 * the hero. All copy is admin-editable via site.aboutUs (HomeEditor) and falls
 * back to DEFAULT_ABOUT. Sits below RecentResults.
 */
export default function AboutUs() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const about: AboutUsContent = resolveAbout(
    (site as { aboutUs?: Partial<AboutUsContent> }).aboutUs
  );
  const primaryHref = safeHref(about.primaryCta.href, "/achievements");

  return (
    <section className="aurora-band relative overflow-hidden border-t border-edge px-4 py-20 md:px-6 md:py-24">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      {/* two-tone halo — amethyst key + magenta accent, matching Recent Results */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[40%] top-10 h-64 w-[min(720px,86vw)] -translate-x-1/2 bg-amethyst/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[62%] top-24 h-52 w-[min(520px,70vw)] -translate-x-1/2 bg-magenta/10 blur-3xl"
      />

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center text-center">
        {/* main heading — big, scythe-tick flanked, like RECENT RESULTS */}
        <Reveal>
          <SectionLabel centered>{pick(about.kicker)}</SectionLabel>
        </Reveal>

        <Reveal delay={60}>
          {/* nowrap + a viewport-scaled clamp so each manifesto line stays on a
              single row on mobile (EN and Lao alike) instead of wrapping, and
              still caps at the desktop 4xl size. Tuned to the widest line. */}
          <p className="mt-7 whitespace-nowrap font-display text-[clamp(12px,4.2vw,34px)] font-extrabold uppercase leading-[1.05] tracking-tight text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.25)]">
            <span className="block">{pick(about.headLine1)}</span>
            <span className="mt-1 block">
              <span>{pick(about.headPre)}</span>
              <span className="inline-block text-transparent [-webkit-text-stroke:1.5px_#c77dff] [text-shadow:0_0_26px_rgba(199,125,255,0.55)]">
                {pick(about.headAccent)}
              </span>
              <span>{pick(about.headPost)}</span>
            </span>
          </p>
        </Reveal>

        <Reveal delay={120}>
          <span
            aria-hidden
            className="scythe-line mt-7 block h-[2px] w-24 opacity-70"
          />
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-7 space-y-4 text-base leading-7 text-spectre/90 sm:text-[17px] sm:leading-8">
            <p>{pick(about.body1)}</p>
            <p>{pick(about.body2)}</p>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <Link
              href={primaryHref}
              className="group inline-flex items-center gap-2.5 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            >
              {pick(about.primaryCta.label)}
              <ArrowRightIcon
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
