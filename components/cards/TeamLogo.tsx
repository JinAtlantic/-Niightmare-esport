import React from "react";
import Image from "next/image";

interface TeamLogoProps {
  /**
   * Path/URL to the real logo image. When provided, the image is rendered
   * inside the circular frame. When omitted, a labelled "NM" placeholder
   * is shown instead. Drop the real file in /public and pass e.g.
   * <TeamLogo src="/logo.png" />.
   */
  src?: string;
  /** Diameter in pixels. Defaults to 120 (the brand placeholder size). */
  size?: number;
  /** Adds the glowing pulse animation (used in the hero). */
  pulse?: boolean;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export default function TeamLogo({
  src,
  size = 120,
  pulse = false,
  className = "",
  alt = "NIIGHTMARE Esports logo",
  priority = false,
}: TeamLogoProps) {
  const dimension = { width: size, height: size, minWidth: size };

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-full border-2 border-primary bg-gradient-to-br from-[#1A0A2E] to-[#0A0A14] ${
        pulse ? "animate-pulseGlow" : ""
      } ${className}`}
      style={dimension}
      aria-label={alt}
      role="img"
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          width={size}
          height={size}
          priority={priority}
        />
      ) : (
        <span
          className="keep-latin font-rajdhani font-bold tracking-tight text-text-primary"
          style={{ fontSize: size * 0.42 }}
        >
          NM
        </span>
      )}
    </div>
  );
}
