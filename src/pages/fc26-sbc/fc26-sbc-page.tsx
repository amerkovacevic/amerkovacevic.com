import { type ChangeEvent, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  ClipboardPaste,
  CloudUpload,
  RefreshCcw,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { Button, buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";

interface RawClubPayload {
  itemData?: RawEaPlayer[];
  items?: RawEaPlayer[];
  squad?: RawEaPlayer[];
}

interface RawEaPlayer {
  definitionId?: number | string;
  id?: number | string;
  resourceId?: number | string;
  rating?: number;
  preferredPosition?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
  commonName?: string;
  clubId?: number | string;
  leagueId?: number | string;
  nationId?: number | string;
  rareflag?: number;
  quality?: string;
}

interface TranslatorPayload {
  players?: Record<string, TranslatorPlayer>;
  clubs?: Record<string, string>;
  leagues?: Record<string, string>;
  nations?: Record<string, string>;
}

interface TranslatorPlayer {
  name?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  rating?: number;
}

interface ClubPlayer {
  id: string;
  name: string;
  rating: number;
  position: string;
  club: string;
  league: string;
  nation: string;
  rare: boolean;
}

interface Formation {
  id: string;
  label: string;
  slots: string[];
}

interface SbcRequirements {
  minOverall: number;
  minChemistry: number;
  squadSize: number;
  minLeagues: number;
  minNations: number;
  minClubs: number;
  requiredLeagues: string[];
  requiredNations: string[];
  requiredClubs: string[];
}

interface SquadEvaluation {
  averageRating: number;
  chemistryScore: number;
  uniqueLeagues: number;
  uniqueNations: number;
  uniqueClubs: number;
  meetsOverall: boolean;
  meetsChemistry: boolean;
  meetsSize: boolean;
  meetsLeagues: boolean;
  meetsNations: boolean;
  meetsClubs: boolean;
  missingLeagues: string[];
  missingNations: string[];
  missingClubs: string[];
}

const FORMATIONS: Formation[] = [
  {
    id: "433",
    label: "4-3-3 Attack",
    slots: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "ST", "RW"],
  },
  {
    id: "4231",
    label: "4-2-3-1 (2)",
    slots: ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "LW", "ST", "RW"],
  },
  {
    id: "352",
    label: "3-5-2",
    slots: ["GK", "CB", "CB", "CB", "LM", "CM", "CDM", "RM", "CAM", "ST", "ST"],
  },
];

const SAMPLE_CLUB_PAYLOAD: RawClubPayload = {
  itemData: [
    {
      definitionId: 123456,
      rating: 91,
      preferredPosition: "ST",
      firstName: "Kylian",
      lastName: "Mbappé",
      clubId: 73,
      leagueId: 16,
      nationId: 18,
      rareflag: 1,
    },
    {
      definitionId: 234567,
      rating: 88,
      preferredPosition: "LW",
      firstName: "Kingsley",
      lastName: "Coman",
      clubId: 21,
      leagueId: 19,
      nationId: 18,
      rareflag: 1,
    },
    {
      definitionId: 345678,
      rating: 90,
      preferredPosition: "GK",
      firstName: "Gianluigi",
      lastName: "Donnarumma",
      clubId: 73,
      leagueId: 16,
      nationId: 27,
      rareflag: 1,
    },
    {
      definitionId: 456789,
      rating: 89,
      preferredPosition: "CM",
      firstName: "Vitinha",
      clubId: 73,
      leagueId: 16,
      nationId: 38,
      rareflag: 1,
    },
    {
      definitionId: 567890,
      rating: 86,
      preferredPosition: "CB",
      firstName: "Marquinhos",
      clubId: 73,
      leagueId: 16,
      nationId: 54,
      rareflag: 1,
    },
    {
      definitionId: 678901,
      rating: 84,
      preferredPosition: "RB",
      firstName: "Achraf",
      lastName: "Hakimi",
      clubId: 73,
      leagueId: 16,
      nationId: 129,
      rareflag: 1,
    },
    {
      definitionId: 789012,
      rating: 82,
      preferredPosition: "LB",
      firstName: "Nuno",
      lastName: "Mendes",
      clubId: 73,
      leagueId: 16,
      nationId: 38,
      rareflag: 1,
    },
    {
      definitionId: 890123,
      rating: 83,
      preferredPosition: "CB",
      firstName: "Milan",
      lastName: "Škriniar",
      clubId: 73,
      leagueId: 16,
      nationId: 45,
      rareflag: 1,
    },
    {
      definitionId: 901234,
      rating: 85,
      preferredPosition: "CDM",
      firstName: "Manuel",
      lastName: "Ugarte",
      clubId: 73,
      leagueId: 16,
      nationId: 60,
      rareflag: 1,
    },
    {
      definitionId: 101112,
      rating: 84,
      preferredPosition: "CAM",
      firstName: "Lee",
      lastName: "Kang In",
      clubId: 73,
      leagueId: 16,
      nationId: 167,
      rareflag: 1,
    },
    {
      definitionId: 111213,
      rating: 83,
      preferredPosition: "RW",
      firstName: "Ousmane",
      lastName: "Dembélé",
      clubId: 73,
      leagueId: 16,
      nationId: 18,
      rareflag: 1,
    },
    {
      definitionId: 121314,
      rating: 81,
      preferredPosition: "ST",
      firstName: "Randal",
      lastName: "Kolo Muani",
      clubId: 73,
      leagueId: 16,
      nationId: 18,
      rareflag: 1,
    },
  ],
};

const SAMPLE_TRANSLATOR: TranslatorPayload = {
  players: {
    "123456": { name: "K. Mbappé", position: "ST", rating: 91 },
    "234567": { name: "K. Coman", position: "LW", rating: 88 },
    "345678": { name: "G. Donnarumma", position: "GK", rating: 90 },
    "456789": { name: "Vitinha", position: "CM", rating: 89 },
    "567890": { name: "Marquinhos", position: "CB", rating: 86 },
    "678901": { name: "A. Hakimi", position: "RB", rating: 84 },
    "789012": { name: "N. Mendes", position: "LB", rating: 82 },
    "890123": { name: "M. Škriniar", position: "CB", rating: 83 },
    "901234": { name: "M. Ugarte", position: "CDM", rating: 85 },
    "101112": { name: "Lee Kang In", position: "CAM", rating: 84 },
    "111213": { name: "O. Dembélé", position: "RW", rating: 83 },
    "121314": { name: "R. Kolo Muani", position: "ST", rating: 81 },
  },
  clubs: {
    "73": "Paris SG",
    "21": "FC Bayern München",
  },
  leagues: {
    "16": "Ligue 1 Uber Eats",
    "19": "Bundesliga",
  },
  nations: {
    "18": "France",
    "27": "Italy",
    "38": "Portugal",
    "45": "Slovakia",
    "54": "Brazil",
    "60": "Uruguay",
    "129": "Morocco",
    "167": "Korea Republic",
  },
};

const DEFAULT_REQUIREMENTS: SbcRequirements = {
  minOverall: 85,
  minChemistry: 27,
  squadSize: 11,
  minLeagues: 3,
  minNations: 4,
  minClubs: 3,
  requiredLeagues: ["Ligue 1 Uber Eats"],
  requiredNations: ["France"],
  requiredClubs: ["Paris SG"],
};

export default function Fc26SbcPage() {
  const [clubInput, setClubInput] = useState(() => JSON.stringify(SAMPLE_CLUB_PAYLOAD, null, 2));
  const [translatorInput, setTranslatorInput] = useState(() => JSON.stringify(SAMPLE_TRANSLATOR, null, 2));
  const [clubPlayers, setClubPlayers] = useState<ClubPlayer[]>(() =>
    mapClubPlayers(SAMPLE_CLUB_PAYLOAD, SAMPLE_TRANSLATOR)
  );
  const [requirements, setRequirements] = useState<SbcRequirements>(DEFAULT_REQUIREMENTS);
  const [formationId, setFormationId] = useState<string>(FORMATIONS[0]?.id ?? "433");
  const [importError, setImportError] = useState<string | null>(null);

  const formation = useMemo<Formation>(() => {
    if (!FORMATIONS.length) {
      throw new Error("At least one formation must be defined");
    }

    return FORMATIONS.find((item) => item.id === formationId) ?? FORMATIONS[0]!;
  }, [formationId]);

  const suggestedSquad = useMemo(
    () => buildSuggestedSquad(clubPlayers, formation),
    [clubPlayers, formation]
  );

  const evaluation = useMemo(
    () => evaluateSquad(suggestedSquad, requirements),
    [suggestedSquad, requirements]
  );

  const translatorStats = useMemo(() => summarizeTranslator(translatorInput), [translatorInput]);

  const handleImport = () => {
    setImportError(null);
    try {
      const parsedClub: RawClubPayload = JSON.parse(clubInput);
      const parsedTranslator: TranslatorPayload = translatorInput.trim()
        ? JSON.parse(translatorInput)
        : {};
      const mapped = mapClubPlayers(parsedClub, parsedTranslator);
      if (!mapped.length) {
        throw new Error("No players found in the provided payload");
      }
      setClubPlayers(mapped);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to parse payload");
    }
  };

  const handleReset = () => {
    setClubInput(JSON.stringify(SAMPLE_CLUB_PAYLOAD, null, 2));
    setTranslatorInput(JSON.stringify(SAMPLE_TRANSLATOR, null, 2));
    setClubPlayers(mapClubPlayers(SAMPLE_CLUB_PAYLOAD, SAMPLE_TRANSLATOR));
    setRequirements(DEFAULT_REQUIREMENTS);
    setImportError(null);
  };

  const cycleFormation = () => {
    if (!FORMATIONS.length) {
      return;
    }

    const currentIndex = FORMATIONS.findIndex((item) => item.id === formation.id);
    const nextFormation = FORMATIONS[(currentIndex + 1) % FORMATIONS.length] ?? FORMATIONS[0]!;
    setFormationId(nextFormation.id);
  };

  return (
    <div className="space-y-8">
      <PageHero
        icon={<Sparkles aria-hidden className="h-6 w-6" />}
        title="FC 26 SBC Squad Architect"
        description=
          "Import your Ultimate Team club data, map it with the EA translator feed, and prototype solutions for any Squad Building Challenge. This front-end sandbox mirrors the EasySBC experience while staying ready for custom solver logic."
        stats={
          <>
            <StatPill>Packet-first workflow</StatPill>
            <StatPill>Live requirement checks</StatPill>
            <StatPill>Formation-aware suggestions</StatPill>
          </>
        }
        actions={
          <>
            <Button onClick={handleReset} leftIcon={<RefreshCcw className="h-4 w-4" aria-hidden />}>Reload demo data</Button>
            <a
              href="https://www.easysbc.io"
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: "secondary", className: "gap-2" })}
            >
              <span className="inline-flex items-center">
                Explore EasySBC inspiration
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </span>
            </a>
          </>
        }
      />

      <PageSection
        title="Club import playground"
        description="Paste the network payloads from the web app, stitch them with the translator response, and preview the normalized squad list in seconds."
        actions={
          <Button onClick={handleImport} leftIcon={<CloudUpload className="h-4 w-4" aria-hidden />}>Apply payloads</Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <PayloadEditor
              label="Club payload"
              description="Drop the JSON blob from /ut/game/fifa24/club stock here."
              value={clubInput}
              onChange={setClubInput}
            />
            <PayloadEditor
              label="Translator payload"
              description="Paste the text from /ut/game/fifa24/translations. Leave blank to use raw IDs."
              value={translatorInput}
              onChange={setTranslatorInput}
              rows={12}
            />
            {importError ? (
              <p className="rounded-brand-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-300">
                {importError}
              </p>
            ) : null}
            <TranslatorSummary stats={translatorStats} />
          </div>
          <PlayerTable players={clubPlayers} />
        </div>
      </PageSection>

      <PageSection
        title="SBC requirements & solver sandbox"
        description="Tune formation, chemistry goals, and nation/league mixes. The lightweight heuristic solver picks the highest-rated club options while flagging gaps to fill."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setRequirements(DEFAULT_REQUIREMENTS)}
              leftIcon={<Target className="h-4 w-4" aria-hidden />}
            >
              Reset requirements
            </Button>
            <Button
              variant="secondary"
              onClick={cycleFormation}
              leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden />}
            >
              Try next shape
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <FormationSelector formations={FORMATIONS} activeId={formationId} onSelect={setFormationId} />
            <RequirementEditor requirements={requirements} onChange={setRequirements} />
          </div>
          <SquadPreview
            squad={suggestedSquad}
            formation={formation}
            evaluation={evaluation}
            requirements={requirements}
          />
        </div>
      </PageSection>

      <PageSection
        title="Roadmap to full parity"
        description="This UI is wired for real packet ingestion, translation, persistence, and advanced chemistry solving."
      >
        <ol className="space-y-4 text-sm text-brand-muted dark:text-brand-subtle">
          <li className="flex gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-strong dark:bg-brand/25 dark:text-white">
              1
            </span>
            <div>
              <p className="font-medium text-brand-strong dark:text-white">Capture scripts</p>
              <p>Ship a browser userscript or Node proxy that watches the EA web app network tab, extracts club + translation packets, and signs them for upload.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-strong dark:bg-brand/25 dark:text-white">
              2
            </span>
            <div>
              <p className="font-medium text-brand-strong dark:text-white">Backend normalization</p>
              <p>Persist each import, hydrate with live SBC metadata, and expose solver-ready squads via a secure API.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-strong dark:bg-brand/25 dark:text-white">
              3
            </span>
            <div>
              <p className="font-medium text-brand-strong dark:text-white">Optimized solving</p>
              <p>Replace the heuristic with chemistry-aware search that mirrors EasySBC suggestions while respecting custom club filters and price data.</p>
            </div>
          </li>
        </ol>
      </PageSection>
    </div>
  );
}

function PayloadEditor({
  label,
  description,
  value,
  onChange,
  rows = 14,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-brand-strong dark:text-white">
          <ClipboardPaste className="h-4 w-4" aria-hidden />
          {label}
        </div>
        <p className="text-xs text-brand-muted dark:text-brand-subtle">{description}</p>
      </div>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[160px] rounded-brand-lg border border-border-light/70 bg-white/90 px-4 py-3 font-mono text-xs text-brand-strong shadow-brand-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent dark:border-border-dark/60 dark:bg-surface-muted dark:text-brand-foreground"
        spellCheck={false}
      />
    </label>
  );
}

function TranslatorSummary({ stats }: { stats: TranslatorStats | null }) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-3 rounded-brand-lg border border-border-light/60 bg-surface/80 px-4 py-3 text-xs text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted/80 dark:text-brand-subtle sm:grid-cols-3">
      <div>
        <p className="font-semibold text-brand-strong dark:text-white">Translator snapshot</p>
        <p className="mt-1">Players: {stats.players}</p>
      </div>
      <div className="space-y-1">
        <p>Clubs: {stats.clubs}</p>
        <p>Leagues: {stats.leagues}</p>
      </div>
      <div className="space-y-1">
        <p>Nations: {stats.nations}</p>
        <p>Average player rating: {stats.averageRating.toFixed(1)}</p>
      </div>
    </div>
  );
}

function PlayerTable({ players }: { players: ClubPlayer[] }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-strong dark:text-brand-foreground">
          <Wand2 className="h-4 w-4" aria-hidden />
          Normalized roster ({players.length})
        </div>
        <span className="text-xs text-brand-muted dark:text-brand-subtle">Sorted by rating</span>
      </header>
      <div className="max-h-[520px] overflow-hidden rounded-brand-xl border border-border-light/70 shadow-brand-sm dark:border-border-dark/60">
        <table className="min-w-full divide-y divide-border-light/70 text-sm dark:divide-border-dark/60">
          <thead className="bg-surface/80 text-xs uppercase tracking-[0.18em] text-brand-muted dark:bg-surface-muted/60 dark:text-brand-subtle">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Player</th>
              <th scope="col" className="px-4 py-3 text-left">Pos</th>
              <th scope="col" className="px-4 py-3 text-left">Rating</th>
              <th scope="col" className="px-4 py-3 text-left">Club</th>
              <th scope="col" className="px-4 py-3 text-left">League</th>
              <th scope="col" className="px-4 py-3 text-left">Nation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light/60 bg-white/80 text-xs text-brand-strong dark:divide-border-dark/60 dark:bg-surface-muted/50 dark:text-brand-foreground">
            {players
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .map((player) => (
                <tr key={player.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand-strong dark:bg-brand/20">
                        {player.rating}
                      </span>
                      <span>{player.name}</span>
                      {player.rare ? (
                        <span className="rounded-full bg-yellow-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200">
                          Rare
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{player.position}</td>
                  <td className="px-4 py-3">{player.rating}</td>
                  <td className="px-4 py-3">{player.club}</td>
                  <td className="px-4 py-3">{player.league}</td>
                  <td className="px-4 py-3">{player.nation}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormationSelector({
  formations,
  activeId,
  onSelect,
}: {
  formations: Formation[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted dark:text-brand-subtle">Choose a formation</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {formations.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex flex-col gap-2 rounded-brand-xl border px-4 py-3 text-left text-sm shadow-brand-sm transition",
                "border-border-light/70 bg-white/90 hover:-translate-y-0.5 hover:border-brand/40 dark:border-border-dark/70 dark:bg-surface-muted/80",
                isActive &&
                  "border-brand bg-brand/10 text-brand-strong shadow-brand dark:border-brand/70 dark:bg-brand/20 dark:text-white"
              )}
            >
              <span className="font-semibold">{item.label}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted dark:text-brand-subtle">
                {item.slots.join(" · ")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RequirementEditor({
  requirements,
  onChange,
}: {
  requirements: SbcRequirements;
  onChange: (requirements: SbcRequirements) => void;
}) {
  const handleNumberChange = (field: keyof SbcRequirements) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value || 0);
    onChange({ ...requirements, [field]: value });
  };

  const handleListChange = (field: keyof SbcRequirements) => (event: ChangeEvent<HTMLInputElement>) => {
    const list = event.target.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({ ...requirements, [field]: list });
  };

  return (
    <div className="grid gap-4 rounded-brand-xl border border-border-light/70 bg-white/80 p-4 text-sm shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted/70">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-strong dark:text-brand-foreground">
        <Target className="h-4 w-4" aria-hidden />
        Challenge targets
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Min overall"
          value={requirements.minOverall}
          min={0}
          max={99}
          onChange={handleNumberChange("minOverall")}
        />
        <NumberField
          label="Min chemistry"
          value={requirements.minChemistry}
          min={0}
          max={33}
          onChange={handleNumberChange("minChemistry")}
        />
        <NumberField
          label="Squad size"
          value={requirements.squadSize}
          min={1}
          max={11}
          onChange={handleNumberChange("squadSize")}
        />
        <NumberField
          label="Unique leagues"
          value={requirements.minLeagues}
          min={0}
          max={11}
          onChange={handleNumberChange("minLeagues")}
        />
        <NumberField
          label="Unique nations"
          value={requirements.minNations}
          min={0}
          max={11}
          onChange={handleNumberChange("minNations")}
        />
        <NumberField
          label="Unique clubs"
          value={requirements.minClubs}
          min={0}
          max={11}
          onChange={handleNumberChange("minClubs")}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ListField
          label="Must include leagues"
          placeholder="e.g. Ligue 1, Premier League"
          value={requirements.requiredLeagues.join(", ")}
          onChange={handleListChange("requiredLeagues")}
        />
        <ListField
          label="Must include nations"
          placeholder="e.g. France, Brazil"
          value={requirements.requiredNations.join(", ")}
          onChange={handleListChange("requiredNations")}
        />
        <ListField
          label="Must include clubs"
          placeholder="e.g. PSG"
          value={requirements.requiredClubs.join(", ")}
          onChange={handleListChange("requiredClubs")}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand-muted dark:text-brand-subtle">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        className="h-11 rounded-brand-full border border-border-light/70 bg-white/90 px-4 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent dark:border-border-dark/60 dark:bg-surface-muted dark:text-brand-foreground"
      />
    </label>
  );
}

function ListField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand-muted dark:text-brand-subtle">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="h-11 rounded-brand-full border border-border-light/70 bg-white/90 px-4 text-sm text-brand-strong shadow-brand-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent dark:border-border-dark/60 dark:bg-surface-muted dark:text-brand-foreground"
      />
    </label>
  );
}

function SquadPreview({
  squad,
  formation,
  evaluation,
  requirements,
}: {
  squad: (ClubPlayer | null)[];
  formation: Formation;
  evaluation: SquadEvaluation;
  requirements: SbcRequirements;
}) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-brand-xl border border-border-light/70 bg-surface/75 p-5 shadow-brand-sm dark:border-border-dark/70 dark:bg-surface-muted/70">
      <header className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-brand-strong dark:text-white">Suggested XI – {formation.label}</span>
        <span className="text-xs text-brand-muted dark:text-brand-subtle">
          Picks highest rated players per slot, then fills gaps with best available overall.
        </span>
      </header>
      <div className="grid gap-3 text-sm">
        {formation.slots.map((slot, index) => {
          const player = squad[index];
          return (
            <div
              key={`${slot}-${index}`}
              className="flex items-center justify-between rounded-brand-lg border border-border-light/60 bg-white/85 px-3 py-2 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted/80"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong dark:bg-brand/20 dark:text-white">
                  {slot}
                </span>
                {player ? (
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium text-brand-strong dark:text-white">{player.name}</span>
                    <span className="text-xs text-brand-muted dark:text-brand-subtle">
                      {player.club} • {player.nation}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-brand-muted dark:text-brand-subtle">No match in club</span>
                )}
              </div>
              {player ? (
                <span className="text-xs font-semibold text-brand-strong dark:text-brand-foreground">{player.rating}</span>
              ) : (
                <span className="text-xs font-medium text-red-500">Missing</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 text-xs text-brand-muted dark:text-brand-subtle">
        <RequirementStatus
          label="Average rating"
          value={evaluation.averageRating.toFixed(1)}
          requirement={`≥ ${requirements.minOverall}`}
          met={evaluation.meetsOverall}
        />
        <RequirementStatus
          label="Chemistry score"
          value={evaluation.chemistryScore.toFixed(0)}
          requirement={`≥ ${requirements.minChemistry}`}
          met={evaluation.meetsChemistry}
        />
        <RequirementStatus
          label="Squad size"
          value={`${squad.filter(Boolean).length}/${requirements.squadSize}`}
          requirement="Must hit target"
          met={evaluation.meetsSize}
        />
        <RequirementStatus
          label="Unique leagues"
          value={`${evaluation.uniqueLeagues}`}
          requirement={`≥ ${requirements.minLeagues}`}
          met={evaluation.meetsLeagues}
          missing={evaluation.missingLeagues}
        />
        <RequirementStatus
          label="Unique nations"
          value={`${evaluation.uniqueNations}`}
          requirement={`≥ ${requirements.minNations}`}
          met={evaluation.meetsNations}
          missing={evaluation.missingNations}
        />
        <RequirementStatus
          label="Unique clubs"
          value={`${evaluation.uniqueClubs}`}
          requirement={`≥ ${requirements.minClubs}`}
          met={evaluation.meetsClubs}
          missing={evaluation.missingClubs}
        />
      </div>
    </div>
  );
}

function RequirementStatus({
  label,
  value,
  requirement,
  met,
  missing,
}: {
  label: string;
  value: string;
  requirement: string;
  met: boolean;
  missing?: string[];
}) {
  return (
    <div className="flex flex-col gap-1 rounded-brand-lg border border-border-light/50 bg-white/85 px-3 py-2 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted/80">
      <div className="flex items-center justify-between text-xs font-semibold text-brand-strong dark:text-brand-foreground">
        <span>{label}</span>
        {met ? (
          <span className="inline-flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Met
          </span>
        ) : (
          <span className="text-red-500">Needs work</span>
        )}
      </div>
      <div className="text-xs text-brand-muted dark:text-brand-subtle">
        <span className="font-medium text-brand-strong/80 dark:text-brand-foreground/70">{value}</span> vs {requirement}
      </div>
      {!met && missing && missing.length ? (
        <div className="text-[11px] text-brand-muted dark:text-brand-subtle">Missing: {missing.join(", ")}</div>
      ) : null}
    </div>
  );
}

function mapClubPlayers(payload: RawClubPayload, translator: TranslatorPayload): ClubPlayer[] {
  const rawPlayers: RawEaPlayer[] = Array.isArray(payload)
    ? (payload as unknown as RawEaPlayer[])
    : payload.itemData ?? payload.items ?? payload.squad ?? [];

  return rawPlayers
    .map((player) => normalizePlayer(player, translator))
    .filter((player): player is ClubPlayer => Boolean(player));
}

function normalizePlayer(raw: RawEaPlayer, translator: TranslatorPayload): ClubPlayer | null {
  const id = String(raw.definitionId ?? raw.resourceId ?? raw.id ?? "");
  if (!id) {
    return null;
  }

  const translation = translator.players?.[id];

  const rating = raw.rating ?? translation?.rating ?? 0;
  const position = (raw.preferredPosition ?? raw.position ?? translation?.position ?? "").toUpperCase();

  const firstName = raw.firstName ?? translation?.firstName ?? "";
  const lastName = raw.lastName ?? translation?.lastName ?? "";
  const nameFromPayload = [firstName, lastName].filter(Boolean).join(" ");

  const translationName = translation?.name
    ? translation.name
    : [translation?.firstName, translation?.lastName].filter(Boolean).join(" ");

  const clubId = raw.clubId ? String(raw.clubId) : undefined;
  const leagueId = raw.leagueId ? String(raw.leagueId) : undefined;
  const nationId = raw.nationId ? String(raw.nationId) : undefined;

  return {
    id,
    name: translationName?.trim().length ? translationName : nameFromPayload || `Player ${id}`,
    rating,
    position: position || "--",
    club: clubId ? translator.clubs?.[clubId] ?? `Club ${clubId}` : "Unknown club",
    league: leagueId ? translator.leagues?.[leagueId] ?? `League ${leagueId}` : "Unknown league",
    nation: nationId ? translator.nations?.[nationId] ?? `Nation ${nationId}` : "Unknown nation",
    rare: Boolean(raw.rareflag) || raw.quality === "rare",
  };
}

function buildSuggestedSquad(players: ClubPlayer[], formation: Formation): (ClubPlayer | null)[] {
  if (!formation) {
    return [];
  }

  const remaining = players.slice().sort((a, b) => b.rating - a.rating);
  const squad: (ClubPlayer | null)[] = formation.slots.map(() => null);

  formation.slots.forEach((slot, index) => {
    const slotUpper = slot.toUpperCase();
    const exactIndex = remaining.findIndex((player) => player.position === slotUpper);

    if (exactIndex !== -1) {
      const candidate = remaining.splice(exactIndex, 1)[0] ?? null;
      squad[index] = candidate;
      return;
    }

    const anchor = slotUpper.charAt(0);
    const partialIndex = anchor
      ? remaining.findIndex((player) => player.position.startsWith(anchor))
      : -1;
    if (partialIndex !== -1) {
      const candidate = remaining.splice(partialIndex, 1)[0] ?? null;
      squad[index] = candidate;
      return;
    }

    if (remaining.length) {
      squad[index] = remaining.shift() ?? null;
    }
  });

  return squad.map((player) => player ?? null);
}

function evaluateSquad(squad: (ClubPlayer | null)[], requirements: SbcRequirements): SquadEvaluation {
  const filled = squad.filter(Boolean) as ClubPlayer[];
  const totalRating = filled.reduce((total, player) => total + player.rating, 0);
  const averageRating = filled.length ? totalRating / filled.length : 0;

  const chemistryScore = calculateChemistry(filled);

  const uniqueLeagues = new Set(filled.map((player) => player.league)).size;
  const uniqueNations = new Set(filled.map((player) => player.nation)).size;
  const uniqueClubs = new Set(filled.map((player) => player.club)).size;

  const meetsOverall = averageRating >= requirements.minOverall;
  const meetsChemistry = chemistryScore >= requirements.minChemistry;
  const meetsSize = filled.length >= requirements.squadSize;
  const meetsLeagues = uniqueLeagues >= requirements.minLeagues;
  const meetsNations = uniqueNations >= requirements.minNations;
  const meetsClubs = uniqueClubs >= requirements.minClubs;

  const missingLeagues = requirements.requiredLeagues.filter((league) => !filled.some((player) => player.league === league));
  const missingNations = requirements.requiredNations.filter((nation) => !filled.some((player) => player.nation === nation));
  const missingClubs = requirements.requiredClubs.filter((club) => !filled.some((player) => player.club === club));

  return {
    averageRating,
    chemistryScore,
    uniqueLeagues,
    uniqueNations,
    uniqueClubs,
    meetsOverall,
    meetsChemistry,
    meetsSize,
    meetsLeagues,
    meetsNations,
    meetsClubs,
    missingLeagues,
    missingNations,
    missingClubs,
  };
}

function calculateChemistry(players: ClubPlayer[]): number {
  if (!players.length) {
    return 0;
  }

  const clubCounts = countOccurrences(players.map((player) => player.club));
  const leagueCounts = countOccurrences(players.map((player) => player.league));
  const nationCounts = countOccurrences(players.map((player) => player.nation));

  return players.reduce((score, player) => {
    const base = 1;
    const clubBonus = Math.min(2, Math.max(0, (clubCounts[player.club] ?? 0) - 1));
    const leagueBonus = Math.min(2, Math.max(0, (leagueCounts[player.league] ?? 0) - 1));
    const nationBonus = Math.min(1, Math.max(0, (nationCounts[player.nation] ?? 0) - 1));
    return score + Math.min(3, base + clubBonus + leagueBonus + nationBonus);
  }, 0);
}

function countOccurrences(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

interface TranslatorStats {
  players: number;
  clubs: number;
  leagues: number;
  nations: number;
  averageRating: number;
}

function summarizeTranslator(input: string): TranslatorStats | null {
  if (!input.trim()) {
    return null;
  }

  try {
    const parsed: TranslatorPayload = JSON.parse(input);
    const players = parsed.players ? Object.keys(parsed.players).length : 0;
    const averageRating = parsed.players
      ? Object.values(parsed.players).reduce((total, player) => total + (player.rating ?? 0), 0) /
        Math.max(1, players)
      : 0;

    return {
      players,
      clubs: parsed.clubs ? Object.keys(parsed.clubs).length : 0,
      leagues: parsed.leagues ? Object.keys(parsed.leagues).length : 0,
      nations: parsed.nations ? Object.keys(parsed.nations).length : 0,
      averageRating,
    };
  } catch {
    return null;
  }
}
