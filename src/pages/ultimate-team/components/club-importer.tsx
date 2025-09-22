import { useMemo, useState } from "react";

import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";

const ATTRIBUTE_LABELS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"] as const;

interface ClubItem extends Record<string, unknown> {
  id?: number;
  assetId?: number;
  resourceId?: number;
  rating?: number;
  preferredPosition?: string;
  possiblePositions?: unknown;
  attributeArray?: unknown;
  contract?: number;
  untradeable?: boolean;
  teamid?: number;
  nation?: number;
  rareflag?: number;
  loyaltyBonus?: number;
  pile?: number;
  playStyle?: number;
}

interface TranslationEntry extends Record<string, unknown> {
  id?: number | string;
  c?: string;
  f?: string;
  l?: string;
  n?: string;
  name?: string;
}

interface ParsedPlayer {
  key: string;
  name: string;
  rating: number | null;
  preferredPosition: string | null;
  possiblePositions: string[];
  contract: number | null;
  untradeable: boolean;
  teamId: number | null;
  nationId: number | null;
  resourceId: number | null;
  assetId: number | null;
  loyaltyBonus: number | null;
  pile: number | null;
  playStyle: number | null;
  rarity: string | null;
  attributeBadges: Array<{ label: string; value: number }>;
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/,\s*$/, "");
}

function tryParseJson(value: string): unknown {
  if (!value) return null;
  const attempts = [value];

  const needsWrapping =
    (!value.startsWith("[") || !value.endsWith("]")) &&
    (value.startsWith("{") || /^[{\[]/.test(value) === false);

  if (needsWrapping) {
    attempts.push(`[${value}]`);
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      // Continue trying the next fallback format.
    }
  }

  throw new Error("Unable to parse the provided JSON. Ensure the data is valid.");
}

function parseClubItems(input: string): ClubItem[] {
  if (!input.trim()) return [];

  const sanitized = sanitizeInput(input);
  const parsed = tryParseJson(sanitized);

  if (Array.isArray(parsed)) {
    return parsed as ClubItem[];
  }

  if (parsed && typeof parsed === "object") {
    const candidate = parsed as Record<string, unknown>;
    if (Array.isArray(candidate.clubs)) {
      return candidate.clubs as ClubItem[];
    }
    if (Array.isArray(candidate.items)) {
      return candidate.items as ClubItem[];
    }
    return [candidate as ClubItem];
  }

  throw new Error("Club JSON must resolve to an array or object.");
}

function parseTranslations(input: string): Map<number, TranslationEntry> {
  const map = new Map<number, TranslationEntry>();
  if (!input.trim()) return map;

  const sanitized = sanitizeInput(input);
  const parsed = tryParseJson(sanitized);

  const consumeEntry = (entry: TranslationEntry) => {
    const numericId = normalizeId(entry.id);
    if (numericId == null) return;
    map.set(numericId, { ...entry, id: numericId });
  };

  if (Array.isArray(parsed)) {
    for (const entry of parsed as TranslationEntry[]) {
      consumeEntry(entry);
    }
    return map;
  }

  if (parsed && typeof parsed === "object") {
    const candidate = parsed as Record<string, unknown>;
    if (Array.isArray(candidate.translations)) {
      for (const entry of candidate.translations as TranslationEntry[]) {
        consumeEntry(entry);
      }
      return map;
    }

    for (const [key, value] of Object.entries(candidate)) {
      if (value && typeof value === "object") {
        consumeEntry({ id: key, ...(value as Record<string, unknown>) });
      }
    }
    return map;
  }

  throw new Error("Translation JSON must resolve to an array or object.");
}

function normalizeId(value: TranslationEntry["id"]): number | null {
  if (value == null) return null;
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function pickTranslation(
  item: ClubItem,
  translations: Map<number, TranslationEntry>
): TranslationEntry | undefined {
  const identifiers = [item.id, item.resourceId, item.assetId]
    .filter((id): id is number => typeof id === "number")
    .map((id) => Number(id));

  for (const id of identifiers) {
    if (translations.has(id)) {
      return translations.get(id);
    }
  }

  return undefined;
}

function deriveName(item: ClubItem, translation?: TranslationEntry): string {
  if (translation) {
    const composed = [translation.c, translation.name, translation.n]
      .find((value) => typeof value === "string" && value.trim().length > 0);
    if (composed) return composed;

    const first = typeof translation.f === "string" ? translation.f.trim() : "";
    const last = typeof translation.l === "string" ? translation.l.trim() : "";
    const parts = [first, last].filter(Boolean);
    if (parts.length) {
      return parts.join(" ");
    }
  }

  const possibleName = ["name", "fullName", "commonName"]
    .map((key) => item[key as keyof ClubItem])
    .find((value) => typeof value === "string" && value.trim().length > 0);
  if (typeof possibleName === "string") {
    return possibleName;
  }

  const fallbackId = item.resourceId ?? item.assetId ?? item.id;
  return fallbackId ? `Player ${fallbackId}` : "Unknown player";
}

function deriveRarity(value: ClubItem["rareflag"]): string | null {
  if (typeof value !== "number") return null;
  if (value <= 0) return "Common";
  if (value === 1) return "Rare";
  return `Special (${value})`;
}

function deriveAttributes(attributeArray: ClubItem["attributeArray"]): Array<{
  label: string;
  value: number;
}> {
  if (!Array.isArray(attributeArray)) return [];

  const attributes: Array<{ label: string; value: number }> = [];
  for (let index = 0; index < ATTRIBUTE_LABELS.length; index += 1) {
    const raw = attributeArray[index];
    if (typeof raw !== "number") continue;
    const label = ATTRIBUTE_LABELS[index] ?? `ATT ${index + 1}`;
    attributes.push({ label, value: raw });
  }
  return attributes;
}

function buildPlayer(
  item: ClubItem,
  translation: TranslationEntry | undefined,
  index: number
): ParsedPlayer {
  const possiblePositions = Array.isArray(item.possiblePositions)
    ? item.possiblePositions.filter((pos): pos is string => typeof pos === "string")
    : [];

  return {
    key: String(item.id ?? item.resourceId ?? item.assetId ?? index),
    name: deriveName(item, translation),
    rating: typeof item.rating === "number" ? item.rating : null,
    preferredPosition:
      typeof item.preferredPosition === "string" ? item.preferredPosition : null,
    possiblePositions,
    contract: typeof item.contract === "number" ? item.contract : null,
    untradeable: Boolean(item.untradeable),
    teamId: typeof item.teamid === "number" ? item.teamid : null,
    nationId: typeof item.nation === "number" ? item.nation : null,
    resourceId: typeof item.resourceId === "number" ? item.resourceId : null,
    assetId: typeof item.assetId === "number" ? item.assetId : null,
    loyaltyBonus: typeof item.loyaltyBonus === "number" ? item.loyaltyBonus : null,
    pile: typeof item.pile === "number" ? item.pile : null,
    playStyle: typeof item.playStyle === "number" ? item.playStyle : null,
    rarity: deriveRarity(item.rareflag),
    attributeBadges: deriveAttributes(item.attributeArray),
  };
}

function summarizePlayers(players: ParsedPlayer[]) {
  if (!players.length) {
    return {
      total: 0,
      averageRating: null as number | null,
      untradeableCount: 0,
      uniquePositions: new Set<string>(),
    };
  }

  const totalRating = players.reduce((sum, player) => {
    return sum + (player.rating ?? 0);
  }, 0);

  const untradeableCount = players.filter((player) => player.untradeable).length;
  const uniquePositions = new Set<string>();

  for (const player of players) {
    if (player.preferredPosition) {
      uniquePositions.add(player.preferredPosition);
    }
    for (const position of player.possiblePositions) {
      uniquePositions.add(position);
    }
  }

  const averageRating = players.length
    ? Math.round((totalRating / players.length) * 10) / 10
    : null;

  return {
    total: players.length,
    averageRating,
    untradeableCount,
    uniquePositions,
  };
}

export function ClubImporter() {
  const [clubInput, setClubInput] = useState("");
  const [translationInput, setTranslationInput] = useState("");
  const [players, setPlayers] = useState<ParsedPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastImportedAt, setLastImportedAt] = useState<Date | null>(null);

  const summary = useMemo(() => summarizePlayers(players), [players]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const clubItems = parseClubItems(clubInput);
      const translations = parseTranslations(translationInput);

      const enriched = clubItems.map((item, index) =>
        buildPlayer(item, pickTranslation(item, translations), index)
      );

      const sorted = [...enriched].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      setPlayers(sorted);
      setError(null);
      setLastImportedAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import club data.";
      setError(message);
    }
  };

  const handleReset = () => {
    setClubInput("");
    setTranslationInput("");
    setPlayers([]);
    setError(null);
    setLastImportedAt(null);
  };

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
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
            value={clubInput}
            onChange={(event) => setClubInput(event.target.value)}
            placeholder='{"clubs": [...]}'
            className="min-h-[180px] w-full rounded-brand border border-border-light bg-surface px-3 py-2 font-mono text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
            spellCheck={false}
          />
          <p className="text-xs text-brand-muted dark:text-brand-subtle">
            Paste the raw clubs dataset JSON exactly as exported from the data source. Loose comma-separated
            objects are accepted.
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
            value={translationInput}
            onChange={(event) => setTranslationInput(event.target.value)}
            placeholder='{"translations": {...}}'
            className="min-h-[180px] w-full rounded-brand border border-border-light bg-surface px-3 py-2 font-mono text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
            spellCheck={false}
          />
          <p className="text-xs text-brand-muted dark:text-brand-subtle">
            Include language overrides for club names, abbreviations, and nicknames.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-brand border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Import clubs</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset form
          </Button>
          {lastImportedAt ? (
            <span className="text-xs text-brand-muted dark:text-brand-subtle">
              Last imported <time dateTime={lastImportedAt.toISOString()}>{lastImportedAt.toLocaleString()}</time>
            </span>
          ) : (
            <span className="text-xs text-brand-muted dark:text-brand-subtle">
              Import data to preview your club roster below.
            </span>
          )}
        </div>
      </form>

      <ClubResults players={players} summary={summary} />
    </div>
  );
}

function ClubResults({
  players,
  summary,
}: {
  players: ParsedPlayer[];
  summary: ReturnType<typeof summarizePlayers>;
}) {
  if (!players.length) {
    return (
      <Card padding="lg" className="text-sm text-brand-muted dark:text-brand-subtle">
        <p>
          No club items imported yet. Paste the JSON payload above and select <strong>Import clubs</strong> to see a structured
          view of your squad.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card padding="md" className="bg-surface/70 dark:bg-surface-overlayDark/70">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total players" value={summary.total.toString()} />
          <Stat
            label="Average rating"
            value={summary.averageRating != null ? summary.averageRating.toString() : "—"}
          />
          <Stat label="Untradeable" value={summary.untradeableCount.toString()} />
          <Stat label="Unique positions" value={summary.uniquePositions.size.toString()} />
        </dl>
      </Card>

      <ul className="grid gap-4 lg:grid-cols-2">
        {players.map((player) => (
          <li key={player.key}>
            <Card padding="lg" className="space-y-4">
              <header className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">
                    {player.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted dark:text-brand-subtle">
                    {player.resourceId ? <span>ID: {player.resourceId}</span> : null}
                    {player.assetId && player.assetId !== player.resourceId ? (
                      <span>Asset: {player.assetId}</span>
                    ) : null}
                    {player.untradeable ? <span className="rounded-full bg-brand/10 px-2 py-1 font-medium text-brand-strong">Untradeable</span> : null}
                    {player.rarity ? (
                      <span className="rounded-full bg-brand-accent/10 px-2 py-1 font-medium text-brand-strong">
                        {player.rarity}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-lg font-semibold text-brand">
                  {player.rating != null ? player.rating : "—"}
                </div>
              </header>

              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {player.preferredPosition ? (
                  <span className="rounded-full bg-brand text-brand-foreground px-3 py-1">
                    {player.preferredPosition}
                  </span>
                ) : null}
                {player.possiblePositions
                  .filter((position) => position !== player.preferredPosition)
                  .map((position) => (
                    <span
                      key={`${player.key}-${position}`}
                      className="rounded-full border border-border-light/70 px-3 py-1 text-brand-strong dark:border-border-dark"
                    >
                      {position}
                    </span>
                  ))}
              </div>

              <dl className="grid gap-3 text-xs text-brand-muted dark:text-brand-subtle sm:grid-cols-2">
                <Detail label="Contract" value={formatNumber(player.contract)} />
                <Detail label="Loyalty" value={formatNumber(player.loyaltyBonus)} />
                <Detail label="Pile" value={formatNumber(player.pile)} />
                <Detail label="Play style" value={formatNumber(player.playStyle)} />
                <Detail label="Team ID" value={formatNumber(player.teamId)} />
                <Detail label="Nation ID" value={formatNumber(player.nationId)} />
              </dl>

              {player.attributeBadges.length ? (
                <div className="flex flex-wrap gap-2">
                  {player.attributeBadges.map((attribute) => (
                    <span
                      key={`${player.key}-${attribute.label}`}
                      className="rounded-brand-full bg-surface/90 px-3 py-1 text-xs font-semibold text-brand-strong shadow-brand-sm dark:bg-surface-muted/60"
                    >
                      {attribute.label}: {attribute.value}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand border border-border-light/70 bg-surface px-4 py-3 text-sm shadow-brand-sm dark:border-border-dark dark:bg-surface-muted/60">
      <dt className="text-xs uppercase tracking-wide text-brand-muted dark:text-brand-subtle">{label}</dt>
      <dd className="text-base font-semibold text-brand-strong dark:text-brand-foreground">{value}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-brand-strong dark:text-brand-foreground">{value}</dd>
    </div>
  );
}

function formatNumber(value: number | null): string {
  if (value == null) return "—";
  return Number.isFinite(value) ? value.toString() : "—";
}
