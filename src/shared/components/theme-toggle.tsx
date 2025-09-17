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
          "h-12 w-[8.5rem] animate-pulse rounded-full bg-border-light/70",
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
        "group relative inline-flex h-12 w-[8.5rem] items-center overflow-hidden rounded-full border border-border-light/70 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition-all duration-500",
        isDark
          ? "bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-brand-foreground shadow-[0_14px_34px_rgba(15,23,42,0.42)] dark:border-border-dark"
          : "bg-gradient-to-r from-white via-sky-50 to-sky-100 text-brand-strong shadow-[0_18px_40px_rgba(56,189,248,0.28)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80 blur-[38px] transition-opacity duration-500",
          isDark
            ? "bg-gradient-to-r from-brand-accent/10 via-brand/30 to-brand-accent/5"
            : "bg-gradient-to-r from-brand/20 via-brand-accent/30 to-white/50"
        )}
      />

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full border border-white/60 bg-white/90 shadow-[0_10px_26px_rgba(59,130,246,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_12px_28px_rgba(15,23,42,0.45)]",
          isDark ? "translate-x-full" : "translate-x-0"
        )}
      />

      <span
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1 transition-colors duration-500",
          isDark ? "text-white/45" : "text-brand-strong"
        )}
      >
        <span aria-hidden className="text-base">
          ☀️
        </span>
        Light
      </span>

      <span
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1 transition-colors duration-500",
          isDark ? "text-brand-foreground" : "text-slate-400"
        )}
      >
        <span aria-hidden className="text-base">
          🌙
        </span>
        Dark
      </span>
    </button>
  );
}
