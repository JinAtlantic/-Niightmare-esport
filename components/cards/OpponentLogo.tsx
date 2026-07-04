import React from "react";
import Image from "next/image";
import { safeImageSrc } from "@/lib/safety";
import { teamLogoFor } from "@/lib/teamLogos";

interface OpponentLogoProps {
  /**
   * Path/URL to the opponent's logo. Drop the file in /public/teams and pass
   * e.g. <OpponentLogo src="/teams/dragon-force.png" name="Dragon Force" />.
   * When omitted, an initials monogram of the team name is shown instead.
   */
  src?: string | null;
  /** Opponent team name — used for the monogram fallback and the alt text. */
  name: string;
  /** Optional explicit short code (e.g. "ONC"). When set it overrides the
   *  name-derived initials. Trimmed and capped at 4 characters (manual codes);
   *  the auto fallback derived from the name stays 3. */
  abbr?: string;
  /** Box size in pixels. The fixed size keeps every row's logo the same
   *  height; object-contain lets any aspect ratio sit inside it cleanly. */
  size?: number;
  className?: string;
}

/** Up to 3 letters: a single word's first 3 chars, else each word's initial. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/** Resolve the monogram text: explicit abbr wins (up to 4 chars), else derived
 *  initials (3). */
export function opponentMonogram(name: string, abbr?: string): string {
  const code = abbr?.trim();
  if (code) return code.slice(0, 4).toUpperCase();
  return initials(name);
}

export default function OpponentLogo({ src, name, abbr, size = 28, className = "" }: OpponentLogoProps) {
  const dimension = { width: size, height: size, minWidth: size };
  const mono = opponentMonogram(name, abbr);
  // Explicit per-match logo wins; otherwise fall back to the team registry so a
  // team's crest shows automatically by name.
  const safeSrc = safeImageSrc(src) || safeImageSrc(teamLogoFor(name));
  // Longer codes need a smaller glyph to sit inside the same fixed box.
  const fontSize = size * (mono.length >= 4 ? 0.26 : mono.length >= 3 ? 0.32 : 0.42);

  return (
    <span
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={dimension}
      role="img"
      aria-label={`${name} logo`}
    >
      {safeSrc ? (
        <Image
          src={safeSrc}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.65)]"
        />
      ) : (
        <span
          aria-hidden
          className="keep-latin font-display font-bold leading-none tracking-tight text-ash"
          style={{ fontSize }}
        >
          {mono}
        </span>
      )}
    </span>
  );
}
