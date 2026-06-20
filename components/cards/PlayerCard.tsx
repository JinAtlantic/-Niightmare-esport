"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/context/LanguageContext";
import PlayerModal from "@/components/cards/PlayerModal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  const { pick, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const isSub = !!player.sub;
  const crop = { zoom: 1, x: 50, y: 50, ...player.photoCrop };
  const photoStyle = {
    objectPosition: `${crop.x}% ${crop.y}%`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    "--zoom": crop.zoom,
  } as React.CSSProperties;

  // Feed the cursor position to the spotlight (--mx/--my, see globals.css).
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <>
      {/* Outer wrapper carries the neon-violet aura on hover (kept off the clipped
          element so the glow isn't trimmed by the bevel). */}
      <article className="group relative transition-shadow duration-300 hover:shadow-[0_0_26px_rgba(168,85,247,0.5)]">
        <div
          ref={cardRef}
          onPointerMove={onMove}
          className="card-spotlight clip-esports relative aspect-[3/4] overflow-hidden border border-edge bg-crypt transition-colors duration-300 group-hover:border-amethyst/70"
        >
          {/* photo, or a monogram placeholder when no photo is set */}
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.ign}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              style={photoStyle}
              className="crop-img object-cover"
            />
          ) : (
            <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-amethyst-deep/40 via-crypt to-void transition-transform duration-500 ease-out group-hover:scale-110">
              {/* layered motif so a photoless card still has depth: a violet
                  glow behind the monogram, a bladed streak, and a top hairline */}
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(168,85,247,0.2),transparent_62%)]" />
              <div aria-hidden className="absolute left-1/2 top-1/2 h-[2px] w-[150%] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] bg-gradient-to-r from-transparent via-amethyst/25 to-transparent" />
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/40 to-transparent" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="keep-latin select-none font-display text-7xl font-bold tracking-tight text-spectre/25 transition-colors duration-500 group-hover:text-spectre/40">
                  {monogram}
                </span>
              </div>
            </div>
          )}

          {/* whole-card trigger — opens the profile. Sits above the photo but
              below the text overlay (pointer-events-none) and social links
              (pointer-events-auto), so only the links escape it. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`${player.ign} — ${t("roster.view_profile")}`}
            className="absolute inset-0 z-[4] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          />

          {/* status badge — top-left, faint neon-violet glow for starters */}
          <span
            className={`pointer-events-none absolute left-3 top-3 z-10 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm ${
              isSub
                ? "border-edge-bright bg-void/60 text-ash"
                : "border-amethyst/60 bg-amethyst/10 text-spectre shadow-[0_0_12px_rgba(168,85,247,0.55)]"
            }`}
          >
            {isSub ? t("roster.badge_sub") : t("roster.badge_main")}
          </span>

          {/* view-profile cue — top-right, fades in on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center border border-amethyst/50 bg-void/60 text-glow opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
          >
            <ArrowRightIcon size={15} className="-rotate-45" />
          </span>

          {/* bottom text overlay — only the name + role; full details and
              contact links live in the modal (click the card). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#1A0A2E]/85 to-transparent px-4 pb-4 pt-14">
            <h3 className="keep-latin font-display text-xl font-bold uppercase leading-none tracking-wide text-soul transition-colors duration-300 group-hover:text-glow md:text-2xl">
              {player.ign}
            </h3>
            <span className="mt-2 inline-flex items-center border-l-2 border-amethyst pl-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-glow md:text-sm">
              {pick(player.role)}
            </span>
          </div>
        </div>
      </article>

      <AnimatePresence>
        {open && (
          <PlayerModal
            key={`pm-${player.id}`}
            player={player}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
