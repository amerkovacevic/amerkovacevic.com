import { ReactNode } from "react";

import { cn } from "../lib/classnames";
import { Card } from "./ui/card";

export function PageHero({
  icon,
  eyebrow,
  title,
  description,
  actions,
  stats,
  className,
}: {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border-light bg-gradient-to-br from-brand/95 via-brand to-brand-accent/80 text-white shadow-brand",
        "px-6 py-7 sm:px-8 sm:py-9",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
      >
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-12 h-56 w-56 rounded-full bg-brand-accent/40 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/8 blur-3xl" />
      </div>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-brand-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              {eyebrow}
            </span>
          ) : null}
          <div className="flex flex-col gap-3 text-balance">
            <div className="flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
              {icon ? <span className="text-4xl sm:text-5xl" aria-hidden>{icon}</span> : null}
              <span>{title}</span>
            </div>
            {description ? (
              <p className="max-w-2xl text-sm text-white/80 sm:text-base">{description}</p>
            ) : null}
          </div>
          {stats ? (
            <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
              {stats}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-col items-start gap-2 text-sm md:items-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

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
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand-accent/5 opacity-0 transition-opacity duration-200 hover:opacity-100" aria-hidden />
        <div className="relative flex flex-col gap-5">
          {(title || description || actions) && (
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 text-balance">
                {title ? (
                  <h2 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{title}</h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-brand-muted dark:text-brand-subtle">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
            </header>
          )}
          <div className={cn("flex-1", contentClassName)}>{children}</div>
        </div>
      </Card>
    </section>
  );
}

export function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-brand-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
      {children}
    </span>
  );
}
