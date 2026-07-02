import React from "react";
import Image from "next/image";
import { opponentCountryCode } from "@/lib/opponentCountries";
import { countryFlagImageUrl } from "@/lib/personProfile";

interface OpponentFlagProps {
  /** Opponent team name — looked up in the central country registry. */
  name?: string;
  /** Flag width in pixels (height is derived 4:3 to match flagcdn w80). */
  width?: number;
  className?: string;
}

/**
 * Small national flag shown beside an opponent's name. Renders nothing when the
 * team isn't in the registry (unknown, or a national team whose logo is already
 * a flag). Sits inline so it can be dropped next to a team-name label anywhere.
 */
export default function OpponentFlag({ name, width = 22, className = "" }: OpponentFlagProps) {
  const code = opponentCountryCode(name);
  const url = countryFlagImageUrl(code);
  if (!url || !code) return null;
  const height = Math.round((width * 3) / 4);

  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_8px_rgba(0,0,0,0.5)] ${className}`}
      style={{ width, height }}
      role="img"
      aria-label={`${code} flag`}
    >
      <Image
        src={url}
        alt=""
        width={width}
        height={height}
        unoptimized
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </span>
  );
}
