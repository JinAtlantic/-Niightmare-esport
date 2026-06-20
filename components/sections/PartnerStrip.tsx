"use client";

import React from "react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Reveal from "@/components/ui/Reveal";
import type { Bilingual } from "@/lib/types";

interface Sponsor {
  id: string;
  name: string;
  url?: string;
}

/**
 * Quiet trust bar between the fixture card and the stats: the partner wordmarks
 * read as social proof in the first scroll, and the short, low band changes the
 * page's rhythm so the home page doesn't stack three tall sections in a row.
 * Names render as monochrome wordmarks (no logo files are stored yet).
 */
export default function PartnerStrip() {
  const { pick } = useLanguage();
  const content = useContent().sponsors as {
    page?: { partnersLabel?: Bilingual };
    sponsors?: Sponsor[];
  };
  const sponsors = content.sponsors ?? [];
  if (sponsors.length === 0) return null;
  const label = content.page?.partnersLabel;

  return (
    <section className="relative border-b border-edge bg-void">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-9">
        <Reveal>
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
            {label && (
              <div className="flex shrink-0 items-center gap-3">
                <span aria-hidden className="label-tick" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-amethyst">
                  {pick(label)}
                </span>
              </div>
            )}
            <ul className="flex flex-1 flex-wrap items-center justify-center gap-x-7 gap-y-3 md:justify-between md:gap-x-4">
              {sponsors.map((s) => (
                <li key={s.id}>
                  <span className="keep-latin font-display text-base font-bold uppercase tracking-[0.08em] text-ash/70 transition-colors duration-300 hover:text-soul md:text-lg">
                    {s.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
