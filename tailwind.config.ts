import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── "Premium Violet Void" — the redesigned brand palette ──────────
        // New, explicit tokens (prefer these going forward).
        void: "#0B0710", // background — violet-black
        void2: "#0E0916", // a touch raised from the void
        crypt: "#16101F", // card / panel surface
        crypt2: "#1C1428", // raised surface / hovered panel
        edge: "#2A2138", // hairline border
        "edge-bright": "#3A2E50", // brighter border / ghost-button outline
        amethyst: "#A855F7", // primary brand violet
        "amethyst-deep": "#7C2FD6", // deep violet (CTA fill base, gradients)
        glow: "#C77DFF", // lighter violet — hover / glow
        spectre: "#C9B4F6", // pale violet — ghost echo, data accents
        magenta: "#C24BC9", // counter-light accent (two-tone depth)
        "indigo-deep": "#3A1D6E", // cool shadow / counter-light base
        soul: "#ECE7F2", // primary text
        ash: "#8B8298", // muted text
        "ash-dim": "#5A5366", // dimmest text / units

        // Legacy aliases — existing pages still reference these. They are
        // remapped onto the new palette so the whole site upgrades for free.
        primary: "#A855F7",
        accent: "#C77DFF",
        card: "#16101F",
        "text-primary": "#ECE7F2",
        "text-muted": "#8B8298",
        "hero-purple": "#1C1428",

        // Match result colors
        win: "#34D399",
        loss: "#FB7185",
        draw: "#8B8298",

        // Honors accent — reserved for champion/podium treatment on the
        // Achievements page (the one place gold breaks the violet palette).
        gold: "#F5C451",
        "gold-deep": "#C8952B",
        silver: "#CBD0DE",
        bronze: "#CE8A57",
      },
      fontFamily: {
        // `display` and `rajdhani` both resolve to the display face, which is
        // now Chakra Petch (clipped, blade-like). `rajdhani` is kept as an
        // alias so existing `font-rajdhani` usages keep working.
        display: ["var(--font-rajdhani)", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        barlow: ["var(--font-barlow)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        lao: ["var(--font-lao)", "sans-serif"],
      },
      borderRadius: {
        // Sharp, aggressive aesthetic — rectangular corners never exceed 4px.
        // `full` is preserved for intentional circles.
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "4px",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 18px rgba(168, 85, 247, 0.55)",
        "glow-accent": "0 0 22px rgba(199, 125, 255, 0.6)",
        "glow-soft": "0 0 12px rgba(168, 85, 247, 0.35)",
        "glow-gold": "0 0 20px rgba(245, 196, 81, 0.4)",
        // Elevation ramp — a layered dark drop + a faint violet rim + a soft
        // glow, so panels read as physically raised (premium depth) instead of
        // a flat outline. elev-1 subtle → elev-3 flagship.
        "elev-1": "0 1px 2px rgba(0,0,0,0.45), 0 4px 14px -6px rgba(0,0,0,0.5)",
        "elev-2":
          "0 8px 24px -10px rgba(0,0,0,0.65), 0 0 0 1px rgba(168,85,247,0.07), 0 0 28px -10px rgba(168,85,247,0.28)",
        "elev-3":
          "0 30px 70px -24px rgba(0,0,0,0.82), 0 0 0 1px rgba(168,85,247,0.09), 0 0 56px -14px rgba(168,85,247,0.32)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 24px rgba(168,85,247,0.45), 0 0 60px rgba(199,125,255,0.25)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 44px rgba(168,85,247,0.8), 0 0 110px rgba(199,125,255,0.5)",
            transform: "scale(1.03)",
          },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slashSlide: {
          "0%": { transform: "translateX(-120%) rotate(-12deg)" },
          "100%": { transform: "translateX(120%) rotate(-12deg)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        rise: "rise 0.8s ease-out forwards",
        slashSlide: "slashSlide 7s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
