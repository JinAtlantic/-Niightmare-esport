"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { useContent } from "@/components/context/ContentContext";
import type { Sponsor, SponsorTier } from "@/lib/types";

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
  const { t } = useLanguage();
  const data = useContent().sponsors as {
    sponsors: Sponsor[];
    tiers: SponsorTier[];
  };

  return (
    <>
      <PageHeader title={t("sponsors.hero_title")} subtitle={t("sponsors.hero_sub")} />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {/* Active partners */}
        <SectionLabel>{t("sponsors.partners_label")}</SectionLabel>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data.sponsors.map((sponsor) => (
            <SponsorBox key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>

        {/* Sponsorship tiers */}
        <div className="mt-20">
          <SectionLabel>{t("sponsors.tiers_label")}</SectionLabel>
          <p className="mx-auto mt-4 max-w-2xl text-center text-text-muted">
            {t("sponsors.tiers_intro")}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
