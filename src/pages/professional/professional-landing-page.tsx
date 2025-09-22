import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHero, PageSection } from "../../shared/components/page";
import { PROFESSIONAL_LINKS, type SiteLink } from "../../shared/data/site-map";

export default function ProfessionalLandingPage() {
  return (
    <div className="space-y-10">
      <PageHero
        icon="💼"
        title="Explore the professional studio"
        description="A dedicated space to share my professional work and connect on new ideas. Browse through portfolio projects that highlight my approach to design and development, find the easiest ways to get in touch, or start a tailored project where we can collaborate from concept to launch."
      />

      <PageSection contentClassName="grid gap-4">
        {PROFESSIONAL_LINKS.map((link) => (
          <ProfessionalCard key={link.id} link={link} />
        ))}
      </PageSection>
    </div>
  );
}

function ProfessionalCard({ link }: { link: SiteLink }) {
  return (
    <Link
      to={link.to}
      className="group relative flex items-start gap-5 overflow-hidden rounded-[2rem] border border-border-light/70 bg-white/85 p-6 text-left text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-overlayDark/80 dark:text-brand-foreground"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-gradient-to-br from-white via-white/60 to-white/20 text-3xl shadow-brand-sm ring-1 ring-border-light transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 dark:ring-border-dark">
        <span aria-hidden>{link.emoji}</span>
        <span className="sr-only">{link.name} icon</span>
      </span>
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold tracking-tight sm:text-lg">{link.name}</h3>
          <ArrowUpRight className="h-4 w-4 text-brand/80 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </div>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{link.blurb}</p>
      </div>
    </Link>
  );
}
