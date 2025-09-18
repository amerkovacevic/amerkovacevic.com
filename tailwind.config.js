// Tailwind pulls design tokens from the shared JSON file so design changes
// stay consistent between utility classes and React components.
import tokens from "./src/shared/design/tokens.json" assert { type: "json" };

const brand = tokens.colors.brand;
const surface = tokens.colors.surface;
const border = tokens.colors.border;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: brand.DEFAULT,
          foreground: brand.foreground,
          muted: brand.muted,
          subtle: brand.subtle,
          strong: brand.strong,
          accent: brand.accent,
        },
        surface: {
          DEFAULT: surface.DEFAULT,
          muted: surface.muted,
          overlay: surface.overlay,
          overlayDark: surface.overlayDark,
        },
        border: {
          light: border.light,
          dark: border.dark,
        },
      },
      borderRadius: {
        brand: tokens.radius.md,
        "brand-lg": tokens.radius.lg,
        "brand-xl": tokens.radius.xl,
        "brand-full": tokens.radius.full,
      },
      boxShadow: {
        brand: tokens.shadows.md,
        "brand-sm": tokens.shadows.sm,
      },
      fontFamily: {
        brand: tokens.typography.fontFamily.split(",").map((part) => part.trim()),
      },
      maxWidth: {
        brand: tokens.layout.maxWidth,
      },
      spacing: {
        "page-gutter": tokens.layout.pagePadding,
      },
    },
  },
  plugins: [],
};
