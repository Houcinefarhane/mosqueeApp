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
        nuit: "#1E110A",
        brun: {
          DEFAULT: "#3B2216",
          doux: "#6B4528",
        },
        or: {
          DEFAULT: "#C8962E",
          clair: "#E6C072",
        },
        blanc: "#FFFFFF",
        filet: "#EADFCB",
        sable: "#F3EBDD",
        /* Alias legacy → nouvelle identité */
        primary: {
          DEFAULT: "#3B2216",
          light: "#6B4528",
          dark: "#1E110A",
        },
        secondary: {
          DEFAULT: "#C8962E",
          light: "#E6C072",
          dark: "#A67B24",
        },
        background: "#FFFFFF",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3EBDD",
          warm: "#F3EBDD",
        },
        foreground: "#3B2216",
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
