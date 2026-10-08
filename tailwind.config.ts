import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nuit: "var(--color-nuit)",
        brun: {
          DEFAULT: "var(--color-brun)",
          doux: "var(--color-brun-doux)",
        },
        or: {
          DEFAULT: "var(--color-or)",
          clair: "var(--color-or-clair)",
        },
        blanc: "var(--color-blanc)",
        filet: "var(--color-filet)",
        sable: "var(--color-sable)",
        /* Alias legacy → nouvelle identité */
        primary: {
          DEFAULT: "var(--color-brun)",
          light: "var(--color-brun-doux)",
          dark: "var(--color-nuit)",
        },
        secondary: {
          DEFAULT: "var(--color-or)",
          light: "var(--color-or-clair)",
          dark: "#A67B24",
        },
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          warm: "var(--surface-muted)",
        },
        foreground: "var(--foreground)",
        success: "#C8962E",
        danger: "#6B4528",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(30 17 10 / 0.04)",
        elevated: "0 2px 8px -2px rgb(30 17 10 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
