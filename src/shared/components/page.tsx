import { ReactNode } from "react";

import { cn } from "../lib/classnames";
import { Card } from "./ui/card";

// Layout primitives reused across marketing-style pages.
export function PageHero({
  icon,
  title,
  description,
  actions,
  stats,
  className,
  align = "start",
}: {
  icon?: ReactNode;
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
        "relative overflow-hidden rounded-[2rem] border border-border-light/70 bg-surface/80 px-6 py-8 text-brand-strong shadow-brand-sm transition-all duration-300 dark:border-border-dark/60 dark:bg-surface-overlayDark/80 sm:px-8 sm:py-10",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-90" style={{
          background:
            "radial-gradient(circle at 12% 20%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(circle at 80% 25%, rgba(59,130,246,0.18), transparent 65%), linear-gradient(135deg, rgba(15,23,42,0.08), rgba(15,23,42,0))",
        }} />
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-accent/20 blur-[120px]" />
        <div className="absolute -bottom-20 left-12 h-48 w-48 rounded-full bg-white/25 blur-[140px] dark:bg-brand/20" />
      </div>
      <div
        className={cn(
          "relative flex flex-col gap-8",
          isCentered
            ? "items-center gap-6 text-center md:flex-col"
            : "md:flex-row md:items-end md:justify-between"
        )}
      >
        <div className={cn("space-y-5 text-balance", isCentered && "text-center")}>
          <div
            className={cn(
              "flex items-center gap-4 text-3xl font-semibold sm:text-4xl",
              isCentered && "flex-col items-center gap-3"
            )}
          >
            {icon ? (
              <span className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-white/80 text-4xl shadow-brand-sm dark:bg-surface/30" aria-hidden>
                {icon}
              </span>
            ) : null}
            <span className="leading-tight text-brand-strong dark:text-white">{title}</span>
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
                "flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-brand-muted/90 dark:text-white/60",
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
              "flex shrink-0 flex-col items-start gap-3 text-sm md:items-end",
              isCentered && "items-center md:items-center"
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
    <span className="inline-flex items-center gap-2 rounded-brand-full border border-brand/20 bg-brand/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-strong/80 shadow-brand-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-white/80">
      {children}
    </span>
  );
}
