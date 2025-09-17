import { useMemo, useState } from "react";
import data from "../../data/clubs.json";

/** clubs.json shape */
type Team = {
  id: string;
  name: string;
  nation: string;
  league: string;
  rep?: number;
  source?: string;
};

const TEAMS: Team[] = Array.isArray((data as any)?.clubs)
  ? ((data as any).clubs as Team[])
  : [];

type DrawRow = { id: string; name: string; team?: Team; locked?: boolean };

export default function FMTeamDraw() {
  // Inputs/list
  const [bulkNames, setBulkNames] = useState("");
  const [list, setList] = useState<DrawRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Suspense / animation
  const [isDrawing, setIsDrawing] = useState(false);
  const [rolling, setRolling] = useState<Record<string, string>>({}); // rowId -> temp rolling text

  // Filters
  const leagues = useMemo(
    () => Array.from(new Set(TEAMS.map((t) => t.league))).sort(),
    []
  );
  const nations = useMemo(
    () => Array.from(new Set(TEAMS.map((t) => t.nation))).sort(),
    []
  );

  const [selLeagues, setSelLeagues] = useState<string[]>([]);
  const [selNations, setSelNations] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const pool = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEAMS.filter((t) => {
      if (selLeagues.length && !selLeagues.includes(t.league)) return false;
      if (selNations.length && !selNations.includes(t.nation)) return false;
      if (q) {
        const hay = `${t.name} ${t.league} ${t.nation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selLeagues, selNations, search]);

  // helpers
  function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }
  function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]!; }

  const addNames = () => {
    const names = bulkNames
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return;
    setList((prev) => [...prev, ...names.map((n) => ({ id: uid(), name: n }))]);
    setBulkNames("");
  };

  const removeRow = (id: string) => setList((cur) => cur.filter((r) => r.id !== id));
  const toggleLock = (id: string) =>
    setList((cur) => cur.map((r) => (r.id === id ? { ...r, locked: !r.locked } : r)));

  // UNIQUE assignments w/ suspense reveal
  const assign = async () => {
    if (isDrawing) return;
    setErr(null);

    const unlocked = list.filter((r) => !r.locked);
    if (!unlocked.length) return;

    // Exclude teams already taken by locked rows
    const taken = new Set(list.filter((r) => r.locked && r.team).map((r) => r.team!.id));
    const available = pool.filter((t) => !taken.has(t.id));

    if (available.length < unlocked.length) {
      setErr(
        "Not enough teams in the current pool for unique assignments. Relax filters or remove some locked entries."
      );
      return;
    }

    const shuffledPeople = shuffle(unlocked);
    const shuffledTeams = shuffle(available).slice(0, unlocked.length);

    // Build final assignment map
    const finalMap = new Map<string, Team>();
    for (let i = 0; i < shuffledPeople.length; i++) {
      finalMap.set(shuffledPeople[i]!.id, shuffledTeams[i]!);
    }

    // Suspense animation: reveal one-by-one
    setIsDrawing(true);
    try {
      for (const person of shuffledPeople) {
        const endTime = Date.now() + 1000 + Math.random() * 400; // 1.0–1.4s roll
        while (Date.now() < endTime) {
          setRolling((r) => ({ ...r, [person.id]: pick(available).name }));
          await delay(60);
        }
        const t = finalMap.get(person.id)!;
        setList((cur) =>
          cur.map((row) => (row.id === person.id && !row.locked ? { ...row, team: t } : row))
        );
        await delay(120);
        setRolling((r) => {
          const { [person.id]: _gone, ...rest } = r;
          return rest;
        });
        await delay(120);
      }

      // tiny celebratory burst
      confettiBurst();
    } finally {
      setIsDrawing(false);
    }
  };

  const clearTeams = () =>
    setList((cur) => cur.map((r) => ({ ...r, team: undefined, locked: false })));

  const copyResults = async () => {
    const lines = list.map((r) =>
      `${r.name}${r.team ? ` → ${r.team.name} (${r.team.league}, ${r.team.nation})` : ""}`
    );
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  const datasetDate =
    "meta" in (data as any) && (data as any).meta?.scrapedAt
      ? new Date((data as any).meta.scrapedAt).toLocaleDateString()
      : null;

  return (
    <div className="space-y-5">
      {/* Hero w/ brand gradient */}
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-dark via-brand to-brand-light text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-20 blur-2xl w-56 h-56 rounded-full bg-white/30" />
        <div className="absolute -left-16 -bottom-16 opacity-10 blur-2xl w-64 h-64 rounded-full bg-white/40" />

        <div className="flex flex-wrap items-end justify-between gap-4 relative">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              🎮 FM Team Draw
            </h1>
            <p className="mt-2 text-white/90">
              Paste names, filter by nation/league, and assign teams fairly.{" "}
              <span className="opacity-90">
                {TEAMS.length.toLocaleString()} teams loaded
                {datasetDate ? ` · updated ${datasetDate}` : ""}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge>Leagues: {new Set(TEAMS.map((t) => t.league)).size}</Badge>
            <Badge>Countries: {new Set(TEAMS.map((t) => t.nation)).size}</Badge>
            <Badge tone="solid">Pool: {pool.length}/{TEAMS.length}</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr_0.9fr]">
        {/* Names & Assignments */}
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <SectionTitle>Participants</SectionTitle>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <textarea
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder="Enter names (comma or newline separated)"
              className="w-full h-28 border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              onClick={addNames}
              className="h-10 md:h-auto px-4 py-2 rounded-xl bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand disabled:opacity-40"
              disabled={!bulkNames.trim() || isDrawing}
              title="Add names to the list"
            >
              Add
            </button>
          </div>

          {list.length === 0 ? (
            <EmptyState text="No participants yet. Add some names to get started." />
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total participants: <b>{list.length}</b>
                </div>
                <div className="flex gap-2">
                  {list.some((r) => r.team) && (
                    <>
                      <button onClick={copyResults} className="Btn ghost" disabled={isDrawing}>
                        Copy results
                      </button>
                      <button onClick={clearTeams} className="Btn ghost" disabled={isDrawing}>
                        Clear teams
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ul className="mt-3 divide-y dark:divide-gray-800 rounded-xl border dark:border-gray-800 overflow-hidden">
                {list.map((r) => (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md transition-colors ${
                      rolling[r.id]
                        ? "bg-brand/5 dark:bg-brand-dark/30"
                        : "bg-white/60 dark:bg-gray-950/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {rolling[r.id] ? (
                          <span className="animate-pulse">
                            {rolling[r.id]} <span className="opacity-60">• rolling…</span>
                          </span>
                        ) : r.team ? (
                          <>
                            {r.team.name} — {r.team.league} ({r.team.nation})
                          </>
                        ) : (
                          "No team assigned"
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleLock(r.id)}
                        disabled={isDrawing}
                        className={`px-2 py-1 rounded-lg text-xs border ${
                          r.locked
                            ? "bg-brand/10 border-brand text-brand dark:bg-brand-dark/50 dark:text-white dark:border-brand-dark"
                            : "hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                        title="Lock this assignment when re-rolling"
                      >
                        {r.locked ? "Locked" : "Lock"}
                      </button>
                      <button
                        onClick={() => removeRow(r.id)}
                        disabled={isDrawing}
                        className="px-2 py-1 rounded-lg text-xs border hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Remove participant"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Filters (sticky) */}
        <div className="md:sticky md:top-4 h-fit rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <SectionTitle>Filters</SectionTitle>

          <div className="relative mt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team / league / nation…"
              className="w-full border rounded-xl pl-9 pr-3 py-2 dark:bg-gray-950 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
              disabled={isDrawing}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Leagues
            </div>
            <ChipList
              items={leagues}
              selected={selLeagues}
              onToggle={(lg) =>
                setSelLeagues((cur) =>
                  cur.includes(lg) ? cur.filter((x) => x !== lg) : [...cur, lg]
                )
              }
              disabled={isDrawing}
              emptyText="No leagues"
            />
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nations
            </div>
            <ChipList
              items={nations}
              selected={selNations}
              onToggle={(na) =>
                setSelNations((cur) =>
                  cur.includes(na) ? cur.filter((x) => x !== na) : [...cur, na]
                )
              }
              disabled={isDrawing}
              emptyText="No nations"
            />
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Pool size: <b>{pool.length}</b> (of {TEAMS.length})
          </div>
        </div>

        {/* Actions */}
        <div className="md:sticky md:top-4 h-fit rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4 md:p-5">
          <SectionTitle>Assign</SectionTitle>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Assigns teams from the current pool (unique teams only). Re-run to shuffle unlocked entries.
          </p>

          {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

          <div className="mt-4 flex flex-col gap-2">
            <button
              className="Btn primary"
              onClick={assign}
              disabled={isDrawing || list.length === 0 || pool.length === 0}
              title={
                list.length === 0
                  ? "Add participants first"
                  : pool.length === 0
                  ? "No teams in pool"
                  : isDrawing
                  ? "Drawing…"
                  : "Assign teams"
              }
            >
              {isDrawing ? "⏳ Drawing…" : "🎲 Assign teams"}
            </button>
            <button
              className="Btn secondary"
              onClick={clearTeams}
              disabled={isDrawing || !list.some((r) => r.team)}
            >
              Reset assignments
            </button>
          </div>

          {"meta" in (data as any) && (
            <div className="mt-5 text-[11px] text-gray-500">
              Dataset: {(data as any).meta?.source || "local"} · {datasetDate || "unknown date"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide">{children}</h2>
    </div>
  );
}

function Badge({
  children,
  tone = "outline",
}: {
  children: React.ReactNode;
  tone?: "outline" | "solid";
}) {
  const cls =
    tone === "solid"
      ? "bg-brand-light text-white dark:bg-brand-dark"
      : "bg-white/20 text-white border border-white/30";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed dark:border-gray-800 p-6 text-center">
      <div className="text-3xl">📝</div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{text}</div>
    </div>
  );
}

function ChipList({
  items,
  selected,
  onToggle,
  emptyText,
  disabled,
}: {
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyText?: string;
  disabled?: boolean;
}) {
  if (!items.length) {
    return <div className="text-xs text-gray-500">{emptyText || "—"}</div>;
  }
  return (
    <div className="flex flex-wrap gap-2 max-h-44 overflow-auto pr-1">
      {items.map((it) => {
        const active = selected.includes(it);
        return (
          <button
  key={it}
  onClick={() => onToggle(it)}
  disabled={disabled}
  className={`px-2.5 py-1 rounded-full text-xs border font-medium transition
    ${active
      // Selected: strong contrast in both themes
      ? "bg-brand-light text-white border-brand-light " +                 // light mode
        "dark:bg-white dark:text-gray-900 dark:border-white " +           // dark mode pill goes light
        "dark:ring-2 dark:ring-brand/60 dark:shadow-sm"
      // Unselected
      : "border-gray-200 hover:bg-brand/5 dark:border-gray-700 dark:hover:bg-white/10"
    }
    disabled:opacity-40`}
  title={it}
>
  {it}
</button>

        );
      })}
    </div>
  );
}

/* ---------- utils ---------- */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/* ---------- tiny confetti (no deps) ---------- */
function confettiBurst() {
  const N = 80;
  for (let i = 0; i < N; i++) {
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.top = "20%";
    el.style.width = "6px";
    el.style.height = "10px";
    el.style.background = `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`;
    el.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
    el.style.pointerEvents = "none";
    el.style.opacity = "1";
    el.style.borderRadius = "2px";
    document.body.appendChild(el);

    const x = (Math.random() - 0.5) * 600;
    const y = 200 + Math.random() * 300;
    const rot = (Math.random() - 0.5) * 720;

    el.animate(
      [
        { transform: `translate(-50%, -50%)`, opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`, opacity: 0 }
      ],
      { duration: 1200 + Math.random() * 500, easing: "cubic-bezier(.22,.61,.36,1)" }
    ).onfinish = () => el.remove();
  }
}

/* ---------- brandy buttons ---------- */
const base =
  "px-3 py-2 rounded-xl transition border focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-40";
const variants = {
  primary:
    "bg-brand-light text-white border-transparent hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand",
  secondary:
    "bg-white text-brand border border-brand hover:bg-brand/10 dark:bg-gray-900 dark:text-white dark:border-brand-light dark:hover:bg-brand-dark/30",
  ghost:
    "bg-transparent text-brand border border-brand/30 hover:bg-brand/10 dark:text-white dark:border-white/20 dark:hover:bg-white/10",
};
function Btn({
  className = "",
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
