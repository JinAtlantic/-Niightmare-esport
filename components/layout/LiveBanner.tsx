"use client";

import React from "react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import type { UpcomingMatch } from "@/lib/types";

/**
 * Site-wide live alert. Only renders while the upcoming match is flagged
 * `status: "live"` in the admin/data, so it costs nothing the rest of the time.
 * When the team is playing it sticks under the navbar on every page with a
 * pulsing rose cue and the active matchup.
 */
export default function LiveBanner() {
  const { t } = useLanguage();
  const { site } = useContent();
  const match = site.upcomingMatch as UpcomingMatch | undefined;
  if (!match || match.status !== "live") return null;
  const opponent = match.opponent?.trim();
  return (
    <div className="sticky top-16 z-30 border-b border-loss/45 bg-gradient-to-r from-loss/20 via-loss/[0.08] to-loss/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-center">
        <span className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-loss">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-loss opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-loss" />
          </span>
          {t("sections.upcoming_status_live")}
        </span>

        <span className="keep-latin font-display text-sm font-semibold uppercase tracking-wide text-soul">
          NIIGHTMARE
          {opponent && (
            <>
              {" "}
              <span className="text-ash">{t("common.vs")}</span> {opponent}
            </>
          )}
        </span>

      </div>
    </div>
  );
}
