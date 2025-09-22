import { ArrowUpRight, Sparkles } from "lucide-react";

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
    id: "aurora",
    title: "Aurora Creative Studio",
    url: "https://aurora.studio",
    industry: "Creative Agency",
    headline: "Cinematic storytelling for a boutique motion design collective.",
    description:
      "Modular case studies, art-directed typography, and cinematic scroll cues invite visitors into each campaign's narrative while keeping performance silky smooth.",
    gradient: "from-sky-400/40 via-blue-500/20 to-indigo-500/35",
    stats: [
      { label: "Role", value: "Strategy · Design · Build" },
      { label: "Stack", value: "Next.js · Tailwind · Sanity" },
    ],
    highlights: [
      "+62% lead conversion",
      "Average session 3m+",
      "Interactive reel system",
    ],
    features: [
      "Scene-based hero with parallax storytelling and responsive art direction.",
      "Reusable case study slices with themable colorways editors can mix and match.",
      "Lightweight video showcase powered by edge caching and responsive sources.",
    ],
  },
  {
    id: "harbor",
    title: "Harbor Wellness",
    url: "https://harborwellness.co",
    industry: "Health & Wellness",
    headline: "Membership experience for a boutique studio launching digital classes.",
    description:
      "Built a serene brand world anchored by rich photography, interactive schedules, and a conversion-focused onboarding flow that doubled founding memberships.",
    gradient: "from-emerald-400/35 via-teal-400/20 to-emerald-500/30",
    stats: [
      { label: "Role", value: "Product Design · Development" },
      { label: "Stack", value: "Remix · Tailwind · Stripe" },
    ],
    highlights: ["2.1× launch revenue", "<1s first contentful paint", "CMS-powered schedule"],
    features: [
      "Adaptive membership wizard with pricing experiments and milestone nudges.",
      "Editorial wellness journal with ambient gradients and fluid typography.",
      "Integrated booking calendar syncing live capacity from the studio floor.",
    ],
  },
  {
    id: "atelier",
    title: "Atelier Nord",
    url: "https://ateliernord.design",
    industry: "Architecture",
    headline: "High-touch portfolio celebrating bespoke hospitality spaces.",
    description:
      "A gallery-driven experience with tactile textures, tactile hover states, and a pitch deck generator so the team can spin up proposals in minutes.",
    gradient: "from-amber-400/35 via-rose-400/20 to-fuchsia-500/30",
    stats: [
      { label: "Role", value: "UX · Visual Direction · Build" },
      { label: "Stack", value: "Next.js · Tailwind · Contentful" },
    ],
    highlights: [
      "Inbound inquiries up 3×",
      "95 Lighthouse performance",
      "Proposal decks in 6 clicks",
    ],
    features: [
      "Responsive masonry showcasing projects with ambient lighting simulations.",
      "Texture library layering paper grain, depth shadows, and subtle noise.",
      "Auto-generated pitch decks using project data and printable layouts.",
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
      <HeroSection />

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

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border border-border-light/60 bg-gradient-to-br from-white/95 via-sky-50/80 to-brand/20 p-10 text-brand-strong shadow-brand-sm dark:border-border-dark/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-brand/20">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-10 top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[20rem] w-[28rem] rounded-full bg-brand/30 blur-[140px]" />
      </div>

      <div className="relative flex flex-col gap-8">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong shadow-brand-sm dark:border-brand/30 dark:bg-slate-900/60 dark:text-brand-foreground">
          <Sparkles className="h-4 w-4" aria-hidden />
          Featured Work
        </span>
        <div className="flex flex-col gap-5">
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Portfolio of immersive websites that blend storytelling and conversion.
          </h1>
          <p className="max-w-2xl text-base text-brand-muted dark:text-brand-subtle">
            From launch-day microsites to full product ecosystems, these builds focus on the subtle interactions that make brands memorable while staying ruthlessly fast.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {["95+ Lighthouse scores", "Crafted editor tooling", "Inclusive motion design"].map((pill) => (
            <div
              key={pill}
              className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-4 text-sm font-medium text-brand-strong shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-brand dark:border-white/20 dark:bg-slate-900/80 dark:text-brand-foreground"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              <div className="relative flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" aria-hidden />
                <span>{pill}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
        <h2 className="text-3xl font-semibold sm:text-4xl">Let&apos;s launch something unforgettable.</h2>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-brand-muted dark:text-brand-subtle">
          Whether you need a conversion-focused marketing site or a full product experience, I help teams craft web experiences that feel premium, move fast, and stay easy to evolve.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:hey@amerkovacevic.com"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-brand-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-brand"
          >
            Start a project
          </a>
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
