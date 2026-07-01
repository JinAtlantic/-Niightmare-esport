import React from "react";
import Image from "next/image";

/**
 * Route-level loading fallback — the real NIIGHTMARE logo on a two-tone lit
 * void: it breathes inside a violet aura over an aurora band, with a sweeping
 * loading rail. The whole screen fades in after a short beat (see `.route-loader`
 * in globals.css) so quick navigations never flash the loader — only genuinely
 * slow routes show it, which reads far smoother.
 */
export default function Loading() {
  return (
    <div className="route-loader aurora-band grid min-h-[70vh] place-items-center overflow-hidden px-6">
      <div className="relative z-[1] flex flex-col items-center gap-7">
        <div className="relative grid place-items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.30),rgba(194,75,201,0.12)_45%,transparent_70%)] blur-2xl"
          />
          <Image
            src="/logo.png"
            alt="NIIGHTMARE Esports"
            width={359}
            height={285}
            priority
            className="relative h-auto w-[172px] object-contain motion-safe:animate-logoGlow"
          />
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
