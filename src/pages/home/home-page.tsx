import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHero, PageSection } from "../../shared/components/page";
import {
  PROFESSIONAL_LINKS,
  APP_LINKS,
  type SiteLink,
} from "../../shared/data/site-map";

const GROUPS: {
  id: "apps" | "professional";
  title: string;
  description: string;
  cta: string;
  to: string;
  items: SiteLink[];
}[] = [
  {
    id: "professional",
    title: "Professional work & ways to collaborate",
    description:
      "Dive into portfolio highlights, grab contact links, or start a scoped engagement when you are ready to build together.",
    cta: "Visit professional hub",
    to: "/professional",
    items: PROFESSIONAL_LINKS,
  },
  {
    id: "apps",
    title: "Apps & automations for everyday moments",
    description:
      "Play organizers, friend groups, and communities use these utilities to stay coordinated without spinning up custom builds.",
    cta: "Explore apps",
    to: "/tools",
    items: APP_LINKS,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <PageHero
        align="center"
        title="Welcome to my digital workspace"
        // description="Choose a path below so dedicated apps live alongside the professional studio and you can get to the right experience fast."
        actions={
          <div className="flex flex-wrap justify-center gap-3">
            {GROUPS.map((group) => (
              <Link
                key={group.id}
                to={group.to}
                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-strong shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground"
              >
                {group.cta}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <PageSection
            key={group.id}
            title={group.title}
            description={group.description}
            actions={
              <Link
                to={group.to}
                className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-brand/40 dark:bg-brand/20 dark:text-brand-foreground"
              >
                {group.cta}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            }
            contentClassName="grid gap-4"
          >
            {group.items.map((item) => (
              <CategoryCard key={item.id} item={item} />
            ))}
          </PageSection>
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ item }: { item: SiteLink }) {
  return (
    <Link
      to={item.to}
      className="group relative flex items-start gap-5 overflow-hidden rounded-[1.9rem] border border-border-light/70 bg-white/80 p-5 text-left text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-overlayDark/80 dark:text-brand-foreground"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-gradient-to-br from-white via-white/60 to-white/20 text-3xl shadow-brand-sm ring-1 ring-border-light transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 dark:ring-border-dark">
        <span aria-hidden>{item.emoji}</span>
        <span className="sr-only">{item.name} icon</span>
      </span>
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold tracking-tight sm:text-lg">{item.name}</h3>
          <ArrowUpRight className="h-4 w-4 text-brand/80 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </div>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{item.blurb}</p>
      </div>
    </Link>
  );
}
