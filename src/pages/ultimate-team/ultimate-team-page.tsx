import { Sparkles, Workflow } from "lucide-react";

import { PageHero, PageSection } from "../../shared/components/page";
import { Button } from "../../shared/components/ui/button";

const PIPELINE_STEPS = [
  {
    title: "Automated cleaning",
    description: "Scraped club data is normalized, deduped, and tagged for chemistry links as soon as you drop a file.",
  },
  {
    title: "Instant availability",
    description: "The processed club sheet unlocks the rest of the tools without needing manual copy and paste gymnastics.",
  },
];

const FEATURES = [
  {
    name: "SBC solver",
    status: "In QA",
    description: "Build optimal squads with price-aware recommendations that adapt to market swings.",
  },
  {
    name: "Squad builder",
    status: "Designing",
    description: "Drag-and-drop chemistry grid with live attribute totals and shareable templates.",
  },
  {
    name: "Evolutions planner",
    status: "Scoping",
    description: "See which cards unlock the best upgrades before you spend a single token.",
  },
];

export default function UltimateTeamPage() {
  return (
    <div className="space-y-8">
      <PageHero
        align="center"
        title="Ultimate Team Utility"
        description="Tools to simplify Ultimate Team management and squad building."
      />

      <PageSection
        title="Club import"
        description="Automated processing is nearly ready, so drop your export and we'll prep it for the full toolkit."
        contentClassName="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      >
        <div className="space-y-6">
          <div className="space-y-3 rounded-[2rem] border border-white/30 bg-white/70 p-6 text-sm text-brand-muted shadow-brand-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-brand-subtle">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand dark:border-brand/40 dark:bg-brand/20 dark:text-brand-foreground">
              <Workflow className="h-4 w-4" aria-hidden />
              Automation pipeline
            </div>
            <p className="text-brand-strong dark:text-brand-foreground">
              The importer now runs as a background job: as soon as JSON lands, it cleans player clubs, aligns chem links, and queues data for the rest of the utilities.
            </p>
            <p>
              You no longer need to paste into separate fields. Just drop the latest scrape and let the worker do the heavy lifting.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {PIPELINE_STEPS.map((step) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-[1.75rem] border border-white/20 bg-white/60 p-5 text-sm text-brand-muted shadow-brand-sm dark:border-white/10 dark:bg-white/5 dark:text-brand-subtle"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-brand/80 dark:text-brand-foreground/80">
                  {step.title}
                </span>
                <p>{step.description}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled className="cursor-not-allowed">
              Import automation running
            </Button>
            <span className="text-xs text-brand-muted dark:text-brand-subtle">
              Status updates land here once the pipeline is ready for public access.
            </span>
          </div>
        </div>

        <aside className="flex h-full flex-col gap-4 rounded-[2rem] border border-white/30 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/20 p-6 text-brand-strong shadow-brand-sm dark:border-white/10 dark:from-brand/20 dark:text-brand-foreground">
          <h3 className="text-lg font-semibold">How to share data</h3>
          <ol className="space-y-3 text-sm text-brand-muted dark:text-brand-subtle">
            <li>
              Export your club collection as JSON from your preferred scraper.
            </li>
            <li>
              Upload it to the shared Dropbox or drop it into the automation inbox.
            </li>
            <li>
              Watch for the confirmation email with links to the processed squads.
            </li>
          </ol>
          <div className="mt-auto inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand shadow-brand-sm dark:border-white/20 dark:bg-white/10 dark:text-brand-foreground">
            <Sparkles className="h-4 w-4" aria-hidden />
            Private beta
          </div>
        </aside>
      </PageSection>

      <PageSection title="Coming soon" description="These helpers round out the toolkit next.">
        <div className="grid gap-5 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.name}
              className="flex flex-col gap-3 rounded-[2rem] border border-white/30 bg-white/70 p-6 text-left text-brand-muted shadow-brand-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-brand dark:border-white/10 dark:bg-white/10 dark:text-brand-subtle"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand dark:border-brand/40 dark:bg-brand/20 dark:text-brand-foreground">
                {feature.status}
              </span>
              <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{feature.name}</h3>
              <p className="text-sm leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
