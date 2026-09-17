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
          DEFAULT: "#5D3A2F",
          light: "#7B5245",
          dark: "#3D251E",
        },
        secondary: {
          DEFAULT: "#B28C5F",
          light: "#C9A876",
          dark: "#967349",
        },
        background: "#FAF6F0",
        surface: {
          DEFAULT: "#FFFCF8",
          muted: "#F0E8DE",
          warm: "#F7F0E8",
        },
        foreground: "#3D251E",
        success: "#16A34A",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(93 58 47 / 0.08), 0 4px 12px -2px rgb(93 58 47 / 0.1)",
        elevated: "0 4px 6px -1px rgb(93 58 47 / 0.1), 0 10px 24px -4px rgb(93 58 47 / 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
