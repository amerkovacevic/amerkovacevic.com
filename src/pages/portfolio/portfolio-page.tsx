import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHero } from "../../shared/components/page";

type SiteCaseStudy = {
  id: string;
  title: string;
  url: string;
  industry: string;
  headline: string;
  description: string;
  gradient: string;
  stats: { label: string; value: string }[];
  highlights: string[];
  features: string[];
};

const SITES: SiteCaseStudy[] = [
  {
    id: "alens-general-construction",
    title: "Alen's General Construction",
    url: "https://alensgeneralconstruction.com",
    industry: "General Contractor",
    headline: "Neighborhood contractor site pairing craftsmanship visuals with clear service breakdowns.",
    description:
      "A responsive marketing site that gives homeowners confidence—service pages outline capabilities, past renovation shots build trust, and every section ends with an easy way to book a walkthrough.",
    gradient: "from-amber-300/35 via-orange-400/20 to-sky-400/30",
    stats: [
      { label: "Role", value: "Design · Development · Local SEO" },
      { label: "Stack", value: "React · Tailwind · Firebase" },
    ],
    highlights: [
      "Showcases signature renovations",
      "Service inquiry capture on every page",
      "Search-optimized for local leads",
    ],
    features: [
      "Trade-inspired hero with direct calls to request an estimate in one tap.",
      "Modular service cards so the team can grow offerings without touching code.",
      "Gallery and testimonials arranged in a masonry grid to spotlight workmanship.",
    ],
  },
  {
    id: "amerkovacevic",
    title: "amerkovacevic.com",
    url: "https://amerkovacevic.com",
    industry: "Personal Portfolio",
    headline: "Interactive hub for product experiments, tools, and ways to connect.",
    description:
      "The site you're exploring: a living portfolio that surfaces side projects, playground apps, and social touchpoints in a cohesive brand system with dark mode support.",
    gradient: "from-sky-400/30 via-indigo-500/20 to-purple-500/30",
    stats: [
      { label: "Role", value: "Brand · Design · Engineering" },
      { label: "Stack", value: "React · TypeScript · Firebase" },
    ],
    highlights: [
      "Launchpad of community tools",
      "Adaptive dark & light themes",
      "Curated contact directory",
    ],
    features: [
      "Tile-based homepage guiding visitors into each app with playful motion.",
      "Reusable page hero system so every product story opens with the same premium box design.",
      "Contact hub aggregating social profiles, project inquiries, and quick links.",
    ],
  },
];

const PRINCIPLES = [
  {
    title: "Show, don't tell",
    description:
      "Every project leans on motion, interaction, and storytelling to convey value without long paragraphs.",
  },
  {
    title: "Performance obsessed",
    description:
      "Core vitals ship above 90 by default thanks to code-splitting, image optimization, and smart caching.",
  },
  {
    title: "Editor friendly",
    description:
      "Structured content and reusable modules empower teams to launch new pages without touching code.",
  },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-16">
      <PageHero
        eyebrow={
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            Featured Work
          </>
        }
        title="Portfolio of immersive websites blending storytelling and conversions"
        description="From local businesses to personal platforms, these builds balance premium visuals with the performance and structure needed to keep shipping new stories."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/start-a-project"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
            >
              Start a project
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="/links"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-strong shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-brand dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground"
            >
              View more links
            </a>
          </div>
        }
      />

      <section className="space-y-8">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong shadow-brand-sm dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground">
            <Sparkles className="h-4 w-4" aria-hidden />
            Signature builds
          </span>
          <h2 className="text-3xl sm:text-4xl">Digital experiences engineered to feel handcrafted</h2>
          <p className="max-w-2xl text-sm sm:text-base text-brand-muted dark:text-brand-subtle">
            A peek at recent launches spanning agencies, wellness brands, and architecture studios. Each one pairs brand narrative with high-converting flows and accessible interactions.
          </p>
        </header>

        <div className="grid gap-8">
          {SITES.map((site) => (
            <CaseStudyCard key={site.id} site={site} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-[2.5rem] border border-border-light/70 bg-surface/80 p-8 shadow-brand-sm backdrop-blur-xl dark:border-border-dark/70 dark:bg-surface-overlayDark/80 md:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <div key={principle.title} className="surface-card relative flex flex-col gap-3 rounded-[1.75rem] border border-white/20 bg-white/70 p-6 text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-brand dark:border-white/10 dark:bg-white/5 dark:text-brand-foreground">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand dark:text-brand-foreground/80">
              {principle.title}
            </span>
            <p className="text-sm leading-relaxed text-brand-muted dark:text-brand-subtle">
              {principle.description}
            </p>
          </div>
        ))}
      </section>

      <CallToAction />
    </div>
  );
}

function CaseStudyCard({ site }: { site: SiteCaseStudy }) {
  return (
    <article className="group relative overflow-hidden rounded-[2.5rem] border border-border-light/70 bg-white/80 p-8 text-brand-strong shadow-brand-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/50 hover:shadow-brand dark:border-border-dark/70 dark:bg-surface-overlayDark/85 dark:text-brand-foreground">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${site.gradient} opacity-70 transition-opacity duration-500 group-hover:opacity-100`} aria-hidden />

      <div className="relative flex flex-col gap-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-brand-strong shadow-brand-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground">
              {site.industry}
            </span>
            <h3 className="text-2xl font-semibold sm:text-3xl">{site.title}</h3>
            <p className="max-w-2xl text-sm text-brand-muted dark:text-brand-subtle">{site.headline}</p>
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-brand/40 bg-white/70 px-4 py-2 text-sm font-semibold text-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/10 dark:border-brand/40 dark:bg-slate-900/70 dark:text-brand-foreground"
          >
            Visit site
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-brand-muted dark:text-brand-subtle">{site.description}</p>
            <ul className="grid gap-3">
              {site.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-brand-muted dark:text-brand-subtle">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-brand shadow-brand-sm dark:bg-white/10">
                    <Sparkles className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="surface-card relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 p-6 shadow-brand-sm backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-brand dark:border-white/10 dark:bg-white/5">
            <div className="relative space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand/80 dark:text-brand-foreground/80">
                Highlights
              </h4>
              <ul className="space-y-2 text-sm text-brand-strong dark:text-brand-foreground">
                {site.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/70 px-4 py-2 shadow-brand-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      ✦
                    </span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="grid gap-3 text-sm text-brand-muted dark:text-brand-subtle">
              {site.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col rounded-2xl border border-white/30 bg-white/60 px-4 py-3 shadow-brand-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                  <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-brand/70 dark:text-brand-foreground/70">
                    {stat.label}
                  </dt>
                  <dd className="text-brand-strong dark:text-brand-foreground">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </article>
  );
}

function CallToAction() {
  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border border-brand/30 bg-gradient-to-br from-brand/20 via-brand-accent/10 to-transparent p-10 text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-brand/40 dark:text-brand-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-brand/40 blur-[160px]" />
      </div>

      <div className="relative flex flex-col gap-6 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Let's launch something unforgettable.</h2>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-brand-muted dark:text-brand-subtle">
          Whether you need a conversion-focused marketing site or a full product experience, I help teams craft web experiences that feel premium, move fast, and stay easy to evolve.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/start-a-project"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
          >
            Start a project
          </Link>
          <a
            href="/links"
            className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-strong shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-brand dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground"
          >
            View more links
          </a>
        </div>
      </div>
    </section>
  );
}
