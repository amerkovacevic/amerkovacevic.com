import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";
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

  const knobSpring: Transition = { type: "spring", stiffness: 420, damping: 32 };

  return (
    <motion.button
      onClick={toggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative inline-flex h-12 w-24 shrink-0 items-center justify-start overflow-hidden rounded-full border border-border-light/70 bg-gradient-to-r from-white/80 via-sky-50/80 to-amber-50/80 p-1 text-slate-600 transition-all duration-300",
        "dark:border-border-dark/80 dark:bg-gradient-to-r dark:from-slate-950/70 dark:via-indigo-950/70 dark:to-slate-900/70 dark:text-slate-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand",
        isDark ? "justify-end" : "justify-start",
        className
      )}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="sr-only">{isDark ? "Switch to light theme" : "Switch to dark theme"}</span>
      <motion.span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-px rounded-full bg-gradient-to-r shadow-inner transition-all duration-500",
          isDark
            ? "from-slate-900/90 via-indigo-950/80 to-slate-900/90"
            : "from-amber-200/60 via-white/80 to-sky-200/70"
        )}
        transition={{ duration: 0.45 }}
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
      <motion.span
        layout
        transition={knobSpring}
        aria-hidden
        className={cn(
          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_12px_30px_-16px_rgba(14,165,233,0.65)] transition-all duration-300",
          isDark
            ? "from-slate-800 via-indigo-950 to-slate-900 text-sky-100"
            : "from-white via-amber-100 to-sky-100 text-amber-500"
        )}
      >
        {isDark ? (
          <Moon aria-hidden className="h-5 w-5" />
        ) : (
          <Sun aria-hidden className="h-5 w-5" />
        )}
      </motion.span>
    </motion.button>
  );
}
