"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  const { pick } = useLanguage();
  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const isSub = !!player.sub;
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const photoStyle = {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    "--zoom": crop.zoom,
  } as React.CSSProperties;

  return (
    // Outer wrapper carries the neon-violet aura on hover (kept off the clipped
    // element so the glow isn't trimmed by the bevel).
    <article className="group relative transition-shadow duration-300 hover:shadow-[0_0_26px_rgba(168,85,247,0.5)]">
      <div className="clip-esports relative aspect-[3/4] overflow-hidden border border-edge bg-crypt transition-colors duration-300 group-hover:border-amethyst/70">
        {/* photo, or a monogram placeholder when no photo is set */}
        {player.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo}
            alt={player.ign}
            style={photoStyle}
            className="crop-img absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amethyst-deep/40 via-crypt to-void transition-transform duration-500 ease-out group-hover:scale-110">
            <span className="keep-latin select-none font-display text-7xl font-bold tracking-tight text-spectre/20">
              {monogram}
            </span>
          </div>
        )}

        {/* status badge — top-left, faint neon-violet glow for starters */}
        <span
          className={`absolute left-3 top-3 z-10 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm ${
            isSub
              ? "border-edge-bright bg-void/60 text-ash"
              : "border-amethyst/60 bg-amethyst/10 text-spectre shadow-[0_0_12px_rgba(168,85,247,0.55)]"
          }`}
        >
          {isSub ? "Sub" : "Main"}
        </span>

        {/* bottom text overlay — dark→violet gradient keeps the name legible */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#1A0A2E]/85 to-transparent px-4 pb-4 pt-14">
          <h3 className="keep-latin font-display text-xl font-bold uppercase leading-none tracking-wide text-soul transition-colors duration-300 group-hover:text-glow md:text-2xl">
            {player.ign}
          </h3>
          {player.name && (
            <p className="mt-1 truncate font-mono text-xs text-spectre md:text-sm">{player.name}</p>
          )}
          <span className="mt-2 inline-flex items-center border-l-2 border-amethyst pl-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-glow md:text-sm">
            {pick(player.role)}
          </span>
          <SocialLinks socials={player.socials} size={14} compact className="mt-3" />
        </div>
      </div>
    </article>
  );
}
