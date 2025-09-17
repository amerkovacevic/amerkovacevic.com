import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#334155",   // slate-700 (for light mode)
          DEFAULT: "#1e293b", // slate-800
          dark: "#0f172a",    // slate-900 (for dark mode)
        },
      },
    },
  },
  plugins: [],
};
