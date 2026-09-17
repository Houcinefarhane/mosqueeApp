import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4332",
          light: "#2D6A4F",
          dark: "#081C15",
        },
        secondary: {
          DEFAULT: "#D4AF37",
          light: "#F4D03F",
          dark: "#B8941E",
        },
        background: "#F8F9FA",
        foreground: "#1A1A2E",
        success: "#16A34A",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
