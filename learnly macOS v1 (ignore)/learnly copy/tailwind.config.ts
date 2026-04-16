import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        night: "rgb(var(--color-night) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        pine: "rgb(var(--color-pine) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        sage: "rgb(var(--color-sage) / <alpha-value>)",
        violet: "rgb(var(--color-violet) / <alpha-value>)"
      },
      boxShadow: {
        card: "0 20px 50px rgba(32, 25, 20, 0.08)"
      },
      screens: {
        short: { raw: "(max-height: 700px)" }
      }
    }
  },
  plugins: []
};

export default config;
