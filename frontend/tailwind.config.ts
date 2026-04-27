import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#CA8A04",
          light: "#FBBF24",
          dark: "#92400E",
          dim: "rgba(202,138,4,0.15)",
        },
        dark: {
          DEFAULT: "#0C0A09",
          100: "#111110",
          200: "#1C1917",
          300: "#292524",
          400: "#44403C",
          500: "#57534E",
        },
        muted: "#A8A29E",
        stone: {
          warm: "#78716C",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        shimmer: "shimmer 2.5s infinite",
        "gold-pulse": "goldPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        goldPulse: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #92400E 0%, #CA8A04 50%, #FBBF24 100%)",
        "dark-gradient": "linear-gradient(180deg, #0C0A09 0%, #1C1917 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(202,138,4,0.3), transparent)",
      },
      backdropBlur: {
        xs: "4px",
        glass: "20px",
      },
      boxShadow: {
        "gold-sm": "0 0 15px rgba(202,138,4,0.15)",
        "gold-md": "0 0 30px rgba(202,138,4,0.2)",
        "gold-lg": "0 0 60px rgba(202,138,4,0.25)",
        glass: "0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
