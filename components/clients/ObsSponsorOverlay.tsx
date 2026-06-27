"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Sponsor } from "@/lib/types";

interface ObsSponsorOverlayProps {
  sponsors: Sponsor[];
  position: "top" | "bottom";
  mode: "bar" | "corner";
  seconds: number;
}

function sponsorInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "NM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function SponsorMark({ sponsor, compact = false }: { sponsor: Sponsor; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 border border-white/10 bg-black/42 px-4 shadow-[0_0_24px_rgba(168,85,247,0.16)] backdrop-blur-md ${
        compact ? "h-16 min-w-[190px]" : "h-20 min-w-[250px]"
      }`}
    >
      <div className={`${compact ? "h-9 w-16" : "h-11 w-20"} grid shrink-0 place-items-center overflow-hidden`}>
        {sponsor.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logo} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="keep-latin font-display text-xl font-black tracking-wide text-glow">
            {sponsorInitials(sponsor.name)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-amethyst/90">
          Official Partner
        </p>
        <p className="keep-latin mt-1 truncate font-display text-lg font-black uppercase tracking-[0.08em] text-white">
          {sponsor.name}
        </p>
      </div>
    </div>
  );
}

function chunkSponsors(sponsors: Sponsor[], size: number) {
  const chunks: Sponsor[][] = [];
  for (let i = 0; i < sponsors.length; i += size) chunks.push(sponsors.slice(i, i + size));
  return chunks.length ? chunks : [[]];
}

export default function ObsSponsorOverlay({
  sponsors,
  position,
  mode,
  seconds,
}: ObsSponsorOverlayProps) {
  const cleanSponsors = useMemo(
    () => sponsors.filter((sponsor) => sponsor.name.trim()),
    [sponsors]
  );
  const groups = useMemo(
    () => chunkSponsors(cleanSponsors.length ? cleanSponsors : [{ id: "niightmare", name: "NIIGHTMARE", url: "#", logo: "" }], mode === "corner" ? 1 : 3),
    [cleanSponsors, mode]
  );
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const oldHtmlBg = html.style.background;
    const oldBodyBg = body.style.background;
    const oldBodyOverflow = body.style.overflow;
    html.style.background = "transparent";
    body.style.background = "transparent";
    body.style.overflow = "hidden";
    return () => {
      html.style.background = oldHtmlBg;
      body.style.background = oldBodyBg;
      body.style.overflow = oldBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (groups.length <= 1) return;
    const interval = window.setInterval(() => {
      setGroupIndex((value) => (value + 1) % groups.length);
    }, Math.max(5, seconds) * 1000);
    return () => window.clearInterval(interval);
  }, [groups.length, seconds]);

  const activeSponsors = groups[groupIndex] ?? groups[0] ?? [];
  const vertical = position === "top" ? "top-8" : "bottom-8";

  if (mode === "corner") {
    const sponsor = activeSponsors[0];
    return (
      <div className="fixed inset-0 pointer-events-none bg-transparent text-white">
        <div className={`absolute right-8 ${vertical} animate-[obsFade_600ms_ease_both]`}>
          <SponsorMark sponsor={sponsor} compact />
        </div>
        <style jsx global>{`
          @keyframes obsFade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none bg-transparent text-white">
      <div className={`absolute left-1/2 ${vertical} w-[min(1460px,calc(100vw-96px))] -translate-x-1/2 animate-[obsFade_600ms_ease_both]`}>
        <div className="relative overflow-hidden border border-amethyst/30 bg-[linear-gradient(90deg,rgba(11,7,16,0.34),rgba(28,20,40,0.72),rgba(11,7,16,0.34))] px-5 py-4 shadow-[0_0_34px_rgba(168,85,247,0.18)] backdrop-blur-md">
          <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-glow/80 to-transparent" />
          <div className="flex items-center gap-5">
            <div className="shrink-0 border-r border-white/10 pr-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">
                Live Partners
              </p>
              <p className="keep-latin mt-1 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
                NIIGHTMARE
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              {activeSponsors.map((sponsor) => (
                <SponsorMark key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes obsFade {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
