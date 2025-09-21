import { CLUB_DATA, SAMPLE_CLUB_DATA, getActiveClubData } from "../../data/ultimate-team";
import type { UltimateTeamClubPileItem } from "../../data/ultimate-team";
import { PageHero, PageSection } from "../../shared/components/page";

function formatRecord(record?: { wins?: number; draws?: number; losses?: number }) {
  if (!record) return "-";
  const { wins = 0, draws = 0, losses = 0 } = record;
  return `${wins}W-${draws}D-${losses}L`;
}

function isPlayerItem(item: UltimateTeamClubPileItem): item is Extract<UltimateTeamClubPileItem, { itemType: "player" }> {
  return item.itemType === "player";
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function UltimateTeamPage() {
  const activeData = getActiveClubData();
  const usesSample = !CLUB_DATA;
  const players = (activeData.pile.items ?? []).filter(isPlayerItem);

  return (
    <div className="space-y-10">
      <PageHero
        align="center"
        title="Ultimate Team Utility"
        description="Import your club directly from the EA FC Web App and explore every item in one place."
      />

      {usesSample ? (
        <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-border-light/60 bg-surface/50 px-6 py-4 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/50 dark:bg-surface-overlayDark/40">
          <p className="font-medium text-brand-strong dark:text-brand-foreground">No personal club data detected.</p>
          <p className="mt-1">
            Run <code className="rounded bg-surface-overlay px-1 py-0.5 text-xs">npm run scrape:ultimate-team</code> after providing
            your session headers to generate <code>src/data/ultimate-team/club.json</code>. Until then a sample dataset is displayed
            below.
          </p>
        </div>
      ) : null}

      <PageSection title="Club overview">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Club name" value={activeData.club.name ?? "Unknown"} />
          <InfoCard label="Persona ID" value={activeData.persona} />
          <InfoCard label="Record" value={formatRecord(activeData.club.record)} />
          <InfoCard label="Established" value={activeData.club.established ? `${activeData.club.established}` : "-"} />
          <InfoCard label="Last access" value={formatDate(activeData.club.lastAccess)} className="lg:col-span-2" />
          <InfoCard label="Locale" value={activeData.locale?.info?.label ?? activeData.localeCode ?? "-"} />
          <InfoCard label="Dataset source" value={usesSample ? "Sample data" : "Scraped club"} />
        </dl>
      </PageSection>

      <PageSection title="Active squad">
        {activeData.squads?.items?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light/70 text-left text-sm dark:divide-border-dark/60">
              <thead className="bg-surface/70 dark:bg-surface-overlayDark/70">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Rating</th>
                  <th className="px-3 py-2 font-semibold">Chemistry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/60 dark:divide-border-dark/50">
                {activeData.squads.items.map((squad) => (
                  <tr key={squad.id} className="bg-surface/60 dark:bg-surface-overlayDark/60">
                    <td className="px-3 py-2 font-medium">{squad.name}</td>
                    <td className="px-3 py-2 capitalize">{squad.type}</td>
                    <td className="px-3 py-2">{squad.rating ?? "-"}</td>
                    <td className="px-3 py-2">{squad.chemistry ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-brand-muted">No squad information available.</p>
        )}
      </PageSection>

      <PageSection title={`Club inventory (${players.length} players)`}>
        {players.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light/70 text-left text-sm dark:divide-border-dark/60">
              <thead className="bg-surface/70 dark:bg-surface-overlayDark/70">
                <tr>
                  <th className="px-3 py-2 font-semibold">Player</th>
                  <th className="px-3 py-2 font-semibold">Rating</th>
                  <th className="px-3 py-2 font-semibold">Position</th>
                  <th className="px-3 py-2 font-semibold">Club</th>
                  <th className="px-3 py-2 font-semibold">League</th>
                  <th className="px-3 py-2 font-semibold">Nation</th>
                  <th className="px-3 py-2 font-semibold">Trade state</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/60 dark:divide-border-dark/50">
                {players.map((player) => (
                  <tr key={player.id} className="bg-surface/60 dark:bg-surface-overlayDark/60">
                    <td className="px-3 py-2">
                      <div className="font-medium text-brand-strong dark:text-brand-foreground">
                        {player.commonName ?? `${player.firstName} ${player.lastName}`}
                      </div>
                      <div className="text-xs text-brand-muted dark:text-white/60">#{player.definitionId}</div>
                    </td>
                    <td className="px-3 py-2">{player.rating}</td>
                    <td className="px-3 py-2">{player.position}</td>
                    <td className="px-3 py-2">{player.club}</td>
                    <td className="px-3 py-2">{player.league}</td>
                    <td className="px-3 py-2">{player.nation}</td>
                    <td className="px-3 py-2 capitalize">{player.tradeState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-brand-muted">No player items found in the club pile.</p>
        )}
      </PageSection>

      {!usesSample && SAMPLE_CLUB_DATA ? (
        <PageSection title="Preview sample dataset">
          <p className="text-sm text-brand-muted">
            Need a reference structure? Compare with the bundled sample data from <code>src/data/ultimate-team/sample-club.json</code>.
          </p>
        </PageSection>
      ) : null}
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  className?: string;
}

function InfoCard({ label, value, className }: InfoCardProps) {
  return (
    <div className={`rounded-lg border border-border-light/60 bg-surface/70 p-4 shadow-brand-sm dark:border-border-dark/50 dark:bg-surface-overlayDark/60 ${className ?? ""}`}>
      <dt className="text-xs uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-brand-strong dark:text-brand-foreground">{value}</dd>
    </div>
  );
}
