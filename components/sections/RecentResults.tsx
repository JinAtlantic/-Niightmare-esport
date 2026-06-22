"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import OpponentLogo from "@/components/cards/OpponentLogo";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import type { Bilingual, GameId, Match, MatchResult } from "@/lib/types";

const COPY = {
  kicker: { en: "FORM", lo: "ຟອມການແຂ່ງ" } as Bilingual,
  title: { en: "RECENT RESULTS", lo: "ຜົນການແຂ່ງຫຼ້າສຸດ" } as Bilingual,
  cta: { en: "ALL MATCHES", lo: "ການແຂ່ງທັງໝົດ" } as Bilingual,
  vs: { en: "VS", lo: "ພົບ" } as Bilingual,
};

const RESULT_LABEL: Record<MatchResult, Bilingual> = {
  win: { en: "WIN", lo: "ຊະນະ" },
  loss: { en: "LOSS", lo: "ແພ້" },
  draw: { en: "DRAW", lo: "ສະເໝີ" },
};

const RESULT_ACCENT: Record<MatchResult, { score: string; badge: string }> = {
  win: { score: "text-win", badge: "border-win/50 bg-win/10 text-win" },
  loss: { score: "text-loss", badge: "border-loss/50 bg-loss/10 text-loss" },
  draw: { score: "text-ash", badge: "border-edge bg-crypt2 text-ash" },
};

// Top hairline tinted by game — violet for MLBB, cyan for eFootball — mirrors
// the accent language used on the full /matches page.
const GAME_BLADE: Record<GameId, string> = {
  mlbb: "via-amethyst",
  efootball: "via-[#22D3EE]",
};

function ResultCard({ match }: { match: Match }) {
  const { pick, lang } = useLanguage();
  const accent = RESULT_ACCENT[match.result];
  const opponent = match.opponent.trim() || "TBD";
  const tournament = pick(match.tournament).trim();

  return (
    <article className="group relative overflow-hidden border border-edge bg-gradient-to-br from-crypt2/85 via-crypt/70 to-void p-4 transition-all duration-300 hover:border-amethyst/65 hover:shadow-[0_0_26px_-6px_rgba(168,85,247,0.45)]">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${GAME_BLADE[match.game]} to-transparent opacity-80`}
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${accent.badge}`}
        >
          {pick(RESULT_LABEL[match.result])}
        </span>
        <time
          dateTime={match.date}
          className="font-mono text-[10px] tracking-wide text-ash"
        >
          {formatDate(match.date, lang)}
        </time>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <OpponentLogo src="/logo.png" name="NIIGHTMARE" size={38} />
        <span
          className={`keep-latin font-display text-3xl font-bold leading-none tracking-[0.06em] ${accent.score}`}
        >
          {match.score}
        </span>
        <OpponentLogo src={match.opponentLogo} name={opponent} size={38} />
      </div>

      <p className="mt-4 truncate text-center font-display text-sm font-bold uppercase tracking-[0.04em] text-soul">
        <span className="text-ash-dim">{pick(COPY.vs)} </span>
        <span className="keep-latin">{opponent}</span>
      </p>
      {tournament && (
        <p className="mt-1 truncate text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ash-dim">
          {tournament}
        </p>
      )}
    </article>
  );
}

/**
 * Home-page recent-form strip — the five newest results with a quick W/D/L
 * summary, routing into the full /matches archive. Signals an active, winning
 * team without the heavy tournament grouping that lives on /matches. Hidden
 * when there are no matches so the band never renders empty.
 */
export default function RecentResults() {
  const { pick } = useLanguage();
  const data = useContent().matches as { matches?: Match[] };
  const recent = [...(data.matches ?? [])]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 5);

  if (recent.length === 0) return null;

  const wins = recent.filter((m) => m.result === "win").length;
  const losses = recent.filter((m) => m.result === "loss").length;
  const draws = recent.filter((m) => m.result === "draw").length;

  return (
    <section className="relative overflow-hidden border-t border-edge bg-void px-4 py-20 md:px-6 md:py-24">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 h-64 w-[min(900px,92vw)] -translate-x-1/2 bg-amethyst/10 blur-3xl"
      />
      <div className="relative z-[1] mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered kicker={pick(COPY.kicker)}>
            {pick(COPY.title)}
          </SectionLabel>
        </Reveal>

        {/* form summary — record across the matches shown below */}
        <Reveal>
          <div className="mt-6 flex items-center justify-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="border border-win/50 bg-win/10 px-2.5 py-1 text-win">
              {wins}W
            </span>
            {draws > 0 && (
              <span className="border border-edge bg-crypt2 px-2.5 py-1 text-ash">
                {draws}D
              </span>
            )}
            <span className="border border-loss/50 bg-loss/10 px-2.5 py-1 text-loss">
              {losses}L
            </span>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {recent.map((match, i) => (
            <Reveal key={match.id} delay={i * 80} className="h-full">
              <ResultCard match={match} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex justify-center">
            <Link
              href="/matches"
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
