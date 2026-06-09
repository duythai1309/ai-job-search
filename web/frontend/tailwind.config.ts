import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        accent: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        surface: "#F8FAFC",
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
        navy: {
          900: "#0f3460",
          800: "#16213e",
          700: "#1a1a2e",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)",
        "card-hover": "0 8px 24px -4px rgb(0 0 0 / .10), 0 2px 6px -2px rgb(0 0 0 / .06)",
        "btn-accent": "0 4px 14px 0 rgb(245 158 11 / .35)",
        "btn-cta":    "0 4px 14px 0 rgb(16 185 129 / .35)",
        "btn-brand":  "0 4px 14px 0 rgb(79 70 229 / .30)",
      },
    },
  },
  plugins: [],
};

export default config;
