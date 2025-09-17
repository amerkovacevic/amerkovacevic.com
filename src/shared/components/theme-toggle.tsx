import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-[9.5rem] animate-pulse rounded-brand-full bg-border-light/60" aria-hidden />;
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
        "group relative inline-flex h-10 min-w-[9.5rem] items-center justify-between overflow-hidden rounded-brand-full border border-border-light/70 px-4 text-sm font-semibold transition-all duration-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        isDark
          ? "bg-brand-strong/90 text-white shadow-brand"
          : "bg-surface/95 text-brand-strong shadow-brand-sm",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(circle at 80% 50%, rgba(14,165,233,0.28), transparent 55%)",
        }}
      />
      <span className="relative flex items-center gap-3">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-brand-full bg-white/90 text-brand shadow-brand-sm transition-colors duration-300",
            isDark && "bg-slate-900/80 text-white"
          )}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </span>
        <span className="relative hidden sm:inline-flex flex-col leading-none">
          <span>{isDark ? "Dark" : "Light"}</span>
          <span className="text-[11px] font-normal uppercase tracking-[0.32em] text-brand-muted/80 dark:text-white/60">
            Mode
          </span>
        </span>
      </span>
      <span className="relative text-[11px] font-medium uppercase tracking-[0.32em] text-brand-muted/80 dark:text-white/60">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
