import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand identity tokens
        primary: "#8B2FC9", // deep purple
        accent: "#C244C4", // reaper magenta / glow
        void: "#0A0A14", // background void black
        card: "#120D1E", // card background
        edge: "#2A1545", // border
        "text-primary": "#F0F0F0",
        "text-muted": "#6B6B7A",
        "hero-purple": "#1A0A2E", // hero diagonal left
        win: "#1FBF75",
        loss: "#E5484D",
        draw: "#6B6B7A",
      },
      fontFamily: {
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        barlow: ["var(--font-barlow)", "sans-serif"],
        lao: ["var(--font-noto-lao)", "sans-serif"],
      },
      borderRadius: {
        // Sharp, aggressive aesthetic — rectangular corners never exceed 4px.
        // `full` is preserved for intentional circles (logo, player avatars).
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
        glow: "0 0 18px rgba(139, 47, 201, 0.55)",
        "glow-accent": "0 0 22px rgba(194, 68, 196, 0.6)",
        "glow-soft": "0 0 12px rgba(139, 47, 201, 0.35)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 24px rgba(139,47,201,0.45), 0 0 60px rgba(194,68,196,0.25)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 44px rgba(139,47,201,0.8), 0 0 110px rgba(194,68,196,0.5)",
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
        slashSlide: {
          "0%": { transform: "translateX(-120%) rotate(-12deg)" },
          "100%": { transform: "translateX(120%) rotate(-12deg)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        slashSlide: "slashSlide 7s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
