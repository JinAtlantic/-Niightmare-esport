"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { StaffMember } from "@/lib/types";

export default function StaffCard({ member }: { member: StaffMember }) {
  const { pick } = useLanguage();
  const initials = member.ign
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group relative flex h-full flex-wrap items-center gap-4 overflow-hidden border border-l-2 border-edge bg-crypt p-4 transition-colors duration-300 hover:border-amethyst">
      {/* vertical blade — grows on hover */}
      <span
        aria-hidden
        className="absolute left-[-2px] top-0 h-0 w-[2px] bg-gradient-to-b from-amethyst to-glow shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-[height] duration-300 ease-out group-hover:h-full"
      />

      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-edge-bright bg-gradient-to-br from-crypt2 to-void">
        <span className="keep-latin font-display text-base font-bold tracking-wide text-spectre">
          {initials}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-spectre/80">
          {pick(member.role)}
        </p>
        <h4 className="keep-latin font-display text-lg font-bold uppercase tracking-wide text-soul transition-colors duration-300 group-hover:text-glow">
          {member.ign}
        </h4>
        {member.name && (
          <p className="truncate font-mono text-[11px] text-ash-dim">{member.name}</p>
        )}
      </div>

      <SocialLinks
        socials={member.socials}
        className="w-full justify-start border-t border-edge/60 pt-3 sm:w-auto sm:border-0 sm:pt-0"
      />
    </article>
  );
}
