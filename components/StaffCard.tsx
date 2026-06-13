"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SocialLinks from "@/components/SocialLinks";
import type { StaffMember } from "@/lib/types";

export default function StaffCard({ member }: { member: StaffMember }) {
  const { pick } = useLanguage();

  return (
    <article className="hover-glow group flex items-center gap-4 border border-edge bg-void/40 p-4 transition-transform duration-300 hover:-translate-y-1">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-edge bg-gradient-to-br from-[#1A0A2E] to-[#0A0A14]">
        <span className="keep-latin font-rajdhani text-lg font-bold text-text-muted">
          {member.ign
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {pick(member.role)}
        </p>
        <h4 className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-wide text-text-primary">
          {member.ign}
        </h4>
        {member.name ? (
          <p className="truncate text-xs text-text-muted">{member.name}</p>
        ) : null}
      </div>
      <SocialLinks socials={member.socials} />
    </article>
  );
}
