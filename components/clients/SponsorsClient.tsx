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

const WALL_COPY = {
  label: { en: "SUPPORTER WALL", lo: "ຜູ້ສະໜັບສະໜູນ" },
  headline: {
    en: "POWERED BY BRANDS THAT BACK NIIGHTMARE",
    lo: "ຂັບເຄື່ອນໂດຍແບຣນທີ່ສະໜັບສະໜູນ NIIGHTMARE",
  },
  intro: {
    en: "A premium partner stage built to make every supporter visible, respected, and remembered.",
    lo: "ພື້ນທີ່ພາກສ່ວນແບບພຣີມຽມ ເພື່ອໃຫ້ທຸກແບຣນທີ່ສະໜັບສະໜູນເຫັນໄດ້ຊັດ ແລະ ມີຄຸນຄ່າ.",
  },
  supporter: { en: "Official Supporter", lo: "ຜູ້ສະໜັບສະໜູນທາງການ" },
  visit: { en: "Visit Partner", lo: "ເບິ່ງພາກສ່ວນ" },
  lineup: { en: "SUPPORTER LINEUP", lo: "ລາຍຊື່ຜູ້ສະໜັບສະໜູນ" },
};

function sponsorInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "NM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function ValuePropCard({ item, index }: { item: SponsorValueProp; index: number }) {
  const { pick } = useLanguage();
  return (
    <div className="group relative overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(28,20,40,0.72),rgba(11,7,16,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
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

function SponsorLogoCard({ sponsor, index, featured = false }: { sponsor: Sponsor; index: number; featured?: boolean }) {
  const { pick } = useLanguage();
  const linked = sponsor.url && sponsor.url !== "#";
  const initials = sponsorInitials(sponsor.name);
  const body = (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glow/80 to-transparent" />
      <span aria-hidden className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-amethyst/45" />
      <span aria-hidden className="absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 border-amethyst/30" />
      <span
        aria-hidden
        className={`keep-latin pointer-events-none absolute right-4 top-3 select-none font-display font-black leading-none text-amethyst/[0.08] transition-colors group-hover:text-amethyst/[0.13] ${
          featured ? "text-8xl md:text-9xl" : "text-6xl"
        }`}
      >
        {initials}
      </span>

      <div className="relative flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amethyst">
          {pick(WALL_COPY.supporter)}
        </p>
        <span className="font-mono text-[10px] font-semibold text-ash-dim">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="relative mt-10 flex min-h-[74px] items-center">
        <h3
          className={`keep-latin break-words font-display font-black uppercase leading-[0.9] tracking-wide text-soul transition-colors group-hover:text-glow ${
            featured ? "text-4xl sm:text-5xl lg:text-6xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {sponsor.name}
        </h3>
      </div>

      <div className="relative mt-8 flex items-center justify-between gap-4 border-t border-edge/80 pt-4">
        <span className="h-px flex-1 bg-gradient-to-r from-amethyst/50 to-transparent" aria-hidden />
        <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-spectre transition-colors group-hover:text-soul">
          {pick(WALL_COPY.visit)}
        </span>
      </div>
    </>
  );

  return linked ? (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover-glow group relative flex flex-col justify-between overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(22,16,31,0.92),rgba(11,7,16,0.98))] p-5 transition-[filter,transform,border-color] duration-300 hover:-translate-y-1 hover:border-amethyst/60 hover:brightness-110 ${
        featured ? "min-h-[260px] md:col-span-2 lg:col-span-3 md:p-7" : "min-h-[190px]"
      }`}
    >
      {body}
    </a>
  ) : (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(22,16,31,0.92),rgba(11,7,16,0.98))] p-5 ${
        featured ? "min-h-[260px] md:col-span-2 lg:col-span-3 md:p-7" : "min-h-[190px]"
      }`}
    >
      {body}
    </div>
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
        <div className="relative mb-16 overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(28,20,40,0.78),rgba(11,7,16,0.97))] p-5 shadow-glow-soft md:p-8">
          <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-glow/70 to-transparent" />
          <span aria-hidden className="scythe-line absolute inset-x-0 bottom-0 h-[2px] opacity-60" />
          <div className="relative grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div className="max-w-xl">
              <SectionLabel>{pick(WALL_COPY.label)}</SectionLabel>
              <h2 className="mt-5 font-display text-3xl font-black uppercase leading-[0.95] tracking-wide text-soul md:text-5xl">
                {pick(WALL_COPY.headline)}
              </h2>
              <p className="mt-5 text-base font-medium leading-relaxed text-spectre md:text-lg">
                {pick(WALL_COPY.intro)}
              </p>
              <div className="mt-8 grid grid-cols-2 border border-edge bg-void/55">
                <div className="border-r border-edge px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                    {pick(page.partnersLabel)}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-glow">
                    {data.sponsors.length}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                    {pick(page.tiersLabel)}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-soul">
                    {data.tiers.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              {data.sponsors[0] ? (
                <SponsorLogoCard sponsor={data.sponsors[0]} index={0} featured />
              ) : null}
            </div>
          </div>
        </div>

        {/* Active partners */}
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>{pick(page.partnersLabel)}</SectionLabel>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.08em] text-soul md:text-4xl">
                {pick(WALL_COPY.lineup)}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ash md:text-right">
              {pick(WALL_COPY.intro)}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.sponsors.map((sponsor, index) => (
              <SponsorLogoCard key={sponsor.id} sponsor={sponsor} index={index} featured={index === 0} />
            ))}
          </div>
        </div>

        <div className="mt-20">
          <SectionLabel>{pick(page.valueLabel)}</SectionLabel>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.slice(0, 4).map((item, index) => (
              <ValuePropCard key={item.id} item={item} index={index} />
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
