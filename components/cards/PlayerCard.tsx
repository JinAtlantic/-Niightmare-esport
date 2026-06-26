"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useLanguage } from "@/components/context/LanguageContext";
import { calculateAge, countryFlag, formatBirthDate } from "@/lib/personProfile";
import type { Player } from "@/lib/types";

// Framer-Motion + the modal load on first profile open only, keeping the
// roster grid's initial bundle light.
const PlayerModalHost = dynamic(() => import("@/components/cards/PlayerModalHost"), { ssr: false });

export default function PlayerCard({ player }: { player: Player }) {
  const { pick, t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const monogram = player.ign.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const isSub = !!player.sub;
  const flag = countryFlag(player.countryCode);
  const countryName = player.country ? pick(player.country) : player.countryCode?.toUpperCase();
  const birthDate = formatBirthDate(player.birthDate, lang);
  const age = calculateAge(player.birthDate);
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
      <article className="group relative transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.42)]">
        <div
          ref={cardRef}
          onPointerMove={onMove}
          className="card-spotlight clip-esports relative aspect-[3/4] overflow-hidden border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.9),rgba(11,7,16,1))] transition-colors duration-300 group-hover:border-amethyst/70"
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
            onClick={() => {
              setArmed(true);
              setOpen(true);
            }}
            aria-label={`${player.ign} — ${t("roster.view_profile")}`}
            className="absolute inset-0 z-[4] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          />

          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent" />

          <span
            className={`pointer-events-none absolute left-3 top-3 z-10 bg-void/70 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm ${
              isSub
                ? "border border-edge-bright text-ash"
                : "border border-amethyst/55 text-spectre shadow-[0_0_12px_rgba(168,85,247,0.45)]"
            }`}
          >
            {isSub ? t("roster.badge_sub") : t("roster.badge_main")}
          </span>

          {(flag || countryName) && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex max-w-[52%] items-center gap-1.5 bg-void/75 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-soul backdrop-blur-sm">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              {countryName && <span className="truncate">{countryName}</span>}
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#12091d]/96 to-transparent px-3 pb-3 pt-20 sm:px-4 sm:pb-4">
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-amethyst">
              {pick(player.role)}
            </p>
            <h3 className="keep-latin break-words font-display text-xl font-bold uppercase leading-none tracking-wide text-soul transition-colors duration-300 group-hover:text-glow md:text-2xl">
              {player.ign}
            </h3>
            {player.name && (
              <p className="keep-latin mt-1 truncate font-mono text-[10px] text-spectre/85">
                {player.name}
              </p>
            )}
            {(birthDate || age !== null) && (
              <div className="mt-3 grid grid-cols-2 border border-edge/80 bg-void/55">
                {birthDate && (
                  <div className="border-r border-edge/80 px-2 py-1.5">
                    <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-ash-dim">
                      {t("roster.birth_date")}
                    </p>
                    <p className="mt-0.5 keep-latin font-mono text-[10px] font-semibold text-soul">
                      {birthDate}
                    </p>
                  </div>
                )}
                {age !== null && (
                  <div className="px-2 py-1.5">
                    <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-ash-dim">
                      {t("roster.age_label")}
                    </p>
                    <p className="mt-0.5 keep-latin font-mono text-[10px] font-semibold text-soul">
                      {age} {t("roster.years_old")}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ash transition-colors duration-300 group-hover:text-spectre">
              {t("roster.view_profile")}
            </p>
          </div>
        </div>
      </article>

      {armed && (
        <PlayerModalHost player={player} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
