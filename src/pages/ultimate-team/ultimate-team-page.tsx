import { PageHero, PageSection } from "../../shared/components/page";

import { ClubImporter } from "./components/club-importer";

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
        description="Paste JSON data exported from your scraper and instantly inspect every player with translations applied."
        contentClassName="space-y-6"
      >
        <ClubImporter />
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
