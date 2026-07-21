"use client";

import React from "react";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { safeImageSrc } from "@/lib/safety";
import { resolveSponsorGroup } from "@/lib/sponsorGroups";
import type { Bilingual, SponsorGroup } from "@/lib/types";

interface MarqueeSponsor {
  id: string;
  name: string;
  logo?: string;
  partnerGroup?: SponsorGroup;
}

const FALLBACK_LABEL: Bilingual = { en: "OUR PARTNERS", lo: "partners ຂອງເຮົາ" };

/**
 * Footer partner band — sponsor logos in a single horizontal row that slowly
 * auto-scrolls left→right (see .marquee-track in globals.css). The list is
 * rendered twice so the loop is seamless; the second copy is aria-hidden. Logos
 * render when uploaded; until then each partner shows as a name wordmark, so the
 * band works before any logo files exist. Hover pauses the scroll.
 */
export default function SponsorMarquee() {
  const { pick } = useLanguage();
  const content = useContent().sponsors as {
    page?: { partnersLabel?: Bilingual };
    sponsors?: MarqueeSponsor[];
  };
  const sponsors = (content.sponsors ?? []).filter(
    (sponsor) => resolveSponsorGroup(sponsor.partnerGroup) !== "past"
  );
  if (sponsors.length === 0) return null;

  const label = content.page?.partnersLabel ?? FALLBACK_LABEL;
  const loop = [...sponsors, ...sponsors];

  return (
    <div className="border-t border-edge">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-2 w-6 skew-x-[-18deg] bg-amethyst/70" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-amethyst">
            {pick(label)}
          </span>
        </div>

        <div className="marquee-viewport marquee-mask mt-5 overflow-hidden">
          <ul className="marquee-track items-center">
            {loop.map((s, i) => {
              const logo = safeImageSrc(s.logo);
              return (
                <li
                  key={`${s.id}-${i}`}
                  aria-hidden={i >= sponsors.length}
                  className="flex h-12 shrink-0 items-center justify-center px-7 md:px-10"
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={`${s.name} logo`}
                      className="max-h-11 w-auto max-w-[140px] object-contain opacity-90 transition-opacity duration-300 hover:opacity-100"
                    />
                  ) : (
                    <span className="keep-latin whitespace-nowrap font-display text-base font-bold uppercase tracking-[0.08em] text-spectre transition-colors duration-300 hover:text-soul md:text-lg">
                      {s.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
