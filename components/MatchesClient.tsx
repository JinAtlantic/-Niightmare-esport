"use client";

import React, { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import PageHeader from "@/components/PageHeader";
import SectionLabel from "@/components/SectionLabel";
import TournamentAccordion from "@/components/TournamentAccordion";
import { EfootballIcon, MlbbIcon, PlayIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import matchesData from "@/data/matches.json";
import type { Match, MatchResult, Tournament } from "@/lib/types";

const data = matchesData as { matches: Match[]; tournaments: Tournament[] };

type Filter = "all" | "mlbb" | "efootball" | "wins" | "losses";

const FILTERS: { id: Filter; labelKey: string }[] = [
  { id: "all", labelKey: "matches.filter_all" },
  { id: "mlbb", labelKey: "matches.filter_mlbb" },
  { id: "efootball", labelKey: "matches.filter_efootball" },
  { id: "wins", labelKey: "matches.filter_wins" },
  { id: "losses", labelKey: "matches.filter_losses" },
];

const RESULT_STYLES: Record<MatchResult, string> = {
  win: "border-win/60 bg-win/10 text-win",
  loss: "border-loss/60 bg-loss/10 text-loss",
  draw: "border-draw/60 bg-draw/15 text-text-muted",
};

const RESULT_KEY: Record<MatchResult, string> = {
  win: "matches.result_win",
  loss: "matches.result_loss",
  draw: "matches.result_draw",
};

function ResultBadge({ result }: { result: MatchResult }) {
  const { t } = useLanguage();
  return (
    <span
      className={`inline-block min-w-[64px] border px-3 py-1 text-center font-display text-xs font-bold uppercase tracking-[0.12em] ${RESULT_STYLES[result]}`}
    >
      {t(RESULT_KEY[result])}
    </span>
  );
}

function MatchRow({ match }: { match: Match }) {
  const { t, pick, lang } = useLanguage();
  const GameIcon = match.game === "mlbb" ? MlbbIcon : EfootballIcon;

  return (
    <div className="hover-glow grid grid-cols-2 items-center gap-3 border border-edge bg-card p-4 md:grid-cols-[auto_1fr_auto_auto_auto] md:gap-5">
      {/* Game + date */}
      <div className="flex items-center gap-3">
        <GameIcon size={22} className="shrink-0 text-accent" />
        <time className="text-sm text-text-muted" dateTime={match.date}>
          {formatDate(match.date, lang)}
        </time>
      </div>

      {/* Tournament + opponent */}
      <div className="col-span-2 min-w-0 md:col-span-1">
        <p className="truncate font-display text-sm font-semibold uppercase tracking-[0.08em] text-text-primary">
          {pick(match.tournament)}
        </p>
        <p className="truncate text-sm text-text-muted">
          <span className="keep-latin">vs {match.opponent}</span>
        </p>
      </div>

      {/* Score */}
      <div className="keep-latin font-display text-xl font-bold tracking-widest text-text-primary">
        {match.score}
      </div>

      {/* Result */}
      <ResultBadge result={match.result} />

      {/* VOD */}
      <div className="flex justify-end">
        {match.vod ? (
          <a
            href={match.vod}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-glow inline-flex items-center gap-1.5 border border-edge px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-text-muted hover:text-accent"
          >
            <PlayIcon size={14} />
            {t("common.watch_vod")}
          </a>
        ) : (
          <span className="inline-block w-[1px]" aria-hidden />
        )}
      </div>
    </div>
  );
}

export default function MatchesClient() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return data.matches.filter((m) => {
      switch (filter) {
        case "mlbb":
          return m.game === "mlbb";
        case "efootball":
          return m.game === "efootball";
        case "wins":
          return m.result === "win";
        case "losses":
          return m.result === "loss";
        default:
          return true;
      }
    });
  }, [filter]);

  return (
    <>
      <PageHeader title={t("sections.match_results")} />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ id, labelKey }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={active}
                className={`hover-glow border px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-edge bg-card text-text-muted hover:text-text-primary"
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* Results list */}
        <div className="mt-8 flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((match) => <MatchRow key={match.id} match={match} />)
          ) : (
            <p className="border border-edge bg-card p-8 text-center text-text-muted">
              {t("matches.no_results")}
            </p>
          )}
        </div>

        {/* Tournament history */}
        <div className="mt-20">
          <SectionLabel>{t("sections.tournament_history")}</SectionLabel>
          <div className="mt-8">
            <TournamentAccordion tournaments={data.tournaments} />
          </div>
        </div>
      </section>
    </>
  );
}
