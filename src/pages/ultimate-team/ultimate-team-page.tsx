import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";

const HERO_STATS = [
  "Live squad syncing",
  "Chemistry coach",
  "Objective tracker",
] as const;

const FORMATION_ROWS = [
  [
    {
      id: "gk",
      name: "Courtois",
      position: "GK",
      role: "Sweeper keeper",
      rating: 91,
      accent: "from-emerald-300/60 to-emerald-500/50",
    },
  ],
  [
    {
      id: "lb",
      name: "Davies",
      position: "LB",
      role: "Overlap",
      rating: 90,
      accent: "from-sky-300/50 to-sky-500/50",
    },
    {
      id: "lcb",
      name: "van Dijk",
      position: "CB",
      role: "Stopper",
      rating: 92,
      accent: "from-slate-200/60 to-slate-400/60",
    },
    {
      id: "rcb",
      name: "Rüdiger",
      position: "CB",
      role: "Anchor",
      rating: 90,
      accent: "from-slate-200/60 to-slate-400/60",
    },
    {
      id: "rb",
      name: "Hakimi",
      position: "RB",
      role: "Inverted",
      rating: 89,
      accent: "from-sky-300/50 to-sky-500/50",
    },
  ],
  [
    {
      id: "cdm",
      name: "Rodri",
      position: "CDM",
      role: "Deep pivot",
      rating: 92,
      accent: "from-amber-300/60 to-amber-500/50",
    },
    {
      id: "lcm",
      name: "Bellingham",
      position: "CM",
      role: "Box-to-box",
      rating: 91,
      accent: "from-violet-300/50 to-violet-500/50",
    },
    {
      id: "rcm",
      name: "De Bruyne",
      position: "CM",
      role: "Playmaker",
      rating: 93,
      accent: "from-violet-300/50 to-violet-500/50",
    },
  ],
  [
    {
      id: "lw",
      name: "Viní Jr.",
      position: "LW",
      role: "Touchline",
      rating: 92,
      accent: "from-rose-300/50 to-rose-500/50",
    },
    {
      id: "cf",
      name: "Messi",
      position: "CF",
      role: "False nine",
      rating: 94,
      accent: "from-amber-200/60 to-amber-500/50",
    },
    {
      id: "rw",
      name: "Salah",
      position: "RW",
      role: "Inside forward",
      rating: 91,
      accent: "from-rose-300/50 to-rose-500/50",
    },
  ],
];

const FEATURE_CALLOUTS = [
  {
    title: "Drag-and-drop positions",
    description:
      "Move players between roles, preview chemistry arrows, and auto-balance stamina load-outs before locking in your squad.",
  },
  {
    title: "Dynamic attribute spotlight",
    description:
      "See boosted stats in context with live form, modifiers, and playable chem styles calculated in real time.",
  },
  {
    title: "Scenario presets",
    description:
      "Snapshot Weekend League, Rivals, or SBC variants and swap between them instantly before kickoff.",
  },
] as const;

const NETWORK_NODES = [
  { id: "gk", x: 50, y: 250, label: "Courtois", chem: 3 },
  { id: "cb1", x: 110, y: 170, label: "van Dijk", chem: 3 },
  { id: "cb2", x: 190, y: 170, label: "Rüdiger", chem: 3 },
  { id: "lb", x: 40, y: 150, label: "Davies", chem: 2 },
  { id: "rb", x: 260, y: 150, label: "Hakimi", chem: 2 },
  { id: "cm1", x: 110, y: 100, label: "Bellingham", chem: 3 },
  { id: "cm2", x: 190, y: 100, label: "De Bruyne", chem: 3 },
  { id: "cdm", x: 150, y: 130, label: "Rodri", chem: 3 },
  { id: "lw", x: 60, y: 70, label: "Viní Jr.", chem: 2 },
  { id: "rw", x: 240, y: 70, label: "Salah", chem: 2 },
  { id: "cf", x: 150, y: 50, label: "Messi", chem: 3 },
] as const;

const NETWORK_LINKS = [
  ["gk", "cb1"],
  ["gk", "cb2"],
  ["cb1", "lb"],
  ["cb1", "cm1"],
  ["cb2", "rb"],
  ["cb2", "cm2"],
  ["cm1", "cdm"],
  ["cm2", "cdm"],
  ["cm1", "lw"],
  ["cm2", "rw"],
  ["cdm", "cf"],
  ["lw", "cf"],
  ["rw", "cf"],
] as const;

const SERVICE_HIGHLIGHTS = [
  {
    heading: "Team of the Week pulse",
    body: "Automatic refreshes every Thursday with chem breakpoints, quick compare, and tradeable market deltas.",
  },
  {
    heading: "Objective planner",
    body: "Track XP ladders, milestone progress, and earnable packs with deadline reminders synced to your calendar.",
  },
  {
    heading: "Transfer radar",
    body: "Pin watchlist targets, receive bid alerts, and forecast SBC fodder swings in one glanceable dashboard.",
  },
];

const ROADMAP_ITEMS = [
  {
    label: "November",
    detail: "Co-op squad session sharing with live cursor presence.",
  },
  {
    label: "December",
    detail: "AI-generated custom tactics tuned from your match history.",
  },
  {
    label: "January",
    detail: "Mobile companion with offline squad drafting and chem alerts.",
  },
] as const;

type FormationRow = (typeof FORMATION_ROWS)[number];

type FormationPlayer = FormationRow[number];

export default function UltimateTeamPage() {
  return (
    <div className="space-y-8">
      <PageHero
        align="center"
        icon="⭐️"
        title="Ultimate Team Utility"
        description="Build, analyze, and celebrate your dream squad with a pitch-side control center crafted for obsessive FUT managers."
        actions={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="https://forms.gle/6H3Py7JAnBetaDemo"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: "lg" })}
            >
              Join the beta waitlist
            </a>
            <a
              href="#roadmap"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              View roadmap
            </a>
          </div>
        }
        stats={HERO_STATS.map((stat) => (
          <StatPill key={stat}>{stat}</StatPill>
        ))}
      />

      <PageSection
        title="Squad architect"
        description="Experiment with elite chem combinations, swap chem styles, and visualise your XI with a living tactical board."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <PitchPreview rows={FORMATION_ROWS} />
          <div className="space-y-4">
            {FEATURE_CALLOUTS.map((item) => (
              <FeatureCallout key={item.title} title={item.title} description={item.description} />
            ))}
            <div className="rounded-3xl border border-brand/20 bg-brand/5 p-5 text-sm text-brand-strong/80 shadow-brand-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80">
              Save unlimited squad blueprints, set preferred chemistry thresholds, and export directly into the FUT web app when the
              integration launches.
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Chemistry intelligence"
        description="Understand how every link strengthens your starting XI with an interactive network overlay and smart nudges."
        contentClassName="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border-light/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-brand-sm dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
            <div className="absolute -left-10 top-16 h-32 w-32 rounded-full bg-emerald-500/40 blur-[120px]" />
            <div className="absolute bottom-10 right-0 h-40 w-40 rounded-full bg-sky-500/40 blur-[130px]" />
          </div>
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-wide">Link strength map</h3>
                <p className="text-sm text-white/80">
                  Hover nodes in-app to spotlight nationality, league, and club affinities. The preview below simulates a perfect 33/33
                  chemistry build.
                </p>
              </div>
              <div className="flex gap-2">
                <LegendChip label="Strong" color="bg-emerald-400/80" />
                <LegendChip label="Club" color="bg-sky-400/80" />
                <LegendChip label="Hybrid" color="bg-amber-400/80" />
              </div>
            </div>
            <div className="relative isolate mx-auto w-full max-w-md">
              <div className="absolute inset-0 -z-10 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl" aria-hidden />
              <ChemistryNetwork />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <InsightCard
            title="Auto-solve weak links"
            description="Get instant swap suggestions that respect league restrictions, price caps, and untradeable slots."
          />
          <InsightCard
            title="Chem milestones"
            description="Track progression for Evolutions, seasonal swaps, and manager tasks with alert thresholds you control."
          />
          <InsightCard
            title="Friend compare"
            description="Drop in a friend’s shared squad code and see exactly where your chemistry edges their build."
          />
        </div>
      </PageSection>

      <div id="roadmap">
        <PageSection
          title="Live service companion"
          description="Everything you need for content drops, objectives, and market swings in one responsive workspace."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {SERVICE_HIGHLIGHTS.map((item) => (
              <ServiceCard key={item.heading} heading={item.heading} body={item.body} />
            ))}
          </div>
          <div className="mt-6 grid gap-4 rounded-[2rem] border border-border-light/70 bg-surface/80 p-6 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/70">
            <h3 className="text-base font-semibold text-brand-strong dark:text-brand-foreground">Roadmap</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {ROADMAP_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border-light/70 bg-gradient-to-br from-brand/5 via-transparent to-brand-accent/10 p-4 text-sm shadow-brand-sm dark:border-border-dark/60 dark:from-brand/10 dark:to-brand-accent/20"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted dark:text-white/70">{item.label}</p>
                  <p className="mt-2 text-brand-strong dark:text-brand-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-brand-muted dark:text-white/70">
              Early access members vote on priorities monthly. Suggest your dream automation and we will build in public.
            </p>
          </div>
        </PageSection>
      </div>
    </div>
  );
}

function PitchPreview({ rows }: { rows: typeof FORMATION_ROWS }) {
  return (
    <div className="relative overflow-hidden rounded-[2.75rem] border border-border-light/70 bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-6 text-white shadow-brand-sm dark:border-border-dark/60">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-4 rounded-[2.5rem] border border-white/20" />
        <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-white/30" />
        <div className="absolute inset-x-8 top-8 h-36 rounded-full border border-white/20" />
        <div className="absolute inset-x-8 bottom-8 h-36 rounded-full border border-white/20" />
      </div>
      <div className="relative flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Featured tactic</p>
            <h3 className="text-xl font-semibold">4-3-3 (False 9)</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1">Overall 92</span>
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">33/33 Chem</span>
          </div>
        </header>
        <div className="flex-1">
          <div className="relative mx-auto grid h-full max-h-[540px] grid-rows-4 gap-y-6">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-start justify-center gap-4">
                {row.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: FormationPlayer }) {
  return (
    <div className="flex w-[110px] flex-col items-center gap-2 text-center text-xs">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl border border-white/25 bg-white/10 p-3 shadow-lg backdrop-blur", 
          "transition-transform duration-200 hover:-translate-y-1"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80" aria-hidden />
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", player.accent)} aria-hidden />
        <div className="relative flex flex-col items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">{player.position}</span>
          <p className="text-sm font-semibold">{player.name}</p>
          <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold">{player.rating}</span>
        </div>
      </div>
      <p className="text-[11px] text-white/70">{player.role}</p>
    </div>
  );
}

function FeatureCallout({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-border-light/70 bg-surface/80 p-5 text-sm shadow-brand-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-border-dark/60 dark:bg-surface-overlayDark/70">
      <h3 className="text-base font-semibold text-brand-strong dark:text-brand-foreground">{title}</h3>
      <p className="mt-2 text-brand-muted dark:text-white/70">{description}</p>
    </div>
  );
}

function ChemistryNetwork() {
  return (
    <svg viewBox="0 0 300 300" className="w-full">
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
        </radialGradient>
      </defs>
      {NETWORK_LINKS.map(([from, to]) => {
        const start = NETWORK_NODES.find((n) => n.id === from)!;
        const end = NETWORK_NODES.find((n) => n.id === to)!;
        return (
          <line
            key={`${from}-${to}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(125,211,252,0.55)"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        );
      })}
      {NETWORK_NODES.map((node) => (
        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
          <circle r={18} fill="url(#nodeGlow)" />
          <circle r={14} fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          <text
            y={4}
            textAnchor="middle"
            fontSize="9"
            fill="white"
            fontWeight={600}
          >
            {node.chem}★
          </text>
          <text
            y={30}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.8)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LegendChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} aria-hidden />
      {label}
    </span>
  );
}

function InsightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-border-light/70 bg-surface/80 p-6 text-sm shadow-brand-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-border-dark/60 dark:bg-surface-overlayDark/70">
      <h3 className="text-base font-semibold text-brand-strong dark:text-brand-foreground">{title}</h3>
      <p className="mt-2 text-brand-muted dark:text-white/70">{description}</p>
    </div>
  );
}

function ServiceCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-border-light/70 bg-surface/80 p-6 shadow-brand-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-border-dark/60 dark:bg-surface-overlayDark/70">
      <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{heading}</h3>
      <p className="mt-3 text-sm text-brand-muted dark:text-white/70">{body}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-muted/80 dark:text-white/60">
        <span className="inline-flex h-2 w-2 rounded-full bg-brand" aria-hidden />
        Always-on feed
      </div>
    </div>
  );
}
