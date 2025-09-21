import { PageHero, PageSection } from "../../shared/components/page";

const FEATURES = [
  "Bulk import club",
  "SBC solver",
  "Squad builder",
  "Evolutions calculator",
] as const;

export default function UltimateTeamPage() {
  return (
    <div className="space-y-8">
      <PageHero align="center" title="Ultimate Team Utility" description="Coming Soon" />

      <PageSection title="Coming Soon">
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
