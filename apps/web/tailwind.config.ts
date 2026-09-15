import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0c11",
          panel: "#12151d",
          raised: "#171b25",
        },
        border: {
          DEFAULT: "#232838",
          subtle: "#1b1f2b",
        },
        accent: {
          cyan: "#3fe6cf",
          cyanDim: "#1f7d70",
          purple: "#8b7bf0",
          purpleDim: "#4c4499",
        },
        text: {
          DEFAULT: "#e7ecf4",
          dim: "#8b93a7",
          faint: "#5b6272",
        },
        status: {
          success: "#3ec95f",
          warning: "#f0b23b",
          danger: "#f0605a",
          info: "#4aa3f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(63,230,207,0.15), 0 0 24px -4px rgba(63,230,207,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
