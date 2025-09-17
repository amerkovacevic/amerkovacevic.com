import { useEffect, useState } from "react";

import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-16 animate-pulse rounded-brand-full bg-border-light" aria-hidden />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-8 w-16 items-center rounded-brand-full transition-colors",
        isDark ? "bg-brand-subtle" : "bg-brand-strong",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      )}
    >
      <span className="absolute left-2 text-xs">☀️</span>
      <span className="absolute right-2 text-xs">🌙</span>
      <span
        className={cn(
          "absolute left-1 top-1 h-6 w-6 rounded-brand-full bg-white shadow-brand-sm transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-8" : "translate-x-0"
        )}
      />
    </button>
  );
}
