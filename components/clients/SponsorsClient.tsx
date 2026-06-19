"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { useContent } from "@/components/context/ContentContext";
import { ArrowRightIcon } from "@/components/ui/Icons";
import sponsorsSeed from "@/data/sponsors.json";
import type { Bilingual, Sponsor, SponsorTier } from "@/lib/types";

interface SponsorValueProp {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

interface SponsorCta {
  label: Bilingual;
  href: string;
}

interface SponsorsPageCopy {
  heroTitle: Bilingual;
  heroSubtitle: Bilingual;
  partnersLabel: Bilingual;
  tiersLabel: Bilingual;
  tiersIntro: Bilingual;
  valueLabel: Bilingual;
  valueProps: SponsorValueProp[];
  ctaTitle: Bilingual;
  ctaBody: Bilingual;
  ctaPrimary: SponsorCta;
  ctaSecondary: SponsorCta;
}

const FALLBACK_PAGE = sponsorsSeed.page as SponsorsPageCopy;

function ValuePropCard({ item, index }: { item: SponsorValueProp; index: number }) {
  const { pick } = useLanguage();
  return (
    <div className="group relative overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(28,20,40,0.86),rgba(11,7,16,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent"
      />
      <span aria-hidden className="absolute -right-12 -top-12 h-28 w-28 bg-amethyst/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-amethyst">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-[0.08em] text-soul">
        {pick(item.title)}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ash">{pick(item.body)}</p>
    </div>
  );
}

function SponsorBox({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-glow group relative grid h-28 place-items-center overflow-hidden border border-edge bg-void/55 px-4 text-center transition-[filter] duration-300 hover:brightness-125"
    >
      <span aria-hidden className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-spectre/40 to-transparent" />
      <span aria-hidden className="absolute -right-10 -top-10 h-24 w-24 rotate-45 border border-amethyst/15 bg-amethyst/5 transition-transform group-hover:scale-110" />
      <span className="keep-latin relative font-rajdhani text-lg font-bold uppercase tracking-[0.1em] text-text-muted transition-colors group-hover:text-soul">
        {sponsor.name}
      </span>
    </a>
  );
}

function TierCard({ tier, cta, label }: { tier: SponsorTier; cta: SponsorCta; label: string }) {
  const { pick } = useLanguage();
  return (
    <div
      className="hover-glow group relative flex flex-col overflow-hidden border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.86),rgba(11,7,16,0.96))] transition-transform duration-300 hover:-translate-y-1.5"
      style={{ borderTopColor: tier.color, borderTopWidth: 3 }}
    >
      <span aria-hidden className="absolute -right-20 -top-20 h-44 w-44 opacity-25 blur-3xl" style={{ backgroundColor: tier.color }} />
      <div className="relative p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ash-dim">
          {label}
        </p>
        <h3
          className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.08em]"
          style={{ color: tier.color }}
        >
          {pick(tier.name)}
        </h3>
        <ul className="mt-5 flex flex-col gap-3 border-t border-edge pt-5">
          {tier.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0"
                style={{ backgroundColor: tier.color, transform: "skewX(-20deg)" }}
                aria-hidden
              />
              <span>{pick(benefit)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-auto p-6 pt-0">
        <Link
          href={cta.href}
          className="hover-glow flex min-h-[46px] items-center justify-center gap-2 border border-primary px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary hover:bg-primary/15"
        >
          {pick(cta.label)}
          <ArrowRightIcon size={15} />
        </Link>
      </div>
    </div>
  );
}

export default function SponsorsClient() {
  const { pick } = useLanguage();
  const data = useContent().sponsors as {
    page?: SponsorsPageCopy;
    sponsors: Sponsor[];
    tiers: SponsorTier[];
  };
  const page = { ...FALLBACK_PAGE, ...(data.page ?? {}) };
  const valueProps = page.valueProps?.length ? page.valueProps : FALLBACK_PAGE.valueProps;

  return (
    <>
      <PageHeader title={pick(page.heroTitle)} subtitle={pick(page.heroSubtitle)} />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="relative mb-16 overflow-hidden border border-edge bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_34%),linear-gradient(135deg,rgba(28,20,40,0.68),rgba(11,7,16,0.96))] p-4 shadow-glow-soft md:p-6">
          <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-glow/70 to-transparent" />
          <span aria-hidden className="absolute -right-24 -top-24 h-56 w-56 bg-amethyst/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="flex min-h-[260px] flex-col justify-between border border-edge bg-void/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6">
              <div>
                <SectionLabel>{pick(page.valueLabel)}</SectionLabel>
                <p className="mt-5 text-base font-medium leading-relaxed text-spectre md:text-lg">
                  {pick(page.tiersIntro)}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 border border-edge bg-crypt/45">
                <div className="border-r border-edge px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                    {pick(page.partnersLabel)}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-glow">
                    {data.sponsors.length}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                    {pick(page.tiersLabel)}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-soul">
                    {data.tiers.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {valueProps.slice(0, 4).map((item, index) => (
                <ValuePropCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Active partners */}
        <div className="border border-edge bg-crypt/35 p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <SectionLabel>{pick(page.partnersLabel)}</SectionLabel>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-spectre">
              {data.sponsors.length}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {data.sponsors.map((sponsor) => (
              <SponsorBox key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        </div>

        {/* Sponsorship tiers */}
        <div className="mt-20">
          <SectionLabel>{pick(page.tiersLabel)}</SectionLabel>
          <p className="mt-4 max-w-2xl text-text-muted">
            {pick(page.tiersIntro)}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} cta={page.ctaPrimary} label={pick(page.tiersLabel)} />
            ))}
          </div>
        </div>

        <div className="relative mt-20 overflow-hidden border border-edge-bright bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(28,20,40,0.86)_38%,rgba(11,7,16,0.98))] p-6 text-center shadow-[0_0_32px_rgba(168,85,247,0.16)] md:p-10">
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
          <span aria-hidden className="absolute -left-20 -top-20 h-52 w-52 bg-amethyst/10 blur-3xl" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-[0.12em] text-soul md:text-4xl">
            {pick(page.ctaTitle)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
            {pick(page.ctaBody)}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={page.ctaPrimary.href}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul shadow-[0_0_28px_rgba(168,85,247,0.24)] transition-colors hover:bg-amethyst/25"
            >
              {pick(page.ctaPrimary.label)}
              <ArrowRightIcon size={16} />
            </Link>
            <Link
              href={page.ctaSecondary.href}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-void/40 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-spectre transition-colors hover:border-amethyst/70 hover:text-soul"
            >
              {pick(page.ctaSecondary.label)}
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
