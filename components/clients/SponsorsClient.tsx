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
    <div className="relative overflow-hidden border border-edge bg-crypt/70 p-5">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent"
      />
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
      className="hover-glow grid h-28 place-items-center border border-edge bg-card px-4 text-center transition-[filter] duration-300 hover:brightness-125"
    >
      <span className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-[0.1em] text-text-muted">
        {sponsor.name}
      </span>
    </a>
  );
}

function TierCard({ tier }: { tier: SponsorTier }) {
  const { t, pick } = useLanguage();
  return (
    <div
      className="hover-glow flex flex-col border border-edge bg-card transition-transform duration-300 hover:-translate-y-1.5"
      style={{ borderTopColor: tier.color, borderTopWidth: 3 }}
    >
      <div className="p-6">
        <h3
          className="font-display text-xl font-bold uppercase tracking-[0.1em]"
          style={{ color: tier.color }}
        >
          {pick(tier.name)}
        </h3>
        <ul className="mt-5 flex flex-col gap-3">
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
      <div className="mt-auto p-6 pt-0">
        <Link
          href="/contact"
          className="hover-glow flex min-h-[44px] items-center justify-center border border-primary px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary hover:bg-primary/15"
        >
          {t("common.contact_us")}
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
        <div className="mb-16">
          <SectionLabel>{pick(page.valueLabel)}</SectionLabel>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.slice(0, 4).map((item, index) => (
              <ValuePropCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* Active partners */}
        <SectionLabel>{pick(page.partnersLabel)}</SectionLabel>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data.sponsors.map((sponsor) => (
            <SponsorBox key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>

        {/* Sponsorship tiers */}
        <div className="mt-20">
          <SectionLabel>{pick(page.tiersLabel)}</SectionLabel>
          <p className="mx-auto mt-4 max-w-2xl text-center text-text-muted">
            {pick(page.tiersIntro)}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>

        <div className="relative mt-20 overflow-hidden border border-edge-bright bg-gradient-to-br from-crypt via-crypt2/75 to-void p-6 text-center md:p-10">
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
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
