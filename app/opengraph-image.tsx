import { ImageResponse } from "next/og";

export const alt = "NIIGHTMARE ESPORT - WE HAUNT THE META";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMETHYST = "#A855F7";
const GLOW = "#C77DFF";
const SOUL = "#ECE7F2";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://niightmare-esport.vercel.app"
).replace(/\/$/, "");

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0B0710",
        }}
      >
        <img
          src={`${SITE_URL}/home-reaper.webp`}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 34%",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(8,5,12,0.92) 0%, rgba(8,5,12,0.58) 34%, rgba(8,5,12,0.18) 70%, rgba(8,5,12,0.28) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(8,5,12,0.22) 0%, rgba(8,5,12,0.08) 36%, rgba(8,5,12,0.78) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -160,
            bottom: -260,
            width: 900,
            height: 560,
            borderRadius: 999,
            background:
              "radial-gradient(ellipse at center, rgba(168,85,247,0.52) 0%, rgba(168,85,247,0.18) 42%, transparent 72%)",
            filter: "blur(18px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 96,
              lineHeight: 0.84,
              fontWeight: 800,
              letterSpacing: 0,
              color: SOUL,
              textShadow:
                "0 8px 34px rgba(0,0,0,0.82), 0 0 42px rgba(168,85,247,0.52)",
            }}
          >
            N
            <span
              style={{
                color: AMETHYST,
                textShadow:
                  "0 0 12px rgba(199,125,255,0.48), 0 0 28px rgba(168,85,247,0.38)",
              }}
            >
              II
            </span>
            GHTMARE
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 86,
              lineHeight: 0.88,
              fontWeight: 800,
              letterSpacing: 3,
              color: "transparent",
              WebkitTextStroke: "2px rgba(236,231,242,0.86)",
              textShadow:
                "0 8px 34px rgba(0,0,0,0.78), 0 0 34px rgba(199,125,255,0.48)",
            }}
          >
            ESPORT
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 34,
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: 5,
              color: SOUL,
              textShadow: "0 6px 24px rgba(0,0,0,0.82)",
            }}
          >
            <span>WE HAUNT THE</span>
            <span style={{ color: GLOW, textShadow: "0 0 24px rgba(199,125,255,0.72)" }}>
              META
            </span>
          </div>

          <div
            style={{
              width: 220,
              height: 4,
              marginTop: 34,
              transform: "skewX(-24deg)",
              background: `linear-gradient(90deg, ${AMETHYST}, ${GLOW}, transparent)`,
              boxShadow: "0 0 20px rgba(168,85,247,0.7)",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
