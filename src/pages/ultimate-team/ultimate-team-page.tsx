import { PageHero, PageSection } from "../../shared/components/page";
import { Button } from "../../shared/components/ui/button";

const FEATURES = [
  "SBC solver",
  "Squad builder",
  "Evolutions calculator",
] as const;

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
        description="Paste JSON data exported from your scraper to prepare it for the rest of the tools."
        contentClassName="space-y-6"
      >
        <form className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="club-data-json"
              className="block text-sm font-medium text-brand-strong dark:text-brand-foreground"
            >
              Club data JSON
            </label>
            <textarea
              id="club-data-json"
              name="club-data-json"
              placeholder='{"clubs": [...]}'
              className="min-h-[180px] w-full rounded-brand border border-border-light bg-surface px-3 py-2 font-mono text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
            />
            <p className="text-xs text-brand-muted dark:text-brand-subtle">
              Paste the raw clubs dataset JSON exactly as exported from the data source.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="translation-json"
              className="block text-sm font-medium text-brand-strong dark:text-brand-foreground"
            >
              Translation JSON
            </label>
            <textarea
              id="translation-json"
              name="translation-json"
              placeholder='{"translations": {...}}'
              className="min-h-[180px] w-full rounded-brand border border-border-light bg-surface px-3 py-2 font-mono text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
            />
            <p className="text-xs text-brand-muted dark:text-brand-subtle">
              Include language overrides for club names, abbreviations, and nicknames.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled className="cursor-not-allowed">
              Import clubs
            </Button>
            <span className="text-xs text-brand-muted dark:text-brand-subtle">
              Processing automation is under construction—UI ready for data paste.
            </span>
          </div>
        </form>
      </PageSection>

      <PageSection title="Coming Soon" description="Additional Ultimate Team helpers are on the way.">
        <ul className="mx-auto max-w-xl space-y-3 text-center text-sm text-brand-muted dark:text-white/70">
          {FEATURES.map((feature) => (
            <li key={feature} className="rounded-full border border-border-light/70 bg-surface/80 px-6 py-3 text-base font-medium text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/70 dark:text-brand-foreground">
              {feature}
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
