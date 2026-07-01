import React from "react";
import TeamLogo from "@/components/cards/TeamLogo";

/**
 * Route-level loading fallback — the brand on a two-tone lit void: the team
 * logo pulses inside a violet aura, over an aurora band, with a sweeping
 * loading rail. On-brand and premium rather than a generic grey skeleton.
 */
export default function Loading() {
  return (
    <div className="aurora-band grid min-h-[70vh] place-items-center overflow-hidden px-6">
      <div className="relative z-[1] flex flex-col items-center gap-7">
        <div className="relative grid place-items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.34),rgba(194,75,201,0.14)_45%,transparent_70%)] blur-2xl"
          />
          <TeamLogo size={112} pulse />
        </div>
        <div className="flex flex-col items-center gap-3.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.42em] text-spectre/70">
            Loading
          </span>
          <span className="loading-bar" aria-hidden />
        </div>
      </div>
    </div>
  );
}
