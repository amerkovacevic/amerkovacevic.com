import { useMemo, useState } from "react";
import data from "../../data/clubs.json";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";

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
  const [singleLeagueMode, setSingleLeagueMode] = useState(false);
  const [lastDrawLeague, setLastDrawLeague] = useState<string | null>(null);

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
    let available = pool.filter((t) => !taken.has(t.id));
    let chosenLeague: string | null = null;

    if (singleLeagueMode) {
      const lockedLeagues = new Set(
        list.filter((r) => r.locked && r.team).map((r) => r.team!.league)
      );
      if (lockedLeagues.size > 1) {
        setErr("Locked assignments span multiple leagues. Unlock some entries or disable single-league mode.");
        return;
      }

      const teamsByLeague = new Map<string, Team[]>();
      for (const team of available) {
        const cur = teamsByLeague.get(team.league);
        if (cur) cur.push(team);
        else teamsByLeague.set(team.league, [team]);
      }

      const preferredLeagues =
        lockedLeagues.size === 1
          ? Array.from(lockedLeagues).filter((lg) => teamsByLeague.has(lg))
          : selLeagues.length
          ? selLeagues.filter((lg) => teamsByLeague.has(lg))
          : Array.from(teamsByLeague.keys());

      const eligible = preferredLeagues
        .map((league) => ({ league, teams: teamsByLeague.get(league)! }))
        .filter(({ teams }) => teams.length >= unlocked.length);

      if (!eligible.length) {
        setErr(
          "Not enough teams within a single league to complete the draw. Adjust your filters or disable single-league mode."
        );
        return;
      }

      const selection = lockedLeagues.size === 1 ? eligible[0]! : pick(eligible);
      chosenLeague = selection.league;
      available = selection.teams;
    }

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
      setLastDrawLeague(chosenLeague);
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

  const clearTeams = () => {
    setLastDrawLeague(null);
    setList((cur) => cur.map((r) => ({ ...r, team: undefined, locked: false })));
  };

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
    <div className="space-y-6">
      <PageHero
        icon="🎮"
        title="FM Team Draw"
        description={
          <>
            Paste names, filter by nation/league, and assign teams fairly. {TEAMS.length.toLocaleString()} teams loaded
            {datasetDate ? ` · updated ${datasetDate}` : ""}
          </>
        }
        stats={
          <>
            <StatPill>Leagues · {leagues.length}</StatPill>
            <StatPill>Countries · {nations.length}</StatPill>
            <StatPill>Pool · {pool.length}/{TEAMS.length}</StatPill>
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <PageSection
          className="md:col-span-1"
          title="Participants"
          description="Paste names, lock assignments, and see who gets which team."
          contentClassName="space-y-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <textarea
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder="Enter names (comma or newline separated)"
              className="h-28 w-full rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
            />
            <button
              onClick={addNames}
              className={buttonStyles({ size: "sm", className: "md:h-auto" })}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-brand-muted">
                  Total participants: <strong>{list.length}</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.some((r) => r.team) && (
                    <>
                      <button
                        onClick={copyResults}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                        disabled={isDrawing}
                      >
                        Copy results
                      </button>
                      <button
                        onClick={clearTeams}
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                        disabled={isDrawing}
                      >
                        Clear teams
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-border-light overflow-hidden rounded-brand border border-border-light">
                {list.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center justify-between gap-3 bg-surface px-3 py-3 transition",
                      rolling[r.id]
                        ? "bg-brand/5 dark:bg-brand-dark/30"
                        : "dark:bg-surface-overlayDark"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-brand-strong dark:text-white truncate">{r.name}</div>
                      <div className="text-xs text-brand-muted truncate">
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
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => toggleLock(r.id)}
                        disabled={isDrawing}
                        className={cn(
                          buttonStyles({ variant: "secondary", size: "sm", className: "!h-8 !px-3 text-[11px]" }),
                          r.locked
                            ? "border-brand text-brand"
                            : "border-border-light bg-surface hover:border-brand/40"
                        )}
                        title="Lock this assignment when re-rolling"
                      >
                        {r.locked ? "Locked" : "Lock"}
                      </button>
                      <button
                        onClick={() => removeRow(r.id)}
                        disabled={isDrawing}
                        className={cn(
                          buttonStyles({ variant: "ghost", size: "sm", className: "!h-8 !px-3 text-[11px]" }),
                          "hover:text-red-500"
                        )}
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
        </PageSection>

        <PageSection
          className="md:col-span-1"
          title="Filters"
          description="Narrow the pool by league or nation."
          contentClassName="space-y-4"
        >
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team / league / nation…"
              className="w-full rounded-brand border border-border-light bg-surface px-3 py-2 pl-9 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
              disabled={isDrawing}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">🔎</span>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Leagues</div>
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

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Nations</div>
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

          <div className="text-xs text-brand-muted">
            Pool size: <strong>{pool.length}</strong> (of {TEAMS.length})
          </div>
        </PageSection>

        <PageSection
          className="md:col-span-2"
          title="Assign"
          description="Assign teams from the current pool (unique teams only). Re-run to shuffle unlocked entries."
          contentClassName="space-y-4"
        >
          {err && <div className="text-sm text-red-500">{err}</div>}

          <div className="flex flex-col gap-2">
            <button
              className={buttonStyles({ size: "md" })}
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
              className={buttonStyles({ variant: "secondary", size: "md" })}
              onClick={clearTeams}
              disabled={isDrawing || !list.some((r) => r.team)}
            >
              Reset assignments
            </button>
          </div>

          <label className="flex items-start gap-2 text-sm text-brand-strong dark:text-white/80">
            <input
              type="checkbox"
              checked={singleLeagueMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setSingleLeagueMode(checked);
                if (!checked) setLastDrawLeague(null);
              }}
              disabled={isDrawing}
              className="mt-1"
            />
            <span>
              Keep everyone in the same league
              <span className="block text-[11px] font-normal text-brand-muted">
                Randomly pick one eligible league (respecting locks) and assign all unlocked players within it.
              </span>
            </span>
          </label>

          {singleLeagueMode && lastDrawLeague && (
            <div className="text-[11px] text-brand-muted">
              Last draw league: <strong>{lastDrawLeague}</strong>
            </div>
          )}

          {"meta" in (data as any) && (
            <div className="text-[11px] text-brand-muted">
              Dataset: {(data as any).meta?.source || "local"} · {datasetDate || "unknown date"}
            </div>
          )}
        </PageSection>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-brand-xl border border-dashed border-border-light/70 bg-surface/90 p-6 text-center shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80">
      <div className="text-3xl">📝</div>
      <div className="mt-2 text-sm text-brand-muted dark:text-white/70">{text}</div>
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
    return (
      <div className="rounded-brand border border-dashed border-border-light/70 bg-surface px-3 py-2 text-xs text-brand-muted dark:border-border-dark/60 dark:bg-surface-overlayDark">
        {emptyText || "—"}
      </div>
    );
  }
  return (
    <div className="flex max-h-44 flex-wrap gap-2 overflow-auto pr-1">
      {items.map((it) => {
        const active = selected.includes(it);
        return (
          <button
            key={it}
            onClick={() => onToggle(it)}
            disabled={disabled}
            className={cn(
              "rounded-brand-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40",
              active
                ? "border-brand bg-brand text-white shadow-brand-sm dark:border-brand/60 dark:bg-brand/30"
                : "border-border-light bg-surface text-brand-muted hover:border-brand/40 hover:text-brand-strong dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-subtle"
            )}
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
// removed legacy Btn helper in favour of buttonStyles
