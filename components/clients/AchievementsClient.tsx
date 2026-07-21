"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import AuroraHalos from "@/components/ui/AuroraHalos";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { enabledGames } from "@/lib/games";
import type { AchievementRecord, AchievementsData } from "@/lib/types";

const EMPTY_RECORDS: AchievementRecord[] = [];

export default function AchievementsClient() {
  const { pick } = useLanguage();
  const content = useContent();
  const achievements = content.achievements as unknown as AchievementsData;
  // Achievements are an independent admin-managed collection. Never derive
  // them from /matches: hiding or editing a result must not change this page.
  const records = achievements.records ?? EMPTY_RECORDS;
  const discovered = [...new Set(records.map((record) => record.game))];
  const games = enabledGames((content.site as { games?: unknown }).games, discovered);
  const [activeGame, setActiveGame] = useState(games[0]?.id ?? "mlbb");

  useEffect(() => {
    if (!games.some((game) => game.id === activeGame)) setActiveGame(games[0]?.id ?? "mlbb");
  }, [activeGame, games]);

  const activeRecords = useMemo(
    () => records.filter((record) => record.game === activeGame && record.enabled !== false),
    [activeGame, records]
  );
  const firstPlaces = activeRecords.filter((record) => /(^|\D)1(st)?($|\D)|champion|winner|ອັນດັບ\s*1/i.test(`${record.placement.en} ${record.placement.lo}`)).length;

  return (
    <>
      <PageHeader
        kicker={pick(achievements.page.kicker)}
        title={pick(achievements.page.title)}
        subtitle={pick(achievements.page.intro)}
        subtitleClassName="text-base font-medium text-spectre md:text-lg"
      />

      <section className="relative isolate mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <AuroraHalos />
        <div className="relative z-[1] overflow-hidden border border-edge bg-crypt/65 p-2 shadow-elev-2">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => {
              const active = game.id === activeGame;
              const count = records.filter((record) => record.game === game.id && record.enabled !== false).length;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setActiveGame(game.id)}
                  aria-pressed={active}
                  className={`relative min-h-[72px] overflow-hidden border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-amethyst bg-gradient-to-br from-amethyst/25 via-crypt2 to-void shadow-[inset_0_-2px_0_#A855F7,0_0_24px_rgba(168,85,247,0.18)]"
                      : "border-edge bg-void/55 hover:border-edge-bright hover:bg-crypt2"
                  }`}
                >
                  <span className="keep-latin block font-display text-lg font-black uppercase tracking-[0.1em] text-soul">{game.shortName}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ash">{count} achievements</span>
                </button>
              );
            })}
          </div>
        </div>

        <div key={activeGame} className="relative z-[1] mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-edge bg-crypt/65 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Game</p>
              <p className="mt-1 keep-latin font-display text-2xl font-black uppercase text-soul">{games.find((game) => game.id === activeGame)?.shortName ?? activeGame}</p>
            </div>
            <div className="border border-edge bg-crypt/65 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">Tournament records</p>
              <p className="mt-1 font-display text-2xl font-black text-soul">{activeRecords.length}</p>
            </div>
            <div className="border border-edge bg-crypt/65 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">First place</p>
              <p className="mt-1 font-display text-2xl font-black text-gold">{firstPlaces}</p>
            </div>
          </div>

          {activeRecords.length ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeRecords.map((record, index) => (
                <Reveal key={record.id} delay={Math.min(index, 8) * 60}>
                  <article className="group h-full overflow-hidden border border-edge bg-crypt transition-all hover:border-amethyst/75 hover:shadow-[0_0_30px_rgba(168,85,247,0.24)]">
                    <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(168,85,247,0.22),transparent_62%),linear-gradient(145deg,#1C1428,#0B0710)]">
                      {record.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={record.image} alt={pick(record.tournament)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center p-6 text-center">
                          <span className="font-display text-2xl font-black uppercase tracking-[0.08em] text-spectre/35">NIIGHTMARE</span>
                        </div>
                      )}
                      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amethyst to-transparent" />
                      {record.year && <span className="absolute left-3 top-3 border border-edge-bright bg-void/85 px-2 py-1 font-mono text-[10px] font-bold text-spectre backdrop-blur">{record.year}</span>}
                    </div>
                    <div className="p-4">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-glow">Placement</p>
                      <p className="mt-1 font-display text-2xl font-black uppercase tracking-wide text-gold">{pick(record.placement) || "—"}</p>
                      <h2 className="mt-3 border-t border-edge pt-3 font-display text-lg font-bold uppercase leading-tight tracking-wide text-soul">{pick(record.tournament)}</h2>
                      {record.description && pick(record.description) && <p className="mt-2 text-sm leading-relaxed text-ash">{pick(record.description)}</p>}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-edge bg-crypt/45 px-6 py-16 text-center">
              <p className="font-display text-xl font-bold uppercase tracking-wide text-soul">No achievements added yet</p>
              <p className="mt-2 font-mono text-xs text-ash">Add tournament photos and placements from Admin → Achievements.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
