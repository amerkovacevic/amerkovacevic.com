// src/components/ThemeToggle.tsx
import { useTheme } from "../theme";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-16 h-8 rounded-full bg-gray-700 animate-pulse" aria-hidden />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "relative inline-flex w-16 h-8 items-center rounded-full transition-colors",
        // flipped backgrounds: light mode -> dark track, dark mode -> light track
        isDark ? "bg-gray-300" : "bg-gray-700",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 dark:focus:ring-offset-gray-900",
      ].join(" ")}
    >
      {/* Sun (left) and Moon (right) */}
      <span className="absolute left-2 text-sm">☀️</span>
      <span className="absolute right-2 text-sm">🌙</span>

      {/* Knob (anchor it with left-1 so translate works correctly) */}
      <span
        className={[
          "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md",
          "transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-8" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
