"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { StaffMember } from "@/lib/types";

export default function StaffCard({ member }: { member: StaffMember }) {
  const { pick } = useLanguage();
  const title = member.name || member.ign || "";
  const monogram = title
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group relative transition-shadow duration-300 hover:shadow-[0_0_26px_rgba(168,85,247,0.5)]">
      <div className="clip-esports relative aspect-[3/4] overflow-hidden border border-edge bg-crypt transition-colors duration-300 group-hover:border-amethyst/70">
        {/* photo, or a monogram placeholder when no photo is set */}
        {member.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photo}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amethyst-deep/40 via-crypt to-void transition-transform duration-500 ease-out group-hover:scale-110">
            <span className="keep-latin select-none font-display text-7xl font-bold tracking-tight text-spectre/20">
              {monogram}
            </span>
          </div>
        )}

        {/* bottom text overlay — dark→violet gradient keeps the name legible */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void via-[#1A0A2E]/85 to-transparent px-4 pb-4 pt-14">
          <h3 className="keep-latin truncate font-display text-sm font-bold uppercase leading-tight tracking-wide text-soul transition-colors duration-300 group-hover:text-glow md:text-base">
            {title}
          </h3>
          <span className="mt-2 flex max-w-full items-center gap-1.5 border-l-2 border-amethyst pl-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-spectre">
            <span className="truncate">{pick(member.role)}</span>
          </span>
          <SocialLinks socials={member.socials} size={14} compact className="mt-3" />
        </div>
      </div>
    </article>
  );
}
