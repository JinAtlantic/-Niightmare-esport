"use client";

import React from "react";
import Link from "next/link";
import { Globe2, Trophy, Coins, MapPin, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { resolveAbout, type AboutUsContent } from "@/lib/about";

// Each dossier row's id maps to an icon (the id is fixed in the admin, so the
// icon stays stable even when the copy is edited). Falls back to the trophy.
const ICONS: Record<string, LucideIcon> = {
  worlds: Globe2,
  titles: Trophy,
  winnings: Coins,
  established: MapPin,
};

function DossierRow({
  Icon,
  value,
  label,
  detail,
}: {
  Icon: LucideIcon;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <li className="group/row relative flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-300 hover:bg-amethyst/[0.04] sm:px-6">
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center border border-edge bg-void/60 text-amethyst transition-colors duration-300 group-hover/row:border-amethyst/50 group-hover/row:text-glow"
        >
          <Icon size={19} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-bold uppercase tracking-[0.08em] text-soul">
            {label}
          </p>
          <p className="keep-latin mt-0.5 truncate font-mono text-xs text-spectre/70">
            {detail}
          </p>
        </div>
      </div>
      <span className="keep-latin shrink-0 font-display text-[26px] font-extrabold leading-none tabular-nums text-soul sm:text-3xl">
        {value}
      </span>
    </li>
  );
}

/**
 * Home-page "About Us" band — a two-column statement: a reaper-voiced manifesto
 * on the left (with a single outlined violet accent word echoing the hero), and
 * a "Club Dossier" record sheet on the right. All copy is admin-editable via
 * site.aboutUs (HomeEditor) and falls back to DEFAULT_ABOUT. Sits below
 * RecentResults.
 */
export default function AboutUs() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const about: AboutUsContent = resolveAbout(
    (site as { aboutUs?: Partial<AboutUsContent> }).aboutUs
  );

  return (
    <section className="relative overflow-hidden border-t border-edge bg-void px-4 py-20 md:px-6 md:py-24">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      {/* halo bleeding from behind the dossier (right) — varies the light from
          the centred halo used by the bands above/below */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6%] top-1/4 h-72 w-[min(620px,80vw)] bg-amethyst/10 blur-3xl"
      />

      <div className="relative z-[1] mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ── LEFT — manifesto ─────────────────────────────────────────── */}
        <div>
          <Reveal>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs font-medium uppercase tracking-[0.32em] text-spectre/80">
              <span className="inline-flex items-center gap-2.5">
                <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
                {pick(about.kicker)}
              </span>
              <span aria-hidden className="hidden h-3 w-px bg-edge-bright sm:inline-block" />
              <span className="text-ash">{pick(about.est)}</span>
            </p>
          </Reveal>

          <Reveal delay={60}>
            <h2 className="mt-5 font-display text-3xl font-extrabold uppercase leading-[1.02] tracking-tight text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.25)] sm:text-4xl md:text-5xl">
              <span className="block">{pick(about.headLine1)}</span>
              <span className="mt-1 block">
                <span>{pick(about.headPre)}</span>
                <span className="inline-block text-transparent [-webkit-text-stroke:1.5px_#c77dff] [text-shadow:0_0_26px_rgba(199,125,255,0.55)]">
                  {pick(about.headAccent)}
                </span>
                <span>{pick(about.headPost)}</span>
              </span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <span
              aria-hidden
              className="scythe-line mt-6 block h-[2px] w-24 opacity-70"
            />
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-6 max-w-xl space-y-4 text-base leading-7 text-spectre/90 sm:text-[17px] sm:leading-8">
              <p>{pick(about.body1)}</p>
              <p>{pick(about.body2)}</p>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href={about.primaryCta.href}
                className="group inline-flex items-center gap-2.5 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                {pick(about.primaryCta.label)}
                <ArrowRightIcon
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href={about.secondaryCta.href}
                className="group inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.16em] text-ash transition-colors duration-300 hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                {pick(about.secondaryCta.label)}
                <ArrowRightIcon
                  size={15}
                  className="text-amethyst transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ── RIGHT — club dossier ─────────────────────────────────────── */}
        <Reveal delay={140}>
          <div className="clip-esports relative overflow-hidden border border-edge-bright bg-gradient-to-br from-crypt2/80 via-crypt/70 to-void shadow-[0_0_60px_-12px_rgba(168,85,247,0.4)]">
            {/* violet spine running down the left edge */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-amethyst via-glow/50 to-transparent"
            />
            {/* header strip */}
            <div className="flex items-center justify-between border-b border-edge bg-gradient-to-r from-amethyst/15 to-transparent px-5 py-3.5 sm:px-6">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.26em] text-spectre">
                {pick(about.dossierLabel)}
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                <span className="relative flex h-[6px] w-[6px]">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amethyst opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
                </span>
                {pick(about.region)}
              </span>
            </div>

            <ul className="divide-y divide-edge">
              {about.stats.map((s) => (
                <DossierRow
                  key={s.id}
                  Icon={ICONS[s.id] ?? Trophy}
                  value={s.value}
                  label={pick(s.label)}
                  detail={pick(s.detail)}
                />
              ))}
            </ul>

            <p className="border-t border-edge bg-void/40 px-5 py-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ash sm:px-6">
              {pick(about.source)}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
