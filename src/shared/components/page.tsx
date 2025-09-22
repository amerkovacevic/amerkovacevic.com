import { ReactNode } from "react";

import { cn } from "../lib/classnames";
import { Card } from "./ui/card";

// Layout primitives reused across marketing-style pages.
export function PageHero({
  icon,
  eyebrow,
  title,
  description,
  actions,
  stats,
  className,
  align = "start",
}: {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  className?: string;
  align?: "start" | "center";
}) {
  const isCentered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2.75rem] border border-border-light/60 bg-gradient-to-br from-white/95 via-sky-50/80 to-brand/10 px-6 py-8 text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-brand/20 sm:px-10 sm:py-10",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-24 h-[22rem] w-[22rem] rounded-full bg-sky-200/40 blur-[140px]" />
        <div className="absolute -right-20 bottom-[-12rem] h-[24rem] w-[28rem] rounded-full bg-brand/30 blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_60%)] opacity-70 dark:bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.45),transparent_65%)]" />
      </div>
      <div
        className={cn(
          "relative flex flex-col gap-8 sm:gap-10",
          isCentered
            ? "items-center text-center"
            : "md:flex-row md:items-end md:justify-between"
        )}
      >
        <div
          className={cn(
            "space-y-6 text-balance",
            isCentered ? "items-center text-center" : ""
          )}
        >
          {eyebrow ? (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-brand-strong shadow-brand-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground",
                isCentered ? "mx-auto" : undefined
              )}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            className={cn(
              "flex items-center gap-4",
              isCentered && "flex-col gap-3 text-center"
            )}
          >
            {icon ? (
              <span
                className="grid h-16 w-16 place-items-center rounded-[1.6rem] bg-white/80 text-4xl shadow-brand-sm ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 dark:bg-white/10 dark:text-brand-foreground"
                aria-hidden
              >
                {icon}
              </span>
            ) : null}
            <h1 className="font-display text-4xl font-semibold leading-tight text-brand-strong dark:text-white sm:text-5xl">
              {title}
            </h1>
          </div>
          {description ? (
            <p
              className={cn(
                "max-w-2xl text-sm text-brand-muted dark:text-white/75 sm:text-base",
                isCentered && "mx-auto"
              )}
            >
              {description}
            </p>
          ) : null}
          {stats ? (
            <div
              className={cn(
                "flex flex-wrap gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-brand-muted/90 dark:text-white/70",
                isCentered && "justify-center"
              )}
            >
              {stats}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex shrink-0 flex-col items-start gap-4 text-sm md:items-end",
              isCentered && "items-center"
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Reusable card section wrapper with optional header and actions.
export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <Card
        padding="lg"
        className="relative overflow-hidden border border-border-light/70 bg-surface/80 shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-overlayDark/85"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
          aria-hidden
          style={{
            background:
              "linear-gradient(140deg, rgba(56,189,248,0.14), transparent 45%), radial-gradient(circle at 90% 20%, rgba(14,165,233,0.18), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-6">
          {(title || description || actions) && (
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 text-balance">
                {title ? (
                  <h2 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{title}</h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-brand-muted dark:text-white/70">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
            </header>
          )}
          <div className={cn("flex-1", contentClassName)}>{children}</div>
        </div>
      </Card>
    </section>
  );
}

// Capsule-shaped badge for highlighting quick stats.
export function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-brand-full border border-brand/20 bg-brand/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-strong/80 shadow-brand-sm backdrop-blur-sm dark:border-brand/40 dark:bg-brand/20 dark:text-white">
      {children}
    </span>
  );
}
