import { ChangeEvent, useMemo, useState } from "react";

import { translateClubJsonToReadable, type ReadablePlayer } from "../../lib/club/translate";
import { indexLocale, type LocaleMaps } from "../../lib/locale/indexLocale";
import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { Button, buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

// --- Types -----------------------------------------------------------------

type ClubPlayer = {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPositions?: string[];
  nation?: string;
  league?: string;
  club?: string;
  quantity?: number;
};

type SbcSlot = {
  id: string;
  label: string;
  position?: string;
  nation?: string;
  league?: string;
  club?: string;
  minRating?: number;
};

type SlotAssignment = {
  slot: SbcSlot;
  player: ClubPlayer;
};

type SolveOptions = {
  minTeamRating?: number;
};

// --- Demo data --------------------------------------------------------------

const DEMO_CLUB_PLAYERS: ClubPlayer[] = [
  {
    id: "alisson",
    name: "Alisson",
    rating: 89,
    position: "GK",
    nation: "Brazil",
    league: "Premier League",
    club: "Liverpool",
  },
  {
    id: "vvd",
    name: "Virgil van Dijk",
    rating: 90,
    position: "CB",
    altPositions: ["SW"],
    nation: "Netherlands",
    league: "Premier League",
    club: "Liverpool",
  },
  {
    id: "ruben-dias",
    name: "Rúben Dias",
    rating: 89,
    position: "CB",
    altPositions: ["LCB"],
    nation: "Portugal",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "kyle-walker",
    name: "Kyle Walker",
    rating: 86,
    position: "RB",
    altPositions: ["RWB", "CB"],
    nation: "England",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "robertson",
    name: "Andy Robertson",
    rating: 86,
    position: "LB",
    altPositions: ["LWB"],
    nation: "Scotland",
    league: "Premier League",
    club: "Liverpool",
  },
  {
    id: "rodri",
    name: "Rodri",
    rating: 91,
    position: "CDM",
    altPositions: ["CM"],
    nation: "Spain",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "odegaard",
    name: "Martin Ødegaard",
    rating: 88,
    position: "CAM",
    altPositions: ["CM"],
    nation: "Norway",
    league: "Premier League",
    club: "Arsenal",
  },
  {
    id: "foden",
    name: "Phil Foden",
    rating: 88,
    position: "LW",
    altPositions: ["RW", "CAM"],
    nation: "England",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "saka",
    name: "Bukayo Saka",
    rating: 88,
    position: "RW",
    altPositions: ["RM", "LW"],
    nation: "England",
    league: "Premier League",
    club: "Arsenal",
  },
  {
    id: "son",
    name: "Heung-Min Son",
    rating: 89,
    position: "LW",
    altPositions: ["ST", "CF"],
    nation: "Korea Republic",
    league: "Premier League",
    club: "Tottenham Hotspur",
  },
  {
    id: "haaland",
    name: "Erling Haaland",
    rating: 91,
    position: "ST",
    altPositions: ["CF"],
    nation: "Norway",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "martinez",
    name: "Emiliano Martínez",
    rating: 85,
    position: "GK",
    nation: "Argentina",
    league: "Premier League",
    club: "Aston Villa",
  },
  {
    id: "bruno",
    name: "Bruno Fernandes",
    rating: 88,
    position: "CAM",
    altPositions: ["CM"],
    nation: "Portugal",
    league: "Premier League",
    club: "Manchester United",
  },
  {
    id: "bernardo",
    name: "Bernardo Silva",
    rating: 88,
    position: "RW",
    altPositions: ["CAM", "CM"],
    nation: "Portugal",
    league: "Premier League",
    club: "Manchester City",
  },
  {
    id: "gabriel",
    name: "Gabriel Jesus",
    rating: 86,
    position: "CF",
    altPositions: ["ST", "RW"],
    nation: "Brazil",
    league: "Premier League",
    club: "Arsenal",
  },
  {
    id: "stones",
    name: "John Stones",
    rating: 85,
    position: "CB",
    altPositions: ["CDM"],
    nation: "England",
    league: "Premier League",
    club: "Manchester City",
  },
];

type SlotBlueprint = {
  label: string;
  position?: string;
  nation?: string;
  league?: string;
  club?: string;
  minRating?: number;
};

const DEFAULT_SLOT_BLUEPRINTS: SlotBlueprint[] = [
  { label: "Goalkeeper", position: "GK", minRating: 82 },
  { label: "Right Back", position: "RB/RWB", minRating: 82 },
  { label: "Centre Back 1", position: "CB", minRating: 84 },
  { label: "Centre Back 2", position: "CB", minRating: 84 },
  { label: "Left Back", position: "LB/LWB", minRating: 82 },
  { label: "Midfield 1", position: "CDM/CM", minRating: 84 },
  { label: "Midfield 2", position: "CM/CAM", minRating: 84 },
  { label: "Right Wing", position: "RW/RM", minRating: 84 },
  { label: "Left Wing", position: "LW/LM", minRating: 84 },
  { label: "Striker 1", position: "ST/CF", minRating: 85 },
  { label: "Striker 2", position: "ST/CF", minRating: 85 },
];

function buildDefaultSlots(): SbcSlot[] {
  return DEFAULT_SLOT_BLUEPRINTS.map((blueprint) => createSlot(blueprint.label, blueprint));
}

type PlayerCandidate = {
  key: string;
  player: ClubPlayer;
};

// --- Utilities --------------------------------------------------------------

function createSlot(label: string, overrides: Partial<SbcSlot> = {}): SbcSlot {
  return {
    id: `${label}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    ...overrides,
  };
}

function parseConstraintList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[\/,]|\s+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function toClubPlayer(readable: ReadablePlayer): ClubPlayer {
  const baseId = readable.id && readable.id.trim()
    ? readable.id.trim()
    : readable._ids?.resourceId !== undefined
      ? String(readable._ids.resourceId)
      : readable.name;

  const altPositions = readable.altPositions && readable.altPositions.length ? readable.altPositions : undefined;

  return {
    id: baseId,
    name: readable.name,
    rating: readable.rating,
    position: readable.position,
    altPositions,
    nation: readable.nation,
    league: readable.league,
    club: readable.club,
  };
}

function convertReadablePlayers(players: ReadablePlayer[]): ClubPlayer[] {
  const aggregated = new Map<string, ClubPlayer>();

  players.forEach((readable) => {
    const key = deriveAggregationKey(readable);
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + 1;
    } else {
      const clubPlayer = toClubPlayer(readable);
      aggregated.set(key, { ...clubPlayer, quantity: 1 });
    }
  });

  return Array.from(aggregated.values()).map((player) => {
    if (player.quantity && player.quantity > 1) {
      return { ...player };
    }
    const { quantity: _quantity, ...rest } = player;
    return { ...rest };
  });
}

function deriveAggregationKey(readable: ReadablePlayer): string {
  if (readable.id && readable.id.trim()) {
    return readable.id.trim();
  }
  if (readable._ids?.resourceId !== undefined) {
    return `resource-${readable._ids.resourceId}`;
  }
  return `fallback-${readable.name}-${readable.position}-${readable.rating}`;
}

function expandPlayers(players: ClubPlayer[]): PlayerCandidate[] {
  const expanded: PlayerCandidate[] = [];
  players.forEach((player) => {
    const copies = Math.max(1, Number(player.quantity) || 1);
    for (let index = 0; index < copies; index += 1) {
      const key = `${player.id}#${index}`;
      expanded.push({ key, player: { ...player } });
    }
  });
  return expanded;
}

function matchesSlot(slot: SbcSlot, player: ClubPlayer) {
  const requiredPositions = parseConstraintList(slot.position);
  const playerPositions = new Set(
    [player.position, ...(player.altPositions ?? [])].map((value) => value.toLowerCase())
  );

  if (requiredPositions.length > 0) {
    const hasMatch = requiredPositions.some((required) => playerPositions.has(required));
    if (!hasMatch) {
      return false;
    }
  }

  if (slot.nation && !equalsIgnoreCase(slot.nation, player.nation)) {
    return false;
  }
  if (slot.league && !equalsIgnoreCase(slot.league, player.league)) {
    return false;
  }
  if (slot.club && !equalsIgnoreCase(slot.club, player.club)) {
    return false;
  }
  if (slot.minRating && player.rating < slot.minRating) {
    return false;
  }

  return true;
}

function equalsIgnoreCase(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

function solveSbc(
  players: ClubPlayer[],
  slots: SbcSlot[],
  { minTeamRating = 0 }: SolveOptions = {}
): { assignments: SlotAssignment[]; averageRating: number } | null {
  if (!players.length || !slots.length) {
    return null;
  }

  const expandedPlayers = expandPlayers(players);
  const slotDescriptors = slots.map((slot, index) => ({ slot, index }));

  const candidateMap = new Map<string, PlayerCandidate[]>();
  slotDescriptors.forEach(({ slot }) => {
    const candidates = expandedPlayers.filter(({ player }) => matchesSlot(slot, player));
    candidateMap.set(slot.id, candidates);
  });

  if (slotDescriptors.some(({ slot }) => (candidateMap.get(slot.id)?.length ?? 0) === 0)) {
    return null;
  }

  slotDescriptors.sort((a, b) => {
    const sizeA = candidateMap.get(a.slot.id)?.length ?? 0;
    const sizeB = candidateMap.get(b.slot.id)?.length ?? 0;
    return sizeA - sizeB;
  });

  const used = new Set<string>();
  const assignment: { descriptor: { slot: SbcSlot; index: number }; candidate: PlayerCandidate }[] = [];
  let ratingSum = 0;

  function backtrack(position: number): boolean {
    if (position >= slotDescriptors.length) {
      const averageRating = ratingSum / slots.length;
      if (averageRating >= minTeamRating) {
        return true;
      }
      return false;
    }

    const descriptor = slotDescriptors[position];
    if (!descriptor) {
      return false;
    }
    const candidates = (candidateMap.get(descriptor.slot.id) ?? [])
      .slice()
      .sort((first, second) => second.player.rating - first.player.rating);

    for (const candidate of candidates) {
      if (used.has(candidate.key)) {
        continue;
      }
      used.add(candidate.key);
      assignment.push({ descriptor, candidate });
      ratingSum += candidate.player.rating;

      if (backtrack(position + 1)) {
        return true;
      }

      ratingSum -= candidate.player.rating;
      assignment.pop();
      used.delete(candidate.key);
    }

    return false;
  }

  const success = backtrack(0);
  if (!success) {
    return null;
  }

  const orderedAssignments = assignment
    .map(({ descriptor, candidate }) => ({ slot: descriptor.slot, index: descriptor.index, player: candidate.player }))
    .sort((a, b) => a.index - b.index);

  const ratingTotal = orderedAssignments.reduce((sum, entry) => sum + entry.player.rating, 0);

  return {
    assignments: orderedAssignments.map(({ slot, player }) => ({ slot, player })),
    averageRating: ratingTotal / slots.length,
  };
}

function formatAverage(value: number) {
  return value.toFixed(2);
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function parseLocale(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function collectPlayerRecords(input: unknown): unknown[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.itemData)) {
      return record.itemData;
    }
    if (Array.isArray(record.players)) {
      return record.players;
    }
    if (Array.isArray(record.items)) {
      return record.items;
    }
    const nested = Object.values(record).flatMap((value) =>
      Array.isArray(value) && value.some((entry) => entry && typeof entry === "object") ? value : []
    );
    if (nested.length) {
      return nested;
    }
    return [record];
  }
  return [];
}

// --- Page component ---------------------------------------------------------

export default function SbcSolverPage() {
  const [clubPlayers, setClubPlayers] = useState<ClubPlayer[]>([]);
  const [rawClubInput, setRawClubInput] = useState("");
  const [rawLocaleInput, setRawLocaleInput] = useState("");
  const [clubImportError, setClubImportError] = useState<string | null>(null);
  const [localeError, setLocaleError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SbcSlot[]>(() => buildDefaultSlots());
  const [minTeamRating, setMinTeamRating] = useState(84);
  const [solution, setSolution] = useState<ReturnType<typeof solveSbc> | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  const totalCards = useMemo(
    () =>
      clubPlayers.reduce((sum, player) => {
        const copies = Math.max(1, Number(player.quantity) || 1);
        return sum + copies;
      }, 0),
    [clubPlayers]
  );

  const handleApplyClubJson = () => {
    const parsed = safeJsonParse(rawClubInput);
    if (!parsed) {
      setClubImportError("We couldn't parse that JSON blob. Double-check you copied the response correctly.");
      return;
    }

    let maps: LocaleMaps | undefined;
    if (rawLocaleInput.trim()) {
      const parsedLocale = parseLocale(rawLocaleInput);
      if (!parsedLocale) {
        setLocaleError("We couldn't parse that locale JSON. We'll fall back to ID-based names.");
      } else {
        maps = indexLocale(parsedLocale);
        setLocaleError(null);
      }
    } else {
      setLocaleError(null);
    }

    const candidateRecords = collectPlayerRecords(parsed);
    const translationSource = candidateRecords.length ? candidateRecords : parsed;
    const readablePlayers = translateClubJsonToReadable(translationSource, maps);
    const normalized = convertReadablePlayers(readablePlayers);

    if (!normalized.length) {
      setClubImportError(
        "No player entries were found in the pasted data. Import a response that includes club player objects."
      );
      return;
    }

    setClubPlayers(normalized.map((player) => ({ ...player })));
    setClubImportError(null);
    setSolution(null);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        setRawClubInput(text);
        setClubImportError(null);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleLoadDemo = () => {
    setClubPlayers(DEMO_CLUB_PLAYERS.map((player) => ({ ...player })));
    setRawClubInput(JSON.stringify(DEMO_CLUB_PLAYERS, null, 2));
    setClubImportError(null);
    setLocaleError(null);
    setSolution(null);
  };

  const handleResetTemplate = () => {
    setSlots(buildDefaultSlots());
    setSolution(null);
  };

  const handleSolve = () => {
    setIsSolving(true);
    setSolution(null);
    setTimeout(() => {
      const result = solveSbc(clubPlayers, slots, { minTeamRating });
      setSolution(result);
      setIsSolving(false);
    }, 0);
  };

  const handleUpdateSlot = (id: string, patch: Partial<SbcSlot>) => {
    setSlots((previous) => previous.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
    setSolution(null);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots((previous) => previous.filter((slot) => slot.id !== id));
    setSolution(null);
  };

  const handleAddSlot = () => {
    const index = slots.length + 1;
    setSlots((previous) => [...previous, createSlot(`Slot ${index}`)]);
    setSolution(null);
  };

  const hasClubData = clubPlayers.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHero
        title={
          <span className="bg-gradient-to-r from-brand via-brand-strong/80 to-brand-accent bg-clip-text text-transparent dark:from-brand/80 dark:via-white dark:to-brand-accent">
            FC 26 SBC Solver
          </span>
        }
        description={
          <span>
            Import your Ultimate Team club directly from the EA Sports FC 26 web app, model the challenge requirements, and let the
            solver build a valid squad using the cards you already own.
          </span>
        }
        stats={
          <>
            <StatPill>Local-first</StatPill>
            <StatPill>Works with bulk JSON exports</StatPill>
            <StatPill>No login required</StatPill>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleLoadDemo}>
              Load demo club
            </Button>
            <Button variant="ghost" onClick={handleResetTemplate}>
              Reset template
            </Button>
          </div>
        }
      />

      <PageSection
        title="How to export club data"
        description="A quick walkthrough for pulling your squad from the official EA web app."
        contentClassName="space-y-6"
      >
        <ol className="space-y-4 text-sm text-brand-muted dark:text-brand-subtle">
          <li>
            <strong className="text-brand-strong dark:text-brand-foreground">1. Open the FC 26 web app.</strong> Visit
            {" "}
            <a
              href="https://www.ea.com/en-gb/ea-sports-fc/ultimate-team/web-app/"
              target="_blank"
              rel="noreferrer"
              className="text-brand underline-offset-4 hover:underline"
            >
              ea.com
            </a>{" "}
            and sign in to your Ultimate Team account.
          </li>
          <li>
            <strong className="text-brand-strong dark:text-brand-foreground">2. Open developer tools.</strong> Press
            {" "}
            <kbd className="rounded bg-black/10 px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide dark:bg-white/10">
              Ctrl
            </kbd>{" "}
            +
            {" "}
            <kbd className="rounded bg-black/10 px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide dark:bg-white/10">
              Shift
            </kbd>{" "}
            +
            {" "}
            <kbd className="rounded bg-black/10 px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide dark:bg-white/10">
              I
            </kbd>{" "}
            (or <code className="rounded bg-black/10 px-1 py-0.5 text-[11px]">⌥⌘I</code> on macOS) to launch the browser console.
          </li>
          <li>
            <strong className="text-brand-strong dark:text-brand-foreground">3. Capture the club response.</strong> On
            the Network tab, filter requests for <code className="rounded bg-black/10 px-1 py-0.5 text-[11px]">/club</code> and
            refresh. Right-click the <em>club</em> XHR call and choose “Copy » Copy response”.
          </li>
          <li>
            <strong className="text-brand-strong dark:text-brand-foreground">4. Paste the JSON below.</strong> Drop the raw
            JSON into the importer and we’ll do the rest. We only process the data in your browser—nothing ever leaves your device.
          </li>
        </ol>

        <Card className="relative overflow-hidden border border-dashed border-brand/30 bg-brand/5 text-sm text-brand-muted dark:border-brand/40 dark:bg-brand/10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand-accent/20 opacity-80" />
          <div className="relative space-y-3">
            <p>
              Prefer the console? Run this helper after signing in and copy the logged payload:
            </p>
            <pre className="overflow-x-auto rounded-brand-md bg-black/80 p-4 font-mono text-xs text-white dark:bg-black">
{`fetch('https://utas.mob.v1.fut.ea.com/ut/game/fc26/club').then(r => r.json()).then(data => {
  console.log(JSON.stringify(data.itemData, null, 2));
});`}
            </pre>
          </div>
        </Card>
      </PageSection>

      <PageSection
        title="Club importer"
        description="Upload the copied response or paste the JSON payload. We'll automatically normalise player names, ratings, and duplicate counts."
        actions={
          <label className={buttonStyles({ variant: "secondary", className: "cursor-pointer" })}>
            <input type="file" accept="application/json" className="sr-only" onChange={handleFileUpload} />
            Upload .json file
          </label>
        }
        contentClassName="space-y-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="locale-json-input" className="block text-sm font-semibold text-brand-muted dark:text-brand-subtle">
              Paste locale JSON from /fut/loc/companion/futweb/{"{lang}"}.json (e.g., en-US.json)
            </label>
            <textarea
              id="locale-json-input"
              value={rawLocaleInput}
              onChange={(event) => {
                setRawLocaleInput(event.target.value);
                setLocaleError(null);
              }}
              rows={6}
              placeholder="Optional locale mapping JSON"
              className="w-full resize-y rounded-brand-lg border border-border-light bg-white/90 p-4 font-mono text-xs text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
            />
            <p className="text-xs text-brand-muted dark:text-brand-subtle">
              Optional: paste locale JSON to see real names. Without it, IDs will be shown.
            </p>
            {localeError ? (
              <p className="rounded-brand-md border border-red-300/60 bg-red-50/80 p-2 text-xs text-red-600 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200">
                {localeError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="club-json-input" className="block text-sm font-semibold text-brand-muted dark:text-brand-subtle">
              Paste club JSON → Parse
            </label>
            <textarea
              id="club-json-input"
              value={rawClubInput}
              onChange={(event) => setRawClubInput(event.target.value)}
              rows={8}
              placeholder="Paste the club JSON response here"
              className="w-full resize-y rounded-brand-lg border border-border-light bg-white/90 p-4 font-mono text-xs text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={handleApplyClubJson}>
            Parse pasted JSON
          </Button>
          <Button variant="secondary" onClick={handleLoadDemo}>
            Load demo club
          </Button>
          <span className="text-sm text-brand-muted dark:text-brand-subtle">
            {hasClubData
              ? `Loaded ${clubPlayers.length} unique players (${totalCards} cards including duplicates).`
              : "No club data imported yet."}
          </span>
        </div>
        {clubImportError ? (
          <p className="rounded-brand-md border border-red-300/60 bg-red-50/80 p-3 text-sm text-red-600 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-200">
            {clubImportError}
          </p>
        ) : null}

        {hasClubData ? (
          <div className="overflow-hidden rounded-brand-xl border border-border-light/60 bg-surface/90 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80">
            <table className="min-w-full divide-y divide-border-light/60 text-left text-sm dark:divide-border-dark/60">
              <thead className="bg-surface/70 font-semibold uppercase tracking-[0.18em] text-brand-muted/80 dark:bg-surface-muted/40 dark:text-brand-subtle">
                <tr>
                  <th scope="col" className="px-4 py-3">Player</th>
                  <th scope="col" className="px-4 py-3">Pos</th>
                  <th scope="col" className="px-4 py-3">Alt Pos</th>
                  <th scope="col" className="px-4 py-3">Rating</th>
                  <th scope="col" className="px-4 py-3">Nation</th>
                  <th scope="col" className="px-4 py-3">League</th>
                  <th scope="col" className="px-4 py-3">Club</th>
                  <th scope="col" className="px-4 py-3">Copies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/50">
                {clubPlayers
                  .slice()
                  .sort((a, b) => b.rating - a.rating)
                  .map((player) => (
                    <tr key={player.id} className="transition-colors hover:bg-brand/5 dark:hover:bg-brand/10">
                      <td className="px-4 py-3 font-medium text-brand-strong dark:text-brand-foreground">{player.name}</td>
                      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-muted dark:text-brand-subtle">
                        {player.position}
                      </td>
                      <td className="px-4 py-3 text-xs uppercase text-brand-muted dark:text-brand-subtle">
                        {(player.altPositions ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-strong dark:text-brand-foreground">{player.rating}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.nation ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.league ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.club ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{Math.max(1, Number(player.quantity) || 1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="SBC template"
        description="Describe each squad slot just like the in-game requirements. Add filters for positions, nations, leagues, clubs, and minimum ratings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleAddSlot}>
              Add slot
            </Button>
            <Button variant="ghost" onClick={handleResetTemplate}>
              Restore defaults
            </Button>
          </div>
        }
        contentClassName="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-brand-muted dark:text-brand-subtle">
            <span className="font-semibold text-brand-strong dark:text-brand-foreground">Minimum squad rating</span>
            <input
              type="number"
              min={0}
              max={99}
              value={minTeamRating}
              onChange={(event) => {
                setMinTeamRating(Number(event.target.value) || 0);
                setSolution(null);
              }}
              className="w-full rounded-brand-lg border border-border-light bg-white/90 p-3 text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
            />
          </label>
          <div className="rounded-brand-xl border border-dashed border-brand/30 bg-brand/5 p-4 text-sm text-brand-muted dark:border-brand/40 dark:bg-brand/10 dark:text-brand-subtle">
            Tip: separate multiple positions with commas or slashes (<code>ST, CF</code> or <code>RB/RWB</code>) to allow either card.
          </div>
        </div>

        <div className="overflow-hidden rounded-brand-xl border border-border-light/60 bg-surface/90 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80">
          <table className="min-w-full divide-y divide-border-light/60 text-sm dark:divide-border-dark/60">
            <thead className="bg-surface/70 text-left font-semibold uppercase tracking-[0.18em] text-brand-muted/80 dark:bg-surface-muted/40 dark:text-brand-subtle">
              <tr>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Position filter</th>
                <th className="px-4 py-3">Nation</th>
                <th className="px-4 py-3">League</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Min rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/50">
              {slots.map((slot) => (
                <tr key={slot.id} className="align-top transition-colors hover:bg-brand/5 dark:hover:bg-brand/10">
                  <td className="px-4 py-3">
                    <input
                      value={slot.label}
                      onChange={(event) => handleUpdateSlot(slot.id, { label: event.target.value })}
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm font-semibold text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={slot.position ?? ""}
                      onChange={(event) => handleUpdateSlot(slot.id, { position: event.target.value })}
                      placeholder="e.g. ST/CF"
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={slot.nation ?? ""}
                      onChange={(event) => handleUpdateSlot(slot.id, { nation: event.target.value || undefined })}
                      placeholder="Any"
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={slot.league ?? ""}
                      onChange={(event) => handleUpdateSlot(slot.id, { league: event.target.value || undefined })}
                      placeholder="Any"
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={slot.club ?? ""}
                      onChange={(event) => handleUpdateSlot(slot.id, { club: event.target.value || undefined })}
                      placeholder="Any"
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={slot.minRating ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        handleUpdateSlot(slot.id, {
                          minRating: value === "" ? undefined : Number(value),
                        });
                      }}
                      placeholder="Any"
                      className="w-full rounded-brand-lg border border-border-light bg-white/90 p-2 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSlot(slot.id)}
                      disabled={slots.length <= 1}
                      className="text-brand-muted hover:text-red-600 dark:hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection
        title="Solve the challenge"
        description="Run the solver whenever you update the template or import fresh club data. We'll try to fill every slot while respecting your constraints."
        actions={
          <Button variant="primary" onClick={handleSolve} disabled={!hasClubData || !slots.length || isSolving}>
            {isSolving ? "Solving…" : "Check my club"}
          </Button>
        }
        contentClassName="space-y-4"
      >
        {!hasClubData ? (
          <p className="text-sm text-brand-muted dark:text-brand-subtle">
            Import your club first so we know which players you can submit.
          </p>
        ) : null}

        {solution ? (
          <div className="space-y-4">
            <div className="rounded-brand-xl border border-brand/30 bg-brand/5 p-4 text-sm text-brand-muted dark:border-brand/40 dark:bg-brand/10 dark:text-brand-subtle">
              <p>
                Average squad rating: <span className="font-semibold text-brand-strong dark:text-brand-foreground">{formatAverage(solution.averageRating)}</span>
              </p>
              <p className="text-xs">Remember that loyalty, chemistry, or chemistry points aren't calculated—check those manually in-game.</p>
            </div>
            <div className="overflow-hidden rounded-brand-xl border border-border-light/60 bg-surface/90 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80">
              <table className="min-w-full divide-y divide-border-light/60 text-left text-sm dark:divide-border-dark/60">
                <thead className="bg-surface/70 font-semibold uppercase tracking-[0.18em] text-brand-muted/80 dark:bg-surface-muted/40 dark:text-brand-subtle">
                  <tr>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Club</th>
                    <th className="px-4 py-3">League</th>
                    <th className="px-4 py-3">Nation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/50">
                  {solution.assignments.map(({ slot, player }) => (
                    <tr key={`${slot.id}-${player.id}`} className="transition-colors hover:bg-brand/5 dark:hover:bg-brand/10">
                      <td className="px-4 py-3 font-semibold text-brand-strong dark:text-brand-foreground">{slot.label}</td>
                      <td className="px-4 py-3 text-brand-strong dark:text-brand-foreground">{player.name}</td>
                      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-muted dark:text-brand-subtle">
                        {player.position}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-strong dark:text-brand-foreground">{player.rating}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.club ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.league ?? "—"}</td>
                      <td className="px-4 py-3 text-brand-muted dark:text-brand-subtle">{player.nation ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : hasClubData && !isSolving ? (
          <p className="text-sm text-brand-muted dark:text-brand-subtle">
            No valid combination matched the current constraints. Try relaxing the position filters or lowering the squad rating.
          </p>
        ) : null}
      </PageSection>
    </div>
  );
}
