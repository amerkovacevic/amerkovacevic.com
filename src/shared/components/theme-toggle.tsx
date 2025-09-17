import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../app/providers";
import { cn } from "../lib/classnames";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-28 animate-pulse rounded-full bg-border-light/60" aria-hidden />;
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
        "group relative inline-flex h-10 w-28 items-center justify-between overflow-hidden rounded-full border border-border-light/70 bg-surface/95 px-2 transition-all duration-300",
        "dark:border-border-dark dark:bg-surface-overlayDark/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(circle at 80% 50%, rgba(14,165,233,0.28), transparent 55%)",
        }}
      />
      <span
        className={cn(
          "absolute top-1 flex h-8 items-center justify-center rounded-full bg-white text-brand shadow-brand-sm transition-[transform,background-color,color] duration-300 dark:bg-slate-900 dark:text-white",
          isDark ? "translate-x-[calc(100%+0.5rem)]" : "translate-x-0"
        )}
        style={{ width: "calc(50% - 0.35rem)" }}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span className="relative z-10 flex w-full items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.32em]">
        <span className={cn("flex items-center gap-1 transition-opacity", isDark ? "opacity-45" : "opacity-90")}> 
          <Sun className="h-3.5 w-3.5" />
          <span>Light</span>
        </span>
        <span className={cn("flex items-center gap-1 transition-opacity", isDark ? "opacity-90" : "opacity-45")}> 
          <span>Dark</span>
          <Moon className="h-3.5 w-3.5" />
        </span>
      </span>
    </button>
  );
}
