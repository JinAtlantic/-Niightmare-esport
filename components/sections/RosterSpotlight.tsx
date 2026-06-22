"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import PlayerCard from "@/components/cards/PlayerCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { Bilingual, Player } from "@/lib/types";

const COPY = {
  kicker: { en: "THE SQUAD", lo: "ນັກກິລາ" } as Bilingual,
  title: { en: "MEET THE LINEUP", lo: "ລາຍຊື່ນັກກິລາ" } as Bilingual,
  cta: { en: "VIEW FULL ROSTER", lo: "ເບິ່ງລາຍຊື່ທັງໝົດ" } as Bilingual,
};

/**
 * Home-page roster teaser — the four faces that front the club. Players are the
 * biggest reason fans follow an org, so the home page leads with them and then
 * routes into the full /roster. Mains with photos come first; hidden entirely
 * when there are no players so the band never renders empty.
 */
export default function RosterSpotlight() {
  const { pick } = useLanguage();
  const roster = useContent().roster as {
    mlbb?: { players: Player[] };
    efootball?: { players: Player[] };
  };

  const all = [
    ...(roster.mlbb?.players ?? []),
    ...(roster.efootball?.players ?? []),
  ];
  const mains = all.filter((p) => !p.sub);
  const pool = mains.length ? mains : all;
  // Photos read as a premium, real-org lineup — surface them first.
  const featured = [
    ...pool.filter((p) => p.photo),
    ...pool.filter((p) => !p.photo),
  ].slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-edge bg-gradient-to-b from-void via-crypt/20 to-void px-4 py-20 md:px-6 md:py-24">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-64 w-[min(820px,92vw)] -translate-x-1/2 bg-amethyst/12 blur-3xl"
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered kicker={pick(COPY.kicker)}>
            {pick(COPY.title)}
          </SectionLabel>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {featured.map((player, i) => (
            <Reveal key={player.id} delay={i * 80} className="h-full">
              <PlayerCard player={player} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex justify-center">
            <Link
              href="/roster"
              className="group inline-flex items-center gap-2.5 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
            >
              {pick(COPY.cta)}
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
