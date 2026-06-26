"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useLanguage } from "@/components/context/LanguageContext";
import FitText from "@/components/ui/FitText";
import { countryFlag } from "@/lib/personProfile";
import type { StaffMember } from "@/lib/types";

// Framer-Motion + the modal load on first profile open only, keeping the
// roster grid's initial bundle light.
const StaffModalHost = dynamic(() => import("@/components/cards/StaffModalHost"), { ssr: false });

export default function StaffCard({ member }: { member: StaffMember }) {
  const { pick, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const title = member.name || member.ign || "";
  const flag = countryFlag(member.countryCode);
  const countryName = member.country ? pick(member.country) : member.countryCode?.toUpperCase();
  const monogram = title
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          {member.photo ? (
            <Image
              src={member.photo}
              alt={title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
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

          {/* whole-card trigger — opens the profile */}
          <button
            type="button"
            onClick={() => {
              setArmed(true);
              setOpen(true);
            }}
            aria-label={`${title} — ${t("roster.view_profile")}`}
            className="absolute inset-0 z-[4] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          />

          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent" />

          {(flag || countryName) && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex max-w-[62%] items-center gap-1.5 bg-void/75 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-soul backdrop-blur-sm">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              {countryName && <span className="truncate">{countryName}</span>}
            </span>
          )}

          {/* bottom text overlay — only the name + role; contact links live in
              the modal (click the card). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#12091d]/96 to-transparent px-3 pb-3 pt-20 sm:px-4 sm:pb-4">
            <p className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-amethyst">
              {pick(member.role)}
            </p>
            <h3 className="leading-[1.1]">
              <FitText
                max={20}
                min={9}
                className="keep-latin font-display font-bold uppercase tracking-tight text-soul transition-colors duration-300 group-hover:text-glow"
              >
                {title}
              </FitText>
            </h3>
            {member.ign && member.ign !== member.name && (
              <p className="keep-latin mt-1 truncate font-mono text-[10px] text-spectre/85">
                {member.ign}
              </p>
            )}
            <p className="mt-3 border-t border-edge/80 pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ash transition-colors duration-300 group-hover:text-spectre">
              {t("roster.view_profile")}
            </p>
          </div>
        </div>
      </article>

      {armed && (
        <StaffModalHost member={member} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
