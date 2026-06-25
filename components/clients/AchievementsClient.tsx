"use client";

import React, { useState } from "react";
import { Trophy, Globe2, Users } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import achievements from "@/data/achievements.json";
import type {
  AchievementsData,
  CampaignEntry,
  FormerPlayer,
  Trophy as TrophyType,
} from "@/lib/types";

const ACH = achievements as unknown as AchievementsData;

/** Tier badge styling — S-Tier wears the brand violet (biggest stage), the
 *  rest step down in prominence. Full class strings so Tailwind keeps them. */
const TIER_BADGE: Record<CampaignEntry["tier"], string> = {
  S: "border-amethyst/50 bg-amethyst/10 text-glow",
  A: "border-spectre/40 bg-spectre/10 text-spectre",
  B: "border-edge-bright bg-void/50 text-ash",
  C: "border-edge bg-void/50 text-ash-dim",
};

/** Medal text color for a podium finish. */
const MEDAL_TEXT: Record<NonNullable<CampaignEntry["medal"]>, string> = {
  gold: "text-gold",
  silver: "text-silver",
  bronze: "text-bronze",
};

/** Timeline node fill — Worlds appearances glow violet, podiums take their
 *  medal color, everything else is a quiet edge dot. */
const NODE_STYLE: Record<string, string> = {
  worlds: "border-amethyst bg-amethyst shadow-[0_0_12px_rgba(168,85,247,0.9)]",
  gold: "border-gold bg-gold",
  silver: "border-silver bg-silver",
  bronze: "border-bronze bg-bronze",
  none: "border-edge-bright bg-void",
};

const yr = (iso: string) => iso.slice(0, 4);
const monogram = (s: string) => s.replace(/\s+/g, "").slice(0, 2).toUpperCase();

function tenure(p: FormerPlayer): string {
  const a = yr(p.joined);
  const b = yr(p.left);
  return a === b ? a : `${a}–${b}`;
}

/** A first-place title — the only place gold breaks the violet palette. */
function TrophyCard({ t }: { t: TrophyType }) {
  return (
    <div className="clip-esports relative flex h-full flex-col overflow-hidden border border-gold/35 bg-gradient-to-b from-gold/[0.07] to-crypt p-6 shadow-glow-gold">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
      />
      <div className="flex items-center justify-between">
        <Trophy size={28} strokeWidth={1.75} className="text-gold" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80">
          Champion
        </span>
      </div>
      <h3 className="keep-latin mt-5 font-display text-lg font-bold uppercase leading-tight text-soul">
        {t.tournament}
      </h3>
      <div className="mt-3 flex items-center gap-2 font-mono text-sm">
        <span className="font-bold text-soul">{t.result}</span>
        {t.opponent && (
          <>
            <span className="text-ash-dim">vs</span>
            <span className="keep-latin text-ash">{t.opponent}</span>
          </>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-gold/15 pt-4 font-mono text-xs">
        <span className="text-ash-dim">{yr(t.date)}</span>
        <span className="font-bold tabular-nums text-gold">{t.prize}</span>
      </div>
    </div>
  );
}

/** One result on the vertical campaign timeline. */
function TimelineEntry({ e, delay }: { e: CampaignEntry; delay: number }) {
  const node = e.worlds ? "worlds" : e.medal ?? "none";
  return (
    <Reveal delay={delay} className="relative pl-8 md:pl-12">
      {/* spine node */}
      <span
        aria-hidden
        className={`absolute left-0 top-5 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 ${NODE_STYLE[node]}`}
      />
      <div
        className={`overflow-hidden border bg-crypt/40 p-4 md:p-5 ${
          e.worlds ? "border-amethyst/40 shadow-glow-soft" : "border-edge"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${TIER_BADGE[e.tier]}`}
              >
                {e.tier}-Tier
              </span>
              {e.worlds && (
                <span className="inline-flex items-center gap-1 border border-amethyst/40 bg-amethyst/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-glow">
                  <Globe2 size={10} strokeWidth={2.25} />
                  Worlds
                </span>
              )}
              <span className="font-mono text-[10px] tabular-nums text-ash-dim">{yr(e.date)}</span>
            </div>
            <h3 className="keep-latin mt-2 font-display text-base font-bold uppercase leading-tight text-soul md:text-lg">
              {e.tournament}
            </h3>
            <p className="mt-1.5 font-mono text-xs text-ash">
              <span className="font-bold tabular-nums text-spectre">{e.result}</span>
              {e.opponent && (
                <>
                  {" "}
                  vs <span className="keep-latin text-spectre">{e.opponent}</span>
                </>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`font-display text-lg font-bold uppercase leading-none ${
                e.medal ? MEDAL_TEXT[e.medal] : "text-soul"
              }`}
            >
              {e.place}
            </p>
            <p className="mt-1.5 font-mono text-xs font-semibold tabular-nums text-ash">{e.prize}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** A past player in the Legacy roll. */
function FormerRow({ p }: { p: FormerPlayer }) {
  return (
    <div className="flex h-full items-center gap-3 border border-edge bg-crypt/30 p-3.5 transition-colors hover:border-edge-bright">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-edge bg-void/60 font-display text-xs font-bold uppercase text-spectre/55">
        {monogram(p.ign)}
      </span>
      <div className="min-w-0">
        <p className="keep-latin truncate font-display text-sm font-bold uppercase text-soul">{p.ign}</p>
        <p className="font-mono text-[11px] text-ash">
          <span className="keep-latin">{p.role}</span>
          <span className="text-ash-dim"> · </span>
          <span className="tabular-nums">{tenure(p)}</span>
        </p>
        {p.note && (
          <p className="keep-latin truncate font-mono text-[10px] text-amethyst/75">{p.note}</p>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: { en: "Overview", lo: "ພາບລວມ" } },
  { id: "campaign", label: { en: "Campaign", lo: "ໄທມ໌ໄລນ໌" } },
  { id: "legacy", label: { en: "Legacy", lo: "ອະດີດ" } },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AchievementsClient() {
  const { pick } = useLanguage();
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <>
      <PageHeader
        kicker={pick(ACH.page.kicker)}
        title={pick(ACH.page.title)}
        subtitle={pick(ACH.page.intro)}
        subtitleClassName="text-base font-medium text-spectre md:text-lg"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        {/* TABS — split the record into focused views so nothing scrolls far */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-1 border-b border-edge">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`group relative -mb-px px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors md:px-8 md:text-base ${
                  active ? "text-soul" : "text-ash hover:text-soul"
                }`}
              >
                <span className="keep-latin">{pick(t.label)}</span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[2px] -skew-x-[24deg] bg-gradient-to-r from-amethyst to-glow transition-opacity duration-300 ${
                    active ? "opacity-100 shadow-[0_0_14px_rgba(168,85,247,0.7)]" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* re-keyed so each view fades in fresh on switch */}
        <div key={tab} className="animate-fadeIn">
          {/* ── OVERVIEW — tale of the tape + trophies + staff ──────────── */}
          {tab === "overview" && (
            <div className="space-y-14">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {ACH.stats.map((s) => (
                  <div key={s.id} className="relative h-full overflow-hidden border border-edge bg-void/55 p-5">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-45 border border-amethyst/15 bg-amethyst/5"
                    />
                    <p className="font-mono text-4xl font-bold leading-none tabular-nums text-soul md:text-5xl">
                      {s.value}
                    </p>
                    <p className="mt-5 font-display text-sm font-bold uppercase tracking-[0.12em] text-spectre">
                      {pick(s.label)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ash">{pick(s.detail)}</p>
                  </div>
                ))}
              </div>

              <div>
                <SectionLabel centered kicker="HALL OF CHAMPIONS">TROPHY CABINET</SectionLabel>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ACH.trophies.map((t) => (
                    <TrophyCard key={t.tournament} t={t} />
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel centered kicker="BEHIND THE WINS">COACHING STAFF</SectionLabel>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {ACH.staff.map((s) => (
                    <div key={s.ign} className="flex items-center gap-3 border border-edge bg-crypt/30 px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center border border-edge bg-void/50 text-amethyst">
                        <Users size={16} strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="keep-latin font-display text-sm font-bold uppercase tracking-[0.04em] text-soul">
                          {s.ign}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                          {pick(s.role)}
                          <span className="text-ash-dim"> · since {s.since}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CAMPAIGN — full timeline ────────────────────────────────── */}
          {tab === "campaign" && (
            <div className="relative mx-auto max-w-3xl">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-2 left-0 w-px bg-gradient-to-b from-amethyst/60 via-edge-bright to-transparent"
              />
              <div className="space-y-4">
                {ACH.campaign.map((e, i) => (
                  <TimelineEntry key={`${e.date}-${e.tournament}`} e={e} delay={i * 40} />
                ))}
              </div>
            </div>
          )}

          {/* ── LEGACY — former players ─────────────────────────────────── */}
          {tab === "legacy" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ACH.formerPlayers.map((p) => (
                <FormerRow key={p.ign} p={p} />
              ))}
            </div>
          )}

        </div>

        <p className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ash-dim">
          Competitive record sourced from Liquipedia
        </p>
      </section>
    </>
  );
}
