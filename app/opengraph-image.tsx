import { ImageResponse } from "next/og";

// A true 1200×630 social card in the brand's "Premium Violet Void" language —
// generated at build time so Facebook / Discord / X render a full-bleed branded
// preview instead of the small letterboxed logo we used to ship.

export const alt = "NIIGHTMARE Esports — Lao PDR | MLBB & eFootball";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VOID = "#0B0710";
const AMETHYST = "#A855F7";
const GLOW = "#C77DFF";
const SOUL = "#ECE7F2";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: VOID,
          backgroundImage:
            "radial-gradient(120% 90% at 50% 118%, rgba(124,47,214,0.55) 0%, rgba(124,47,214,0.12) 40%, transparent 70%), radial-gradient(80% 60% at 50% -10%, rgba(14,9,22,0.9) 0%, transparent 60%)",
          position: "relative",
        }}
      >
        {/* top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 4,
            backgroundImage: `linear-gradient(90deg, transparent, ${AMETHYST} 35%, ${GLOW} 60%, transparent)`,
          }}
        />

        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 10,
            fontWeight: 600,
            color: "#C9B4F6",
            marginBottom: 28,
          }}
        >
          LAO PDR / MLBB & EFOOTBALL
        </div>

        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: 2,
              backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ead7ff 42%, ${AMETHYST} 82%, #7C2FD6 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            NIIGHTMARE
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: 28,
            color: GLOW,
            marginTop: 6,
          }}
        >
          ESPORT
        </div>

        {/* scythe divider */}
        <div
          style={{
            width: 180,
            height: 4,
            marginTop: 44,
            transform: "skewX(-24deg)",
            backgroundImage: `linear-gradient(90deg, transparent, ${AMETHYST}, ${GLOW}, transparent)`,
          }}
        />

        {/* tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 8,
            fontWeight: 700,
            color: SOUL,
            marginTop: 40,
          }}
        >
          WE HAUNT THE META
        </div>
      </div>
    ),
    size
  );
}
