import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "#0A1628",
          900: "#0F1F3A",
          800: "#153052",
          700: "#1E3A5F"
        },
        field: {
          50: "#ecfdf5",
          100: "#d1fae5",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857"
        },
        accent: {
          100: "#fef3c7",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b"
        },
        ink: "#0f172a",
        mist: "#f4f7fb"
      },
      boxShadow: {
        soft: "0 20px 40px rgba(15, 31, 58, 0.08)",
        panel: "0 24px 60px rgba(15, 31, 58, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
