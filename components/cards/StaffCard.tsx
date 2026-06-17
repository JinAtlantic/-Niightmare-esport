"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/context/LanguageContext";
import FitText from "@/components/ui/FitText";
import StaffModal from "@/components/cards/StaffModal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { StaffMember } from "@/lib/types";

export default function StaffCard({ member }: { member: StaffMember }) {
  const { pick, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const title = member.name || member.ign || "";
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
      <article className="group relative transition-shadow duration-300 hover:shadow-[0_0_26px_rgba(168,85,247,0.5)]">
        <div
          ref={cardRef}
          onPointerMove={onMove}
          className="card-spotlight clip-esports relative aspect-[3/4] overflow-hidden border border-edge bg-crypt transition-colors duration-300 group-hover:border-amethyst/70"
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
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amethyst-deep/40 via-crypt to-void transition-transform duration-500 ease-out group-hover:scale-110">
              <span className="keep-latin select-none font-display text-7xl font-bold tracking-tight text-spectre/20">
                {monogram}
              </span>
            </div>
          )}

          {/* whole-card trigger — opens the profile */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`${title} — ${t("roster.view_profile")}`}
            className="absolute inset-0 z-[4] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          />

          {/* view-profile cue — top-right, fades in on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center border border-amethyst/50 bg-void/60 text-glow opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
          >
            <ArrowRightIcon size={15} className="-rotate-45" />
          </span>

          {/* bottom text overlay — only the name + role; contact links live in
              the modal (click the card). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#1A0A2E]/85 to-transparent px-4 pb-4 pt-14">
            <h3 className="leading-[1.1]">
              <FitText
                max={20}
                min={9}
                className="keep-latin font-display font-bold uppercase tracking-tight text-soul transition-colors duration-300 group-hover:text-glow"
              >
                {title}
              </FitText>
            </h3>
            <span className="mt-2 flex max-w-full items-center gap-1.5 border-l-2 border-amethyst pl-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-spectre md:text-sm">
              <span className="truncate">{pick(member.role)}</span>
            </span>
          </div>
        </div>
      </article>

      <AnimatePresence>
        {open && (
          <StaffModal
            key={`sm-${member.id}`}
            member={member}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
