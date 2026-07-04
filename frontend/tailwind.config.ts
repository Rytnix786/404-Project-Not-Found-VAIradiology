/** @type {import('tailwindcss').Config} */
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
        background: "var(--background)",
        foreground: "var(--foreground)",
        /* Design system surface tokens */
        surface: {
          base:    "var(--surface-base)",
          raised:  "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          inset:   "var(--surface-inset)",
        },
        border: {
          subtle:  "var(--border-subtle)",
          default: "var(--border-default)",
          strong:  "var(--border-strong)",
        },
        ink: {
          primary:   "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          tertiary:  "var(--ink-tertiary)",
          muted:     "var(--ink-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          muted:   "var(--accent-muted)",
          surface: "var(--accent-surface)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          muted:   "var(--danger-muted)",
          surface: "var(--danger-surface)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          surface: "var(--warn-surface)",
        },
        positive: {
          DEFAULT: "var(--positive)",
          surface: "var(--positive-surface)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        sm:  "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md:  "var(--radius-md)",
        lg:  "var(--radius-lg)",
        xl:  "var(--radius-xl)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "75": "75ms",
        "120": "120ms",
      },
      boxShadow: {
        "card":    "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        "card-lg": "0 4px 16px -2px rgba(0,0,0,0.5), 0 2px 6px -2px rgba(0,0,0,0.4)",
        "modal":   "0 24px 64px -12px rgba(0,0,0,0.7)",
      },
      animation: {
        "fade-in": "fade-in 120ms var(--ease-out) both",
        "slide-up": "slide-up 160ms var(--ease-out) both",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
