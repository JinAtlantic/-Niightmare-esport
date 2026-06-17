"use client";

import React from "react";
import Link from "next/link";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Reveal from "@/components/ui/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import { ArrowRightIcon, EfootballIcon, MlbbIcon, TrophyIcon } from "@/components/ui/Icons";
import type { Player, SponsorTier, Tournament } from "@/lib/types";

function StatTile({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-edge bg-crypt/55 px-5 py-6 transition-colors duration-300 hover:border-amethyst/65">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent opacity-70"
      />
      <p className="font-display text-4xl font-bold uppercase leading-none text-soul [text-shadow:0_0_24px_rgba(168,85,247,0.35)] md:text-5xl">
        {value}
      </p>
      <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amethyst">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ash">{detail}</p>
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative border border-edge bg-void/45 p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center border border-amethyst/45 bg-amethyst/10 text-glow shadow-[0_0_18px_rgba(168,85,247,0.22)]">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-soul">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ash">{body}</p>
    </div>
  );
}

export default function TeamSnapshot() {
  const { t } = useLanguage();
  const { roster, matches, sponsors } = useContent();

  const mlbbPlayers = ((roster.mlbb?.players ?? []) as Player[]).length;
  const efootballPlayers = ((roster.efootball?.players ?? []) as Player[]).length;
  const rosterCount = mlbbPlayers + efootballPlayers;
  const honoursCount = ((matches.tournaments ?? []) as Tournament[]).length;
  const partnerTierCount = ((sponsors.tiers ?? []) as SponsorTier[]).length;

  return (
    <section className="relative overflow-hidden border-y border-edge bg-gradient-to-b from-void via-crypt/35 to-void">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045] [mask-image:linear-gradient(180deg,transparent,#000_18%,#000_82%,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.9) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel centered kicker={t("sections.home_snapshot_kicker")}>
              {t("sections.home_snapshot_title")}
            </SectionLabel>
            <p className="mt-5 text-base leading-relaxed text-ash md:text-lg">
              {t("sections.home_snapshot_intro")}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <StatTile
              value="2"
              label={t("sections.home_snapshot_stat_divisions")}
              detail="MLBB / eFootball"
            />
          </Reveal>
          <Reveal delay={80}>
            <StatTile
              value={String(rosterCount)}
              label={t("sections.home_snapshot_stat_roster")}
              detail={t("sections.home_snapshot_stat_roster_detail")}
            />
          </Reveal>
          <Reveal delay={160}>
            <StatTile
              value={String(honoursCount)}
              label={t("sections.home_snapshot_stat_honours")}
              detail={t("sections.home_snapshot_stat_honours_detail")}
            />
          </Reveal>
          <Reveal delay={240}>
            <StatTile
              value={`${partnerTierCount}+`}
              label={t("sections.home_snapshot_stat_partners")}
              detail={t("sections.home_snapshot_stat_partners_detail")}
            />
          </Reveal>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <Pillar
              icon={<MlbbIcon size={22} />}
              title={t("sections.home_snapshot_pillar_matchday")}
              body={t("sections.home_snapshot_pillar_matchday_body")}
            />
          </Reveal>
          <Reveal delay={80}>
            <Pillar
              icon={<TrophyIcon size={22} />}
              title={t("sections.home_snapshot_pillar_proof")}
              body={t("sections.home_snapshot_pillar_proof_body")}
            />
          </Reveal>
          <Reveal delay={160}>
            <Pillar
              icon={<EfootballIcon size={22} />}
              title={t("sections.home_snapshot_pillar_partners")}
              body={t("sections.home_snapshot_pillar_partners_body")}
            />
          </Reveal>
        </div>

        <Reveal delay={220}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sponsors"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul shadow-[0_0_28px_rgba(168,85,247,0.24)] transition-colors hover:bg-amethyst/25"
            >
              {t("sections.home_snapshot_cta_sponsors")}
              <ArrowRightIcon size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-void/40 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-spectre transition-colors hover:border-amethyst/70 hover:text-soul"
            >
              {t("sections.home_snapshot_cta_contact")}
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
