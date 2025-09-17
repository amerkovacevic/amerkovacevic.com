import { useEffect, useMemo, useRef, useState } from "react";
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
  const [drawProgress, setDrawProgress] = useState(0);
  const [recentlyAssigned, setRecentlyAssigned] = useState<string[]>([]);
  const progressInterval = useRef<number | null>(null);
  const highlightTimeout = useRef<number | null>(null);
  const progressResetTimeout = useRef<number | null>(null);

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
    }).sort((a, b) => {
      const repA = a.rep ?? 0;
      const repB = b.rep ?? 0;
      if (repA !== repB) return repB - repA;
      return a.name.localeCompare(b.name);
    });
  }, [selLeagues, selNations, search]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) window.clearInterval(progressInterval.current);
      if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
      if (progressResetTimeout.current) window.clearTimeout(progressResetTimeout.current);
    };
  }, []);

  // helpers
  function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

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
  const clearList = () => {
    setList([]);
    setBulkNames("");
    setErr(null);
    setRecentlyAssigned([]);
    setDrawProgress(0);
    if (highlightTimeout.current) {
      window.clearTimeout(highlightTimeout.current);
      highlightTimeout.current = null;
    }
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (progressResetTimeout.current) {
      window.clearTimeout(progressResetTimeout.current);
      progressResetTimeout.current = null;
    }
  };

  // UNIQUE assignments with modern draw animation
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

    if (progressInterval.current) window.clearInterval(progressInterval.current);
    if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
    if (progressResetTimeout.current) window.clearTimeout(progressResetTimeout.current);

    // Smooth draw animation: dynamic progress followed by reveal
    setIsDrawing(true);
    setDrawProgress(0);
    try {
      const duration = 1600 + Math.random() * 400; // 1.6–2.0s shuffle window
      const start = Date.now();
      progressInterval.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, Math.round((elapsed / duration) * 100));
        setDrawProgress(pct);
      }, 80);

      await delay(duration);

      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setDrawProgress(100);

      setList((cur) =>
        cur.map((row) => {
          if (row.locked) return row;
          const assigned = finalMap.get(row.id);
          return assigned ? { ...row, team: assigned } : { ...row, team: row.team };
        })
      );

      const ids = shuffledPeople.map((p) => p.id);
      setRecentlyAssigned(ids);
      confettiBurst();

      highlightTimeout.current = window.setTimeout(() => {
        setRecentlyAssigned([]);
        highlightTimeout.current = null;
      }, 1600);
    } finally {
      setIsDrawing(false);
      progressResetTimeout.current = window.setTimeout(() => {
        setDrawProgress(0);
        progressResetTimeout.current = null;
      }, 420);
    }
  };

  const clearTeams = () => {
    setList((cur) => cur.map((r) => ({ ...r, team: undefined, locked: false })));
    setRecentlyAssigned([]);
    setDrawProgress(0);
    if (highlightTimeout.current) {
      window.clearTimeout(highlightTimeout.current);
      highlightTimeout.current = null;
    }
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (progressResetTimeout.current) {
      window.clearTimeout(progressResetTimeout.current);
      progressResetTimeout.current = null;
    }
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
  const hasFilters = Boolean(selLeagues.length || selNations.length || search.trim());
  const lockedCount = list.filter((r) => r.locked).length;
  const assignedCount = list.filter((r) => r.team).length;
  const awaitingCount = Math.max(0, list.length - assignedCount);

  return (
    <div className="space-y-10 pb-10">
      <PageHero
        align="center"
        icon="🎮"
        title="FM Team Draft Hub"
        description={
          <>
            Orchestrate a fair Football Manager save with curated pools, live stats, and one-click draws.
            {" "}
            {TEAMS.length.toLocaleString()} teams loaded
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <PageSection
            title="Participants"
            description="Add managers, lock favourites, and keep track of who received which club."
            contentClassName="space-y-5"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="Enter manager names (comma or newline separated)"
                className="h-28 w-full rounded-brand-xl border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark"
                disabled={isDrawing}
              />
              <div className="flex gap-2 md:flex-col">
                <button
                  onClick={addNames}
                  className={buttonStyles({ size: "sm", className: "md:h-full" })}
                  disabled={!bulkNames.trim() || isDrawing}
                  title="Add names to the list"
                >
                  Add managers
                </button>
                <button
                  onClick={clearList}
                  className={buttonStyles({ variant: "ghost", size: "sm", className: "md:h-full" })}
                  disabled={isDrawing || list.length === 0}
                >
                  Clear list
                </button>
              </div>
            </div>

            {list.length === 0 ? (
              <EmptyState text="No participants yet. Add some names to get started." />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-brand-muted">
                    Total managers: <strong>{list.length}</strong>
                    {lockedCount ? ` · ${lockedCount} locked` : ""}
                    {assignedCount ? ` · ${assignedCount} assigned` : ""}
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
                          Reset teams
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-border-light/70 bg-surface/80 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark">
                  <ul className="divide-y divide-border-light/70 dark:divide-border-dark/60">
                    {list.map((r) => {
                      const isFresh = recentlyAssigned.includes(r.id);
                      return (
                        <li
                          key={r.id}
                          className={cn(
                            "flex flex-col gap-3 px-4 py-4 transition-all sm:flex-row sm:items-center sm:justify-between",
                            isFresh && "bg-brand/10 shadow-brand-sm dark:bg-brand/25",
                            r.locked && "border-l-4 border-brand/40"
                          )}
                        >
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold text-brand-strong dark:text-white">
                                {r.name}
                              </span>
                              {r.locked ? (
                                <span className="inline-flex items-center gap-1 rounded-brand-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                                  🔒 Locked
                                </span>
                              ) : null}
                              {isFresh ? (
                                <span className="inline-flex items-center gap-1 rounded-brand-full bg-brand-accent/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-strong/80">
                                  ✨ New draw
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-brand-muted dark:text-white/70">
                              {r.team ? (
                                <>
                                  <span className="font-semibold text-brand-strong dark:text-white">{r.team.name}</span>
                                  <span className="text-brand-subtle"> · {r.team.league}</span>
                                  <span className="text-brand-subtle"> ({r.team.nation})</span>
                                </>
                              ) : (
                                <span className="italic text-brand-subtle">Awaiting assignment</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => toggleLock(r.id)}
                              disabled={isDrawing}
                              className={buttonStyles({
                                variant: r.locked ? "primary" : "secondary",
                                size: "sm",
                                className: "h-9 px-3 text-[11px]",
                              })}
                            >
                              {r.locked ? "Unlock" : "Lock"}
                            </button>
                            <button
                              onClick={() => removeRow(r.id)}
                              disabled={isDrawing}
                              className={buttonStyles({
                                variant: "ghost",
                                size: "sm",
                                className: "h-9 px-3 text-[11px] text-red-500 hover:text-red-400",
                              })}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </PageSection>
        </div>

        <div className="space-y-6">
          <PageSection
            title="Team pool"
            description="Filter the database to create the perfect shortlist for your save."
            actions={
              hasFilters ? (
                <button
                  onClick={() => {
                    setSelLeagues([]);
                    setSelNations([]);
                    setSearch("");
                  }}
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                  disabled={isDrawing}
                >
                  Clear filters
                </button>
              ) : null
            }
            contentClassName="space-y-5"
          >
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by club, league, or nation"
                className="w-full rounded-brand-xl border border-border-light bg-surface px-3 py-2 pl-9 text-sm shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:border-border-dark dark:bg-surface-overlayDark"
                disabled={isDrawing}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">🔎</span>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="rounded-brand-xl border border-dashed border-border-light/70 bg-surface/70 px-4 py-3 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80">
              Pool size: <strong>{pool.length}</strong> clubs (of {TEAMS.length})
            </div>

            {pool.length === 0 ? (
              <div className="rounded-brand-xl border border-dashed border-red-200/80 bg-red-50/60 px-4 py-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                No clubs match the current filters.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pool.slice(0, 8).map((team) => (
                    <TeamPreview key={team.id} team={team} />
                  ))}
                </div>
                {pool.length > 8 ? (
                  <div className="text-xs text-brand-muted">
                    Showing {Math.min(8, pool.length)} of {pool.length} clubs. Narrow filters to focus your draw.
                  </div>
                ) : null}
              </>
            )}
          </PageSection>

          <PageSection
            title="Draw controls"
            description="Run a unique assignment from the active pool. Everyone receives a different club."
            contentClassName="space-y-5"
          >
            {err && (
              <div className="rounded-brand-xl border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {err}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoStat label="Managers" value={list.length} />
              <InfoStat label="Locked" value={lockedCount} />
              <InfoStat label="Assigned" value={assignedCount} />
              <InfoStat label="Awaiting" value={awaitingCount} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className={buttonStyles({ size: "md", className: "flex-1" })}
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
                {isDrawing ? "Shuffling clubs…" : "🎲 Draw clubs"}
              </button>
              <button
                className={buttonStyles({ variant: "secondary", size: "md", className: "sm:flex-1" })}
                onClick={clearTeams}
                disabled={isDrawing || !list.some((r) => r.team)}
              >
                Reset assignments
              </button>
            </div>

            {drawProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  <span>{isDrawing ? "Shuffling teams" : "Draw complete"}</span>
                  <span>{drawProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-border-light/60 dark:bg-border-dark/60">
                  <div
                    className="h-2 rounded-full bg-brand transition-all duration-200"
                    style={{ width: `${drawProgress}%` }}
                  />
                </div>
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

function InfoStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-brand-xl border border-border-light/70 bg-surface/80 px-4 py-3 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/70">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-brand-strong dark:text-white">{value}</div>
    </div>
  );
}

function TeamPreview({ team }: { team: Team }) {
  return (
    <div className="rounded-brand-xl border border-border-light/70 bg-surface px-3 py-3 shadow-brand-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-overlayDark">
      <div className="truncate text-sm font-semibold text-brand-strong dark:text-white">{team.name}</div>
      <div className="mt-1 text-xs text-brand-muted">{team.league}</div>
      <div className="text-[11px] uppercase tracking-wide text-brand-subtle">{team.nation}</div>
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
