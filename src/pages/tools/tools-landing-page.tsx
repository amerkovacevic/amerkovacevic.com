import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHero, PageSection } from "../../shared/components/page";
import { TOOL_LINKS, type SiteLink } from "../../shared/data/site-map";

export default function ToolsLandingPage() {
  return (
    <div className="space-y-10">
      <PageHero
        icon="🛠️"
        title="Choose a tool and get right to work"
        description="Utilities for pickup sports, holiday exchanges, bracket planning, and FIFA make it easy to spin up gatherings without spreadsheets."
        actions={
          <Link
            to="/tools/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
          >
            Post a pickup game
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      <PageSection contentClassName="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {TOOL_LINKS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </PageSection>
    </div>
  );
}

function ToolCard({ tool }: { tool: SiteLink }) {
  return (
    <Link
      to={tool.to}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-brand-lg border border-border-light bg-surface p-6 text-left text-brand-strong shadow-brand-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        <span className="relative grid h-14 w-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-white via-white/60 to-white/20 text-3xl shadow-brand-sm ring-1 ring-border-light transition-colors duration-300 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 dark:ring-border-dark">
          <span aria-hidden>{tool.emoji}</span>
          <span className="sr-only">{tool.name} icon</span>
        </span>
        <span className="mt-1 text-brand-muted transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-brand-subtle">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{tool.name}</h3>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{tool.blurb}</p>
      </div>
    </Link>
  );
}
