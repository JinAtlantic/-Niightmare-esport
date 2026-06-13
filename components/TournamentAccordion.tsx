"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { EfootballIcon, MlbbIcon } from "@/components/Icons";
import type { Tournament } from "@/lib/types";

function AccordionItem({ tournament }: { tournament: Tournament }) {
  const { t, pick } = useLanguage();
  const [open, setOpen] = useState(false);
  const GameIcon = tournament.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div className="border border-edge bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/5"
      >
        <GameIcon size={20} className="shrink-0 text-accent" />
        <span className="flex-1 font-display text-base font-semibold uppercase tracking-[0.08em] text-text-primary">
          {pick(tournament.name)}
        </span>
        <span className="hidden text-sm text-text-muted sm:inline">
          {tournament.season}
        </span>
        <span
          className={`grid h-7 w-7 place-items-center border border-edge text-accent transition-transform duration-300 ${
            open ? "rotate-45" : ""
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
          <div className="grid gap-4 border-t border-edge px-4 py-4 sm:grid-cols-3">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {t("matches.placement")}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-accent">
                {pick(tournament.placement)}
              </p>
            </div>
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {t("matches.prize")}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-text-primary">
                {tournament.prize}
              </p>
            </div>
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {t("matches.season")}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-text-primary">
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
      {tournaments.map((tournament) => (
        <AccordionItem key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
