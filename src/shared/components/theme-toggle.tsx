import { useEffect, useState } from "react";
import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-12 w-24 animate-pulse rounded-full bg-border-light/60" aria-hidden />;
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
        "group inline-flex h-12 w-24 shrink-0 items-center justify-start rounded-full border border-border-light/70 bg-surface/90 p-1 transition-all duration-300",
        "dark:border-border-dark/80 dark:bg-surface-overlayDark/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand",
        isDark ? "justify-end" : "justify-start",
        className
      )}
    >
      <span className="sr-only">{isDark ? "Switch to light theme" : "Switch to dark theme"}</span>
      <span
        aria-hidden
        className={cn(
          "h-10 w-10 rounded-full bg-white shadow-brand-sm transition-colors duration-300",
          "dark:bg-slate-900"
        )}
      />
    </button>
  );
}
