import { Moon, Sun } from "lucide-react";
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
        "group relative inline-flex h-12 w-24 shrink-0 items-center justify-start overflow-hidden rounded-full border border-border-light/70 bg-surface/90 p-1 transition-all duration-300",
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
        className="pointer-events-none absolute inset-px rounded-full bg-gradient-to-r from-white/90 via-white to-slate-200/80 shadow-inner transition-colors duration-300 dark:from-slate-900/80 dark:via-slate-950 dark:to-slate-900"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-slate-500 dark:text-slate-400">
        <Sun
          aria-hidden
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isDark
              ? "opacity-30 dark:text-slate-400"
              : "opacity-100 text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
          )}
        />
        <Moon
          aria-hidden
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isDark
              ? "opacity-100 text-sky-200 drop-shadow-[0_0_6px_rgba(125,211,252,0.45)]"
              : "opacity-30 text-slate-400"
          )}
        />
      </span>
      <span
        aria-hidden
        className={cn(
          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shadow-brand-sm transition-all duration-300",
          "dark:bg-slate-800",
          isDark
            ? "text-sky-100"
            : "text-amber-500"
        )}
      >
        {isDark ? (
          <Moon aria-hidden className="h-5 w-5" />
        ) : (
          <Sun aria-hidden className="h-5 w-5" />
        )}
      </span>
    </button>
  );
}
