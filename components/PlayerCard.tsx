"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  const { pick } = useLanguage();

  return (
    <article className="hover-glow group relative flex flex-col items-center border border-edge bg-card pb-6 pt-8 text-center transition-transform duration-300 hover:-translate-y-1.5">
      {/* Top accent border — glows magenta on hover */}
      <span
        className="absolute inset-x-0 top-0 h-[3px] bg-edge transition-all duration-300 group-hover:bg-accent group-hover:shadow-glow-accent"
        aria-hidden
      />

      {/* Avatar placeholder: purple gradient circle with jersey number */}
      <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-primary to-[#3d1466] shadow-glow-soft">
        <span className="keep-latin font-rajdhani text-4xl font-bold text-white/90">
          {player.jersey}
        </span>
      </div>

      <h3 className="keep-latin mt-5 font-rajdhani text-2xl font-bold uppercase tracking-wide text-text-primary">
        {player.ign}
      </h3>

      {player.name ? (
        <p className="mt-0.5 text-sm text-text-muted">{player.name}</p>
      ) : null}

      <span className="mt-3 inline-block border border-primary/60 bg-primary/10 px-3 py-1 font-display text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {pick(player.role)}
      </span>

      {player.description ? (
        <p className="mt-3 max-w-[15rem] px-3 text-sm leading-relaxed text-text-muted">
          {pick(player.description)}
        </p>
      ) : null}

      <SocialLinks socials={player.socials} className="mt-5" />
    </article>
  );
}
