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
        field: {
          50: "#eefdf5",
          100: "#d5f8e5",
          500: "#19a660",
          600: "#128149",
          700: "#0f653d"
        },
        ink: "#17201c"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 32, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
