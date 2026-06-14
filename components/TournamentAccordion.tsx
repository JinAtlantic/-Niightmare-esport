"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import Reveal from "@/components/Reveal";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import type { Tournament } from "@/lib/types";

function AccordionItem({ tournament }: { tournament: Tournament }) {
  const { t, pick } = useLanguage();
  const [open, setOpen] = useState(false);
  const GameIcon = tournament.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div
      className={`overflow-hidden border bg-crypt transition-colors duration-300 ${
        open ? "border-amethyst/60" : "border-edge"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-amethyst/[0.04]"
      >
        <GameIcon size={20} className="shrink-0 text-amethyst" />
        <span className="flex-1 font-display text-base font-semibold uppercase tracking-[0.06em] text-soul transition-colors group-hover:text-glow">
          {pick(tournament.name)}
        </span>
        <span className="hidden font-mono text-xs tracking-wide text-ash sm:inline">
          {tournament.season}
        </span>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center border text-lg leading-none transition-all duration-300 ${
            open ? "rotate-45 border-amethyst text-glow" : "border-edge text-amethyst"
          }`}
          aria-hidden
        >
          +
        </span>
      </button>

      <div
        className={`grid overflow-hidden transition-all duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="grid gap-4 border-t border-edge px-5 py-5 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                {t("matches.placement")}
              </p>
              <p className="mt-1.5 font-display text-lg font-bold text-glow">
                {pick(tournament.placement)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                {t("matches.prize")}
              </p>
              <p className="keep-latin mt-1.5 font-display text-lg font-bold text-soul">
                {tournament.prize}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                {t("matches.season")}
              </p>
              <p className="keep-latin mt-1.5 font-display text-lg font-bold text-soul">
                {tournament.season}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentAccordion({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <div className="flex flex-col gap-3">
      {tournaments.map((tournament, i) => (
        <Reveal key={tournament.id} delay={i * 70}>
          <AccordionItem tournament={tournament} />
        </Reveal>
      ))}
    </div>
  );
}
