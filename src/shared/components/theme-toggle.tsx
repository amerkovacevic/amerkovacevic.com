import { useEffect, useState } from "react";

import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-16 animate-pulse rounded-brand-full bg-border-light",
          className
        )}
        aria-hidden
      />
    );
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
        "relative inline-flex h-12 w-24 items-center rounded-full border border-transparent px-1 transition-all duration-500",
        isDark
          ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-100"
          : "bg-gradient-to-r from-sky-100 via-white to-sky-100 text-slate-700",
        "shadow-[0_12px_30px_rgba(15,23,42,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none flex h-10 w-10 items-center justify-center text-lg transition-opacity duration-500",
          isDark ? "opacity-40" : "opacity-100"
        )}
        aria-hidden
      >
        ☀️
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white shadow-[0_10px_25px_rgba(14,116,144,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:bg-slate-900",
          isDark ? "translate-x-12" : "translate-x-0"
        )}
      >
        <span
          className="pointer-events-none h-6 w-6 rounded-full bg-gradient-to-br from-sky-200/60 to-white shadow-inner dark:from-slate-700/60 dark:to-slate-900/80"
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "pointer-events-none ml-auto flex h-10 w-10 items-center justify-center text-lg transition-opacity duration-500",
          isDark ? "opacity-100" : "opacity-40"
        )}
        aria-hidden
      >
        🌙
      </span>
    </button>
  );
}
