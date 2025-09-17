import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-20 animate-pulse rounded-full bg-border-light/60" aria-hidden />;
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
        "relative inline-flex h-10 w-20 shrink-0 items-center rounded-full border border-border-light/70 bg-surface px-1.5 transition-all duration-300",
        "dark:border-border-dark dark:bg-surface-overlayDark/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(circle at 25% 25%, rgba(250,204,21,0.4), transparent 60%), radial-gradient(circle at 75% 60%, rgba(56,189,248,0.35), transparent 55%)",
        }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-1 text-xs text-brand-muted dark:text-brand-subtle">
        <Sun className={cn("h-4 w-4 transition-opacity", isDark ? "opacity-40" : "opacity-90")} aria-hidden />
        <Moon className={cn("h-4 w-4 transition-opacity", isDark ? "opacity-90" : "opacity-40")} aria-hidden />
      </span>
      <span
        className={cn(
          "absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand shadow-brand-sm transition-transform duration-300 dark:bg-slate-900 dark:text-white",
          isDark ? "translate-x-[2.5rem]" : "translate-x-0"
        )}
      >
        {isDark ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
        <span className="sr-only">{isDark ? "Dark" : "Light"}</span>
      </span>
    </button>
  );
}
