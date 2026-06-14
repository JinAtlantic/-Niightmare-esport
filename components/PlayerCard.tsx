"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  const { pick } = useLanguage();
  // Jersey number when available, otherwise a two-letter monogram from the IGN.
  const monogram = (player.jersey ?? player.ign.replace(/\s+/g, "").slice(0, 2)).toUpperCase();

  return (
    <article className="hover-glow clip-diagonal group relative flex h-full flex-col items-center overflow-hidden border border-edge bg-crypt px-6 pb-7 pt-9 text-center transition-transform duration-300 hover:-translate-y-1.5">
      {/* top accent — brightens on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* substitute badge */}
      {player.sub && (
        <span className="absolute left-4 top-4 z-[1] border border-edge-bright bg-void/60 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-ash">
          Sub
        </span>
      )}

      {/* monogram as a faint watermark */}
      <span
        aria-hidden
        className="keep-latin pointer-events-none absolute -right-2 -top-6 select-none font-display text-[5.5rem] font-bold leading-none text-spectre/[0.05]"
      >
        {monogram}
      </span>

      {/* avatar — gradient disc with an amethyst aura and the monogram */}
      <div className="relative grid h-28 w-28 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.35),transparent_70%)] opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-amethyst/50 bg-gradient-to-br from-amethyst-deep/60 to-void shadow-[inset_0_0_22px_rgba(168,85,247,0.25)]">
          {player.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.photo} alt={player.ign} className="h-full w-full object-cover" />
          ) : (
            <span className="keep-latin font-display text-[1.9rem] font-bold tracking-tight text-soul [text-shadow:0_0_18px_rgba(199,125,255,0.6)]">
              {monogram}
            </span>
          )}
        </div>
      </div>

      <h3 className="keep-latin relative mt-5 font-display text-2xl font-bold uppercase tracking-wide text-soul transition-colors duration-300 group-hover:text-glow">
        {player.ign}
      </h3>

      {player.name && (
        <p className="mt-1 font-mono text-xs tracking-wide text-ash">{player.name}</p>
      )}

      <span className="mt-3 inline-flex items-center border border-amethyst/40 bg-amethyst/[0.08] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-spectre">
        {pick(player.role)}
      </span>

      {player.description && (
        <p className="relative mt-4 max-w-[16rem] text-sm leading-relaxed text-ash">
          {pick(player.description)}
        </p>
      )}

      <SocialLinks socials={player.socials} className="mt-auto pt-6" />
    </article>
  );
}
