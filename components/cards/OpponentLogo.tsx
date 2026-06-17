import React from "react";
import Image from "next/image";

interface OpponentLogoProps {
  /**
   * Path/URL to the opponent's logo. Drop the file in /public/teams and pass
   * e.g. <OpponentLogo src="/teams/dragon-force.png" name="Dragon Force" />.
   * When omitted, an initials monogram of the team name is shown instead.
   */
  src?: string | null;
  /** Opponent team name — used for the monogram fallback and the alt text. */
  name: string;
  /** Box diameter in pixels. The fixed size keeps every row's logo the same
   *  height; object-contain lets any aspect ratio sit inside it cleanly. */
  size?: number;
  className?: string;
}

/** First letters of the first and last word (max 2 chars). */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function OpponentLogo({ src, name, size = 28, className = "" }: OpponentLogoProps) {
  const dimension = { width: size, height: size, minWidth: size };

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-edge bg-gradient-to-br from-crypt2/80 to-void/80 shadow-[inset_0_0_14px_rgba(168,85,247,0.10)] ${className}`}
      style={dimension}
      role="img"
      aria-label={`${name} logo`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          className="h-full w-full object-contain p-[15%]"
          width={size}
          height={size}
        />
      ) : (
        <span
          aria-hidden
          className="keep-latin font-display font-bold leading-none text-ash"
          style={{ fontSize: size * 0.4 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
