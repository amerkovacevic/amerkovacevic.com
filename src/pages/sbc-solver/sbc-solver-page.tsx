import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  AlertTriangle,
  ClipboardCopy,
  ClipboardList,
  CircleCheck,
  CircleDashed,
  CircleX,
  ListPlus,
  RefreshCcw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

import { solveSbc, type SolveResult } from "./solver";
import type { Attribute, Player, Requirement, SquadConfig } from "./types";

const STORAGE_KEY = "fc26-sbc-state";
const DEFAULT_CONFIG: SquadConfig = { squadSize: 11, minTeamRating: 84, minChemistry: 0 };

const ATTRIBUTES: { value: Attribute; label: string }[] = [
  { value: "nation", label: "Nation" },
  { value: "league", label: "League" },
  { value: "club", label: "Club" },
  { value: "quality", label: "Quality" },
  { value: "position", label: "Position" },
];

type StoredState = {
  players: Player[];
  requirements: Requirement[];
  config: SquadConfig;
};

type PlayerFormState = {
  name: string;
  rating: string;
  nation: string;
  league: string;
  club: string;
  quality: string;
  positions: string;
};

type RequirementFormState = {
  attribute: Attribute;
  value: string;
  minCount: string;
};

export default function SbcSolverPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [config, setConfig] = useState<SquadConfig>({ ...DEFAULT_CONFIG });
  const [playerForm, setPlayerForm] = useState<PlayerFormState>(emptyPlayerForm());
  const [reqForm, setReqForm] = useState<RequirementFormState>({ attribute: "nation", value: "", minCount: "1" });
  const [bulkText, setBulkText] = useState("");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setPlayers(saved.players);
      setRequirements(saved.requirements);
      setConfig({ ...DEFAULT_CONFIG, ...saved.config });
    }
  }, []);

  useEffect(() => {
    const state: StoredState = { players, requirements, config };
    saveState(state);
  }, [players, requirements, config]);

  const rosterSummary = useMemo(() => buildRosterSummary(players), [players]);

  const handleAddPlayer = () => {
    const next = toPlayer(playerForm);
    if (!next) return;
    setPlayers((prev) => [...prev, next]);
    setPlayerForm(emptyPlayerForm());
  };

  const handleBulkImport = (raw?: string): number => {
    const source = typeof raw === "string" ? raw : bulkText;
    const parsed = parseBulkPlayers(source);
    if (!parsed.length) return 0;
    setPlayers((prev) => [...prev, ...parsed]);
    if (typeof raw !== "string") {
      setBulkText("");
    }

    return parsed.length;
  };

  const handleBulkImportClick = () => {
    handleBulkImport();
  };

  const handleClipboardImport = async () => {
    if (!navigator.clipboard?.readText) {
      alert("Clipboard access is not available in this browser. Paste the player list into the bulk field instead.");
      return;
    }

    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
        if (status.state === "denied") {
          alert("Clipboard access was blocked. Allow clipboard permissions or paste the export manually.");
          return;
        }
      }
    } catch (error) {
      console.debug("Clipboard permission probe failed", error);
    }

    try {
      const raw = await navigator.clipboard.readText();
      if (!raw.trim()) {
        alert("Clipboard is empty. Copy your club export from the FC 26 web app first.");
        return;
      }
      const imported = handleBulkImport(raw);
      if (!imported) {
        alert("Clipboard text didn't contain any recognizable players. Paste manually to double-check the format.");
        return;
      }
      alert(`Imported ${imported} players from the clipboard.`);
    } catch (error) {
      console.error("Failed to read clipboard import", error);
      alert("Couldn't read from the clipboard. Paste the player list into the bulk field instead.");
    }
  };

  const handleAddRequirement = () => {
    const trimmed = reqForm.value.trim();
    const minCount = Number(reqForm.minCount);
    if (!trimmed || !Number.isFinite(minCount) || minCount <= 0) return;
    setRequirements((prev) => [
      ...prev,
      {
        id: uid(),
        attribute: reqForm.attribute,
        value: trimmed,
        minCount: Math.max(1, Math.floor(minCount)),
      },
    ]);
    setReqForm((prev) => ({ ...prev, value: "" }));
  };

  const handleSolve = () => {
    setIsSolving(true);
    try {
      const normalizedConfig: SquadConfig = {
        squadSize: clamp(Math.floor(config.squadSize || 0), 1, 11),
        minTeamRating: Math.max(0, config.minTeamRating || 0),
        minChemistry: Math.max(0, config.minChemistry || 0),
        searchLimit: config.searchLimit,
      };
      const cleanPlayers = players.map((p) => ({
        ...p,
        rating: Math.max(0, Math.round(p.rating)),
        positions: p.positions.map((pos) => pos.trim()).filter(Boolean),
      }));
      const cleanRequirements = requirements.map((req) => ({ ...req, value: req.value.trim() }));
      const outcome = solveSbc(cleanPlayers, cleanRequirements, normalizedConfig);
      setResult(outcome);
    } finally {
      setIsSolving(false);
    }
  };

  const handleClearAll = () => {
    setPlayers([]);
    setRequirements([]);
    setResult(null);
    setPlayerForm(emptyPlayerForm());
    setBulkText("");
    setConfig({ ...DEFAULT_CONFIG });
  };

  const disableSolve = players.length < config.squadSize;

  const configRatingNeeded = config.squadSize * config.minTeamRating;
  const configChemRange = `${config.minChemistry} / ${config.squadSize * 3}`;

  return (
    <div className="space-y-8">
      <PageHero
        icon={<Sparkles aria-hidden className="h-8 w-8" />}
        title="FC 26 SBC Solver"
        description={
          <span>
            Build the cheapest possible squad that still clears FC 26 Squad Building Challenges. Paste your club, set
            requirements, and let the solver crunch combinations with live chemistry estimates.
          </span>
        }
        stats={
          <>
            <StatPill>
              <Users className="h-3 w-3" aria-hidden /> {players.length} players in pool
            </StatPill>
            <StatPill>
              <CircleDashed className="h-3 w-3" aria-hidden /> Min rating target: {config.minTeamRating}
            </StatPill>
            <StatPill>
              <Settings className="h-3 w-3" aria-hidden /> Chemistry floor: {configChemRange}
            </StatPill>
          </>
        }
      />

      <PageSection
        title="Squad requirements"
        description="Dial in the SBC target and kick off the solver. All numbers auto-save locally."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSolve}
              disabled={disableSolve || isSolving}
              className={buttonStyles({})}
            >
              <Sparkles className="h-4 w-4" aria-hidden /> {isSolving ? "Solving..." : "Solve SBC"}
            </button>
            <button type="button" onClick={handleClearAll} className={buttonStyles({ variant: "secondary" })}>
              <Trash2 className="h-4 w-4" aria-hidden /> Reset all
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Squad size" description="Most SBCs expect 11 players.">
            <input
              type="number"
              min={1}
              max={11}
              value={config.squadSize}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, squadSize: clamp(Number(e.target.value) || 0, 1, 11) }))
              }
              className="w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
            />
          </Field>
          <Field label="Minimum team rating" description="Target overall rating threshold.">
            <input
              type="number"
              min={0}
              max={99}
              value={config.minTeamRating}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, minTeamRating: Math.max(0, Number(e.target.value) || 0) }))
              }
              className="w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
            />
          </Field>
          <Field label="Minimum chemistry" description="Optional: ensure the squad hits a chemistry floor.">
            <input
              type="number"
              min={0}
              max={33}
              value={config.minChemistry}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, minChemistry: Math.max(0, Number(e.target.value) || 0) }))
              }
              className="w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
            />
          </Field>
          <Field label="Search limit" description="Safety net to stop runaway searches." hint="Advanced">
            <input
              type="number"
              min={50_000}
              max={1_000_000}
              step={10_000}
              value={config.searchLimit ?? 200_000}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, searchLimit: Math.max(10_000, Number(e.target.value) || 0) }))
              }
              className="w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
            />
          </Field>
        </div>
        <div className="text-xs text-brand-muted dark:text-brand-subtle">
          Required rating total: <strong>{Math.round(configRatingNeeded)}</strong> • Chemistry ceiling: <strong>{configChemRange}</strong>
        </div>
        {disableSolve ? (
          <div className="rounded-brand border border-dashed border-brand/30 bg-brand/5 p-3 text-xs text-brand-muted dark:border-white/20 dark:bg-white/5 dark:text-white/70">
            Add at least {config.squadSize} players to enable the solver.
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Attribute requirements"
        description="Stack minimums for leagues, nations, clubs, qualities or positions."
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 flex-wrap gap-3">
            {requirements.length ? (
              requirements.map((req) => (
                <RequirementPill key={req.id} requirement={req} onRemove={() => removeRequirement(req.id, setRequirements)} />
              ))
            ) : (
              <div className="flex items-center gap-2 rounded-brand-full border border-dashed border-brand/30 px-4 py-2 text-sm text-brand-muted dark:border-white/20 dark:text-white/70">
                <ListPlus className="h-4 w-4" aria-hidden /> No requirements yet
              </div>
            )}
          </div>
          <div className="min-w-[260px] space-y-2 rounded-brand border border-border-light/70 bg-white/80 p-4 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">Add rule</div>
            <div className="flex flex-col gap-2">
              <select
                value={reqForm.attribute}
                onChange={(e) => setReqForm((prev) => ({ ...prev, attribute: e.target.value as Attribute }))}
                className="w-full rounded-brand border border-border-light bg-white px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
              >
                {ATTRIBUTES.map((attr) => (
                  <option key={attr.value} value={attr.value}>
                    {attr.label}
                  </option>
                ))}
              </select>
              <input
                value={reqForm.value}
                onChange={(e) => setReqForm((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Value (e.g., LaLiga, Spain, GK)"
                className="w-full rounded-brand border border-border-light bg-white px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
              />
              <input
                type="number"
                min={1}
                max={11}
                value={reqForm.minCount}
                onChange={(e) => setReqForm((prev) => ({ ...prev, minCount: e.target.value }))}
                className="w-full rounded-brand border border-border-light bg-white px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark dark:text-white"
              />
              <button type="button" onClick={handleAddRequirement} className={buttonStyles({ variant: "secondary" })}>
                <CircleCheck className="h-4 w-4" aria-hidden /> Add requirement
              </button>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection title="Player pool" description="Paste your club and tidy the list. The solver keeps everything offline.">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InputField
                label="Name"
                value={playerForm.name}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, name: value }))}
                placeholder="Federico Valverde"
              />
              <InputField
                label="Rating"
                type="number"
                min={40}
                max={99}
                value={playerForm.rating}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, rating: value }))}
                placeholder="88"
              />
              <InputField
                label="Nation"
                value={playerForm.nation}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, nation: value }))}
                placeholder="Uruguay"
              />
              <InputField
                label="League"
                value={playerForm.league}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, league: value }))}
                placeholder="LALIGA EA SPORTS"
              />
              <InputField
                label="Club"
                value={playerForm.club}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, club: value }))}
                placeholder="Real Madrid"
              />
              <InputField
                label="Quality"
                value={playerForm.quality}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, quality: value }))}
                placeholder="Gold"
              />
              <InputField
                label="Positions"
                value={playerForm.positions}
                onChange={(value) => setPlayerForm((prev) => ({ ...prev, positions: value }))}
                placeholder="CM, CDM"
                helper="Comma separated"
                className="sm:col-span-2"
              />
              <div className="flex items-end sm:col-span-1">
                <button type="button" onClick={handleAddPlayer} className={buttonStyles({})}>
                  <ListPlus className="h-4 w-4" aria-hidden /> Add player
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
                Bulk paste
              </label>
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Name, Rating, Nation, League, Club, Positions"
                className="min-h-[120px] w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBulkImportClick}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  <ClipboardCopy className="h-4 w-4" aria-hidden /> Parse lines
                </button>
                <button
                  type="button"
                  onClick={handleClipboardImport}
                  className={buttonStyles({ size: "sm" })}
                >
                  <ClipboardList className="h-4 w-4" aria-hidden /> Import players from clipboard
                </button>
                <button
                  type="button"
                  onClick={() => setPlayers((prev) => dedupePlayers(prev))}
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden /> Dedupe identical
                </button>
              </div>
            </div>
          </div>
          <RosterPreview players={players} summary={rosterSummary} onRemove={(id) => setPlayers((prev) => prev.filter((p) => p.id !== id))} />
        </div>
      </PageSection>

      <PageSection title="Solution" description="The best squad the solver found for your constraints.">
        <SolveOutcome result={result} config={config} requirements={requirements} />
      </PageSection>
    </div>
  );
}

type FieldProps = {
  label: string;
  description?: string;
  hint?: string;
  children: ReactNode;
};

function Field({ label, description, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
        <span>{label}</span>
        {hint ? <span className="text-[10px] text-brand-muted/70 dark:text-brand-subtle/70">{hint}</span> : null}
      </div>
      {description ? <p className="text-[11px] text-brand-muted dark:text-brand-subtle">{description}</p> : null}
      {children}
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  type?: string;
  min?: number;
  max?: number;
  className?: string;
};

function InputField({ label, value, onChange, placeholder, helper, type = "text", min, max, className }: InputFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
        {label}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-brand border border-border-light bg-white/90 px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:border-border-dark dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
      />
      {helper ? <p className="text-[11px] text-brand-muted dark:text-brand-subtle">{helper}</p> : null}
    </div>
  );
}

type RequirementPillProps = {
  requirement: Requirement;
  onRemove: () => void;
};

function RequirementPill({ requirement, onRemove }: RequirementPillProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-brand-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm text-brand-strong shadow-brand-sm transition hover:-translate-y-0.5 hover:border-brand/60 hover:bg-brand/10 dark:border-white/20 dark:bg-white/10 dark:text-white"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-muted/80 dark:text-white/70">
        {requirement.attribute}
      </span>
      <span>{requirement.value}</span>
      <span className="rounded-brand-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-brand-strong shadow-brand-sm dark:bg-white/10 dark:text-white">
        ≥{requirement.minCount}
      </span>
      <CircleX className="h-4 w-4 text-brand-muted" aria-hidden />
      <span className="sr-only">Remove requirement</span>
    </button>
  );
}

type RosterPreviewProps = {
  players: Player[];
  summary: ReturnType<typeof buildRosterSummary>;
  onRemove: (id: string) => void;
};

function RosterPreview({ players, summary, onRemove }: RosterPreviewProps) {
  return (
    <Card padding="lg" className="flex h-full flex-col gap-3 border border-border-light/80 bg-white/90 dark:border-border-dark/60 dark:bg-surface-overlayDark">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-strong dark:text-white">Club overview</h3>
        <span className="text-xs text-brand-muted dark:text-brand-subtle">{players.length} players</span>
      </header>
      <div className="grid gap-2 text-xs text-brand-muted dark:text-brand-subtle">
        <span>Avg rating: <strong>{summary.average.toFixed(1)}</strong></span>
        <span>Top nations: {summary.nations.join(", ") || "—"}</span>
        <span>Top leagues: {summary.leagues.join(", ") || "—"}</span>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {players.length ? (
          players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-brand border border-border-light/70 bg-white px-3 py-2 text-xs text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{player.name}</span>
                <span className="text-[11px] text-brand-muted dark:text-brand-subtle">
                  {player.rating} • {player.nation} • {player.league}
                </span>
                <span className="text-[11px] text-brand-muted dark:text-brand-subtle">
                  {player.club} • {player.positions.join(", ") || "Any"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(player.id)}
                className="rounded-brand-full border border-transparent bg-brand/10 p-2 text-brand-strong transition hover:bg-brand/20 dark:bg-white/10 dark:text-white"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sr-only">Remove {player.name}</span>
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-brand border border-dashed border-brand/30 bg-brand/5 px-3 py-6 text-center text-sm text-brand-muted dark:border-white/20 dark:bg-white/5 dark:text-white/70">
            Paste players on the left to populate your pool.
          </div>
        )}
      </div>
    </Card>
  );
}

type SolveOutcomeProps = {
  result: SolveResult | null;
  config: SquadConfig;
  requirements: Requirement[];
};

function SolveOutcome({ result, config, requirements }: SolveOutcomeProps) {
  if (!result) {
    return (
      <div className="rounded-brand border border-dashed border-brand/30 bg-brand/5 p-6 text-sm text-brand-muted dark:border-white/20 dark:bg-white/5 dark:text-white/70">
        Run the solver to see proposed lineups. Solutions aim for the lowest total rating that still clears your target.
      </div>
    );
  }

  if (result.kind !== "success") {
    return (
      <div className="flex items-center gap-3 rounded-brand border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-brand-sm dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-100">
        <AlertTriangle className="h-5 w-5" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">No squad ready</p>
          <p>{result.reason}</p>
          <p className="text-xs text-red-600/80 dark:text-red-200/70">
            Explored {result.stats.visited.toLocaleString()} nodes. Rating prunes: {result.stats.prunedByRating.toLocaleString()}.
          </p>
        </div>
      </div>
    );
  }

  const totalChemistry = `${result.chemistry} / ${config.squadSize * 3}`;
  const averageRating = result.averageRating.toFixed(2);
  const ratingOver = result.ratingSurplus >= 0 ? `+${result.ratingSurplus.toFixed(0)}` : result.ratingSurplus.toFixed(0);
  const requirementStatus = requirements.map((req) => {
    const actual = result.squad.filter((player) => matchesAttribute(player, req)).length;
    return {
      req,
      actual,
      passed: actual >= req.minCount,
    };
  });

  const summaryLines = result.squad.map((player) => {
    const positions = player.positions.join("/") || "ANY";
    return `${player.rating} ${player.name} (${player.nation}, ${player.league}) – ${positions}`;
  });

  const summaryText = [
    `FC 26 SBC solution – ${result.squad.length} players`,
    `Team rating: ${averageRating} avg (${ratingOver} total)`,
    `Chemistry: ${totalChemistry}`,
    "",
    ...summaryLines,
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border-light/70 bg-white/90 p-4 text-sm shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            Rating
            <Save className="h-4 w-4" aria-hidden />
          </div>
          <div className="mt-2 text-2xl font-semibold text-brand-strong dark:text-white">{averageRating}</div>
          <p className="text-xs text-brand-muted dark:text-brand-subtle">Total surplus: {ratingOver}</p>
        </Card>
        <Card className="border border-border-light/70 bg-white/90 p-4 text-sm shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            Chemistry
            <Users className="h-4 w-4" aria-hidden />
          </div>
          <div className="mt-2 text-2xl font-semibold text-brand-strong dark:text-white">{totalChemistry}</div>
          <p className="text-xs text-brand-muted dark:text-brand-subtle">
            {result.chemistryDetails.filter((detail) => detail.total === 3).length} players on 3 chem
          </p>
        </Card>
        <Card className="border border-border-light/70 bg-white/90 p-4 text-sm shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            Search stats
            <CircleDashed className="h-4 w-4" aria-hidden />
          </div>
          <div className="mt-2 text-2xl font-semibold text-brand-strong dark:text-white">
            {result.stats.visited.toLocaleString()}
          </div>
          <p className="text-xs text-brand-muted dark:text-brand-subtle">
            Rating prunes: {result.stats.prunedByRating.toLocaleString()} • Requirement prunes: {result.stats.prunedByRequirement.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-border-light/70 bg-white/95 p-4 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-strong dark:text-white">Proposed XI</h3>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(summaryText)}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              <ClipboardCopy className="h-4 w-4" aria-hidden /> Copy summary
            </button>
          </header>
          <div className="mt-3 grid gap-2 text-sm">
            {result.squad.map((player) => {
              const detail = result.chemistryDetails.find((item) => item.playerId === player.id);
              return (
                <div
                  key={player.id}
                  className="flex flex-col rounded-brand border border-border-light/70 bg-white px-3 py-2 text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {player.rating} {player.name}
                    </span>
                    <span className="text-xs text-brand-muted dark:text-brand-subtle">
                      {player.nation} • {player.league} • {player.club}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-muted dark:text-brand-subtle">
                    <span>{player.positions.join(" · ") || "Any"}</span>
                    {detail ? (
                      <span>
                        Chem {detail.total} (Club {detail.club} • League {detail.league} • Nation {detail.nation})
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="flex h-full flex-col gap-3 border border-border-light/70 bg-white/95 p-4 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
          <h3 className="text-sm font-semibold text-brand-strong dark:text-white">Requirement check</h3>
          <ul className="space-y-2 text-sm">
            {requirementStatus.length ? (
              requirementStatus.map(({ req, actual, passed }) => (
                <li
                  key={req.id}
                  className={cn(
                    "flex items-center justify-between rounded-brand px-3 py-2 text-sm",
                    passed
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-100"
                      : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-100"
                  )}
                >
                  <span className="font-medium">
                    {req.attribute}: {req.value}
                  </span>
                  <span>
                    {actual}/{req.minCount}
                  </span>
                </li>
              ))
            ) : (
              <li className="rounded-brand border border-border-light/70 bg-white/90 px-3 py-2 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-brand-subtle">
                No attribute constraints were added.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function matchesAttribute(player: Player, requirement: Requirement) {
  const value = requirement.value.trim().toLowerCase();
  switch (requirement.attribute) {
    case "nation":
      return player.nation.trim().toLowerCase() === value;
    case "league":
      return player.league.trim().toLowerCase() === value;
    case "club":
      return player.club.trim().toLowerCase() === value;
    case "quality":
      return (player.quality ?? "").trim().toLowerCase() === value;
    case "position":
      return player.positions.some((pos) => pos.trim().toLowerCase() === value);
    default:
      return false;
  }
}

function removeRequirement(id: string, setRequirements: Dispatch<SetStateAction<Requirement[]>>) {
  setRequirements((prev) => prev.filter((req) => req.id !== id));
}

function dedupePlayers(players: Player[]): Player[] {
  const seen = new Map<string, Player>();
  for (const player of players) {
    const key = [player.name, player.rating, player.nation, player.league, player.club, player.positions.join("|")].join("::");
    if (!seen.has(key)) {
      seen.set(key, player);
    }
  }
  return Array.from(seen.values());
}

function buildRosterSummary(players: Player[]) {
  if (!players.length) {
    return { average: 0, nations: [] as string[], leagues: [] as string[] };
  }
  const average = players.reduce((acc, player) => acc + player.rating, 0) / players.length;
  const nationCounts = countTop(players.map((player) => player.nation));
  const leagueCounts = countTop(players.map((player) => player.league));
  return {
    average,
    nations: nationCounts,
    leagues: leagueCounts,
  };
}

function countTop(values: string[], limit = 3) {
  const tally = new Map<string, number>();
  for (const value of values) {
    const key = value || "Unknown";
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => `${key} (${count})`);
}

function emptyPlayerForm(): PlayerFormState {
  return {
    name: "",
    rating: "",
    nation: "",
    league: "",
    club: "",
    quality: "",
    positions: "",
  };
}

function toPlayer(form: PlayerFormState): Player | null {
  const rating = Number(form.rating);
  if (!form.name.trim() || !Number.isFinite(rating)) return null;
  const positions = form.positions
    .split(",")
    .map((pos) => pos.trim().toUpperCase())
    .filter(Boolean);
  return {
    id: uid(),
    name: titleCase(form.name),
    rating: Math.round(rating),
    nation: titleCase(form.nation || ""),
    league: form.league.trim(),
    club: titleCase(form.club || ""),
    quality: form.quality.trim(),
    positions,
  };
}

function parseBulkPlayers(raw: string): Player[] {
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const players: Player[] = [];
  for (const line of lines) {
    const parts = line.split(/[,|]/).map((part) => part.trim());
    if (parts.length < 5) continue;
    const name = parts[0]!;
    const ratingRaw = parts[1]!;
    const nation = parts[2]!;
    const league = parts[3]!;
    const club = parts[4]!;
    const rest = parts.slice(5);
    const rating = Number(ratingRaw);
    if (!Number.isFinite(rating)) continue;
    const positions = rest.join(",")
      .split(/\s*\/|,\s*/)
      .map((pos) => pos.trim().toUpperCase())
      .filter(Boolean);
    players.push({
      id: uid(),
      name: titleCase(name),
      rating: Math.round(rating),
      nation: titleCase(nation),
      league,
      club: titleCase(club),
      quality: inferQualityFromRating(rating),
      positions,
    });
  }
  return players;
}

function inferQualityFromRating(rating: number) {
  if (rating >= 75) return "Gold";
  if (rating >= 65) return "Silver";
  return "Bronze";
}

function titleCase(value: string) {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) => word ? word[0]!.toUpperCase() + word.slice(1).toLowerCase() : "")
    .join(" ")
    .trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    return {
      players: Array.isArray(parsed.players) ? parsed.players : [],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      config: parsed.config ?? DEFAULT_CONFIG,
    };
  } catch (error) {
    console.error("Failed to load SBC state", error);
    return null;
  }
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to persist SBC state", error);
  }
}
