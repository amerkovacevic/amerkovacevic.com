import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { signInWithPopup, type User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";
import { auth, db, googleProvider } from "../../shared/lib/firebase";

// Context exposed from the root layout so feature pages can access the user.
type LayoutCtx = { user: User | null };

type MiniGameDefinition = {
  id: string;
  name: string;
  icon: string;
  summary: string;
  focus: string[];
  estTime: string;
  scoring: string;
  instructions: string[];
};

type DailyConfig = {
  challengeDate: string;
  theme?: string;
  curatedBy?: string;
  note?: string;
  games: string[];
};

type LeaderboardEntry = {
  id: string;
  displayName: string;
  seasonScore: number;
  currentStreak: number;
  bestRun: number;
  lastPlayedOn?: Timestamp | null;
};

type ProfileState = {
  displayName: string;
  currentStreak: number;
  bestStreak: number;
  totalGauntlets: number;
  activeDailyKey: string | null;
  todaysScore: number | null;
  todaysCompleted: string[];
  scoreByGame: Record<string, number>;
  lastPlayedOn?: Timestamp | null;
};

type HistoryEntry = {
  id: string;
  playedOn: Timestamp | null;
  games: string[];
  theme?: string;
  winner?: string;
};

const MINI_GAME_LIBRARY: MiniGameDefinition[] = [
  {
    id: "crossbar-clash",
    name: "Crossbar Clash",
    icon: "🎯",
    summary: "Hit the virtual crossbar before time runs out by timing perfectly weighted swipes.",
    focus: ["Accuracy", "Touch"],
    estTime: "2 min",
    scoring: "Earn up to 100 pts. +20 combo bonus for 3 perfect hits in a row.",
    instructions: [
      "Players line up 10 simulated shots with adjustable power and bend.",
      "The closer you land to the crossbar centerline, the higher the score.",
      "Combo meter increases difficulty by shrinking the target zone each success.",
    ],
  },
  {
    id: "tiki-taka-tracker",
    name: "Tiki-Taka Tracker",
    icon: "🧠",
    summary: "Keep a flowing passing pattern alive by recalling the correct tile sequence.",
    focus: ["Memory", "Vision"],
    estTime: "3 min",
    scoring: "+10 pts per correct chain. Bonus streak at 7 consecutive chains.",
    instructions: [
      "A dynamic grid lights up player positions in a sequence.",
      "Recreate the sequence using directional inputs without breaking rhythm.",
      "Pace accelerates with each successful wave to stress pattern recognition.",
    ],
  },
  {
    id: "pressing-puzzle",
    name: "Pressing Puzzle",
    icon: "⚡",
    summary: "Choose the optimal press trigger before the opponent breaks the lines.",
    focus: ["Tactics", "Decision Speed"],
    estTime: "2 min",
    scoring: "Decision grade out of 5 stars converts to 0-120 pts per scenario.",
    instructions: [
      "Read the match freeze-frame and three predictive heat maps.",
      "Select the pressing scheme that maximizes regain probability.",
      "Rapid selections with correct logic earn a reaction speed multiplier.",
    ],
  },
  {
    id: "finishing-flurry",
    name: "Finishing Flurry",
    icon: "🥅",
    summary: "Adjust curve and lift to finish from five unique service angles.",
    focus: ["Technique", "Composure"],
    estTime: "3 min",
    scoring: "Base 50 pts per goal. Style multipliers for weak-foot and volleys.",
    instructions: [
      "Simulated coach feeds balls with varying spin and height.",
      "Slide power/curve sliders to strike the sweet spot before the timer.",
      "Chain different finish types to trigger a Flair bonus.",
    ],
  },
  {
    id: "buildout-blueprint",
    name: "Buildout Blueprint",
    icon: "📋",
    summary: "Draft the safest exit route from the back against an adaptive press.",
    focus: ["Strategy", "Pattern Play"],
    estTime: "4 min",
    scoring: "Route quality out of 10 times possession bonus yields up to 140 pts.",
    instructions: [
      "Drag markers to set the first five passes for a goal kick buildout.",
      "Each move reveals opponent rotations in response.",
      "Secure at least a 3-pass chain without turnover to keep the streak alive.",
    ],
  },
  {
    id: "gaffer-gambit",
    name: "Gaffer Gambit",
    icon: "🧢",
    summary: "Make the crucial in-game adjustment with limited substitutions available.",
    focus: ["Management", "Problem Solving"],
    estTime: "3 min",
    scoring: "Scenario grade (0-5 stars) converts to 90-150 pts with clutch bonus.",
    instructions: [
      "Study match telemetry: fatigue, momentum, and key matchups.",
      "Lock in a tactical tweak before the momentum bar depletes.",
      "High-impact decisions activate +15 clutch bonus.",
    ],
  },
  {
    id: "reaction-rondo",
    name: "Reaction Rondo",
    icon: "🔁",
    summary: "Maintain possession in a tight rondo as defenders collapse on triggers.",
    focus: ["Agility", "Awareness"],
    estTime: "2 min",
    scoring: "2 pts per clean exit, +12 pts time bonus for flawless 60-second run.",
    instructions: [
      "Tap passing lanes before defenders close the trap zone.",
      "Double-tap to disguise a wall pass when the trap warning flashes.",
      "Recoveries reset the multiplier; keep the tempo high.",
    ],
  },
  {
    id: "set-piece-studio",
    name: "Set Piece Studio",
    icon: "🧱",
    summary: "Design the winning free kick routine using drag-and-drop runners.",
    focus: ["Creativity", "Set Pieces"],
    estTime: "4 min",
    scoring: "Judge panel scores placement, disguise, and execution up to 160 pts.",
    instructions: [
      "Stage runners and blockers with snap-to-grid helpers.",
      "Preview AI defensive responses and refine your routine.",
      "Lock the plan to submit for virtual execution and scoring.",
    ],
  },
];

const DEFAULT_LINEUP_IDS = MINI_GAME_LIBRARY.slice(0, 5).map((game) => game.id);

export default function AmerGauntletPage() {
  const { user } = useOutletContext<LayoutCtx>();

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const [dailyConfig, setDailyConfig] = useState<DailyConfig | null>(null);
  const [dailyLoaded, setDailyLoaded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, "amerGauntletDaily", todayKey);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<DailyConfig>;
          const rawDate = data.challengeDate as any;
          const resolvedDate =
            typeof rawDate === "string"
              ? rawDate
              : rawDate && typeof rawDate.toDate === "function"
              ? formatDateKey(rawDate.toDate())
              : todayKey;
          const gameIds = Array.isArray(data.games) && data.games.length > 0 ? data.games : DEFAULT_LINEUP_IDS;
          setDailyConfig({
            challengeDate: resolvedDate,
            theme: data.theme,
            curatedBy: data.curatedBy,
            note: data.note,
            games: gameIds,
          });
        } else {
          setDailyConfig(null);
        }
        setDailyLoaded(true);
      },
      () => {
        setDailyConfig(null);
        setDailyLoaded(true);
      }
    );
    return () => unsub();
  }, [todayKey]);

  useEffect(() => {
    const q = query(
      collection(db, "amerGauntletLeaderboards"),
      orderBy("seasonScore", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: LeaderboardEntry[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const lastPlayed = data.lastPlayedOn as any;
          return {
            id: docSnap.id,
            displayName: data.displayName ?? "Player",
            seasonScore: Number(data.seasonScore ?? 0),
            currentStreak: Number(data.currentStreak ?? 0),
            bestRun: Number(data.bestRun ?? data.bestStreak ?? 0),
            lastPlayedOn:
              lastPlayed && typeof lastPlayed.toDate === "function" ? lastPlayed : null,
          };
        });
        setLeaderboard(next);
      },
      () => {
        setLeaderboard([]);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "amerGauntletHistory"),
      orderBy("playedOn", "desc"),
      limit(6)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: HistoryEntry[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            playedOn: data.playedOn ?? null,
            games: Array.isArray(data.games) ? (data.games as string[]) : [],
            theme: data.theme ?? undefined,
            winner: data.winner ?? data.topPerformer ?? undefined,
          };
        });
        setHistory(next);
      },
      () => setHistory([])
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return undefined;
    }
    const ref = doc(db, "amerGauntletProfiles", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setProfile({
            displayName: user.displayName ?? "You",
            currentStreak: 0,
            bestStreak: 0,
            totalGauntlets: 0,
            activeDailyKey: null,
            todaysScore: null,
            todaysCompleted: [],
            scoreByGame: {},
          });
          return;
        }
        const data = snap.data() as any;
        const lastPlayed = data.lastPlayedOn as any;
        setProfile({
          displayName: data.displayName ?? user.displayName ?? "You",
          currentStreak: Number(data.currentStreak ?? 0),
          bestStreak: Number(data.bestStreak ?? data.bestRun ?? 0),
          totalGauntlets: Number(data.totalGauntlets ?? data.completedGauntlets ?? 0),
          activeDailyKey: data.activeDailyKey ?? null,
          todaysScore: data.todaysScore != null ? Number(data.todaysScore) : null,
          todaysCompleted: Array.isArray(data.todaysCompleted)
            ? (data.todaysCompleted as string[])
            : [],
          scoreByGame: typeof data.scoreByGame === "object" && data.scoreByGame
            ? Object.fromEntries(
                Object.entries(data.scoreByGame).map(([key, value]) => [key, Number(value ?? 0)])
              )
            : {},
          lastPlayedOn:
            lastPlayed && typeof lastPlayed.toDate === "function"
              ? (lastPlayed as Timestamp)
              : undefined,
        });
      },
      () => {
        setProfile({
          displayName: user.displayName ?? "You",
          currentStreak: 0,
          bestStreak: 0,
          totalGauntlets: 0,
          activeDailyKey: null,
          todaysScore: null,
          todaysCompleted: [],
          scoreByGame: {},
        });
      }
    );
    return () => unsub();
  }, [user]);

  const lineupIds = dailyConfig?.games?.length ? dailyConfig.games : DEFAULT_LINEUP_IDS;

  const lineup = useMemo(() => {
    return lineupIds.map((id) => MINI_GAME_LIBRARY.find((game) => game.id === id) ?? makePlaceholderGame(id));
  }, [lineupIds]);

  const todaysCompleted = useMemo(() => {
    if (!profile) return [] as string[];
    if (profile.activeDailyKey !== todayKey) return [] as string[];
    return profile.todaysCompleted;
  }, [profile, todayKey]);

  const todaysScore = useMemo(() => {
    if (!profile) return null;
    if (profile.activeDailyKey !== todayKey) return null;
    return profile.todaysScore;
  }, [profile, todayKey]);

  const todaysScoreByGame = useMemo(() => {
    if (!profile) return {} as Record<string, number>;
    if (profile.activeDailyKey !== todayKey) return {} as Record<string, number>;
    return profile.scoreByGame;
  }, [profile, todayKey]);

  const dailyEntries = useMemo(() => {
    const completedSet = new Set(todaysCompleted);
    let lockFuture = false;

    return lineup.map((game, index) => {
      const completed = completedSet.has(game.id);
      const status: DailyGameStatus = completed ? "completed" : lockFuture ? "locked" : "available";
      if (!completed) {
        lockFuture = true;
      }
      return {
        order: index + 1,
        game,
        completed,
        status,
        score: todaysScoreByGame?.[game.id] ?? null,
      };
    });
  }, [lineup, todaysCompleted, todaysScoreByGame]);

  const totalGames = dailyEntries.length;
  const completedCount = dailyEntries.filter((entry) => entry.completed).length;
  const progressPercent = totalGames ? Math.round((completedCount / totalGames) * 100) : 0;

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const activeTheme = dailyConfig?.theme ?? "Daily Skill Gauntlet";

  return (
    <div className="space-y-10">
      <PageHero
        icon="🛡️"
        eyebrow={<span className="tracking-[0.28em]">New Daily Challenge</span>}
        title="Amer Gauntlet"
        description={
          <span>
            Five rapid-fire mini games curated each day to sharpen touch, tactics, and mentality. Sign in to track your streak,
            chase the leaderboard, and review your matchday history.
          </span>
        }
        stats={
          <>
            <StatPill>5 Games per day</StatPill>
            <StatPill>Season leaderboard</StatPill>
            <StatPill>Firestore-tracked progress</StatPill>
          </>
        }
        actions={
          user ? (
            <div className="flex flex-col items-start gap-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-muted dark:text-white/70">
                Current streak
              </p>
              <div className="text-4xl font-semibold text-brand-strong dark:text-white">
                {profile?.currentStreak ?? 0}
                <span className="ml-1 text-sm font-medium text-brand-muted dark:text-white/70">days</span>
              </div>
              <div className="flex gap-6 text-xs text-brand-muted dark:text-white/60">
                <span>Best: {profile?.bestStreak ?? 0} days</span>
                <span>Total clears: {profile?.totalGauntlets ?? 0}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-left">
              <button onClick={handleSignIn} className={buttonStyles({ size: "lg" })}>
                Sign in with Google
              </button>
              <p className="max-w-xs text-xs text-brand-muted dark:text-white/70">
                Authentication is powered by Firebase so your streaks, scores, and history follow you on every device.
              </p>
            </div>
          )
        }
      />

      <PageSection
        title="Today&apos;s Amer Gauntlet"
        description={
          dailyLoaded ? (
            <span>
              {activeTheme} • {formatFriendlyDate(dailyConfig?.challengeDate ?? todayKey)}
            </span>
          ) : (
            "Loading lineup..."
          )
        }
        actions={
          dailyConfig?.curatedBy ? (
            <span className="text-xs uppercase tracking-[0.2em] text-brand-muted dark:text-white/60">
              Curated by {dailyConfig.curatedBy}
            </span>
          ) : null
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="relative h-2 w-44 overflow-hidden rounded-full bg-border-light/60 dark:bg-border-dark/50">
                  <div
                    className="h-full bg-brand transition-all duration-500"
                    style={{ width: `${Math.max(progressPercent, 6)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-white/60">
                  {completedCount}/{totalGames} cleared
                </span>
              </div>
              {todaysScore != null ? (
                <div className="text-sm text-brand-muted dark:text-white/70">Today's score: {todaysScore} pts</div>
              ) : (
                <div className="text-sm text-brand-muted dark:text-white/60">
                  Play all five to post a season score. Scores sync instantly to Firestore.
                </div>
              )}
            </div>
            {dailyConfig?.note ? (
              <div className="rounded-brand-lg border border-brand/20 bg-brand/5 px-4 py-3 text-xs text-brand-strong shadow-brand-sm dark:border-brand/40 dark:bg-brand/10 dark:text-brand-foreground">
                <span className="font-semibold uppercase tracking-[0.24em]">Coach's note:</span>
                <p className="mt-2 text-[13px] leading-relaxed tracking-normal">{dailyConfig.note}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {dailyEntries.map((entry) => (
              <DailyGameCard
                key={entry.game.id}
                entry={entry}
                expanded={expandedGameId === entry.game.id}
                onToggle={() => setExpandedGameId((prev) => (prev === entry.game.id ? null : entry.game.id))}
              />
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Leaderboard & personal form"
        description="Track the top performers and monitor your own gauntlet journey."
      >
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="relative overflow-hidden border border-border-light/70 bg-surface/80 shadow-brand-sm dark:border-border-dark/70 dark:bg-surface-muted">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-brand-strong dark:text-white">Season leaderboard</h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted dark:text-white/60">
                Top 10
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border-light/70 text-sm dark:divide-border-dark/60">
                <thead>
                  <tr className="text-left text-[12px] uppercase tracking-[0.26em] text-brand-muted dark:text-white/50">
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Player</th>
                    <th className="py-2 pr-4 text-right">Score</th>
                    <th className="py-2 pr-4 text-right">Streak</th>
                    <th className="py-2 text-right">Last played</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/60 dark:divide-border-dark/60">
                  {leaderboard.length ? (
                    leaderboard.map((row, index) => (
                      <tr key={row.id} className="text-brand-muted dark:text-white/75">
                        <td className="py-3 pr-4 font-semibold text-brand-strong dark:text-white">#{index + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-brand-strong dark:text-white">{row.displayName}</span>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted dark:text-white/50">
                              Best run {row.bestRun}d
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-brand-strong dark:text-white">
                          {row.seasonScore}
                        </td>
                        <td className="py-3 pr-4 text-right">{row.currentStreak}d</td>
                        <td className="py-3 text-right text-[12px] uppercase tracking-[0.16em]">
                          {formatRelativeTime(row.lastPlayedOn)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-brand-muted dark:text-white/60">
                        Leaderboard updates in real time as players complete the gauntlet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="border border-border-light/70 bg-surface/90 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted">
              <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-muted dark:text-white/60">
                Your form snapshot
              </h3>
              {user ? (
                <div className="mt-4 space-y-4 text-sm text-brand-muted dark:text-white/70">
                  <StatGridItem label="Current streak" value={`${profile?.currentStreak ?? 0} days`} />
                  <StatGridItem label="Best streak" value={`${profile?.bestStreak ?? 0} days`} />
                  <StatGridItem label="Gauntlets cleared" value={`${profile?.totalGauntlets ?? 0}`} />
                  <StatGridItem
                    label="Last played"
                    value={formatRelativeTime(profile?.lastPlayedOn)}
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-brand-muted dark:text-white/70">
                  <p>Sign in to pin your streak, scores, and gauntlet completions to your profile.</p>
                  <button onClick={handleSignIn} className={buttonStyles({ variant: "secondary" })}>
                    Sign in to start tracking
                  </button>
                </div>
              )}
            </Card>

            <Card className="border border-brand/20 bg-brand/5 text-sm text-brand-strong shadow-brand-sm dark:border-brand/40 dark:bg-brand/15 dark:text-brand-foreground">
              <h3 className="text-sm font-semibold uppercase tracking-[0.26em]">How scoring works</h3>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
                <li>• 5 games × 100-160 pts each. Finishers earn a completion multiplier.</li>
                <li>• Daily total syncs to Firestore profiles and the season leaderboard instantly.</li>
                <li>• Miss a day and your streak resets — keep it alive to unlock bonus XP.</li>
              </ul>
            </Card>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Recent gauntlet history"
        description="Review previous lineups, themes, and top performers to scout tomorrow's challenge."
      >
        <div className="space-y-4">
          {history.length ? (
            history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))
          ) : (
            <p className="text-sm text-brand-muted dark:text-white/70">
              History entries will appear here once daily results are posted to Firestore.
            </p>
          )}
        </div>
      </PageSection>

      <PageSection
        title="Mini game library"
        description="Drop-in ready modules. Add a new game by extending the library — the daily picker updates automatically."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MINI_GAME_LIBRARY.map((game) => (
            <LibraryGameCard key={game.id} game={game} />
          ))}
          <Card className="flex flex-col gap-3 border border-dashed border-brand/40 bg-transparent p-6 text-brand-strong dark:border-brand/60 dark:text-brand-foreground">
            <span className="text-2xl">➕</span>
            <h3 className="text-lg font-semibold">Add your next mini game</h3>
            <p className="text-sm text-brand-muted dark:text-white/70">
              Append a new definition to <code>MINI_GAME_LIBRARY</code>, provide an <code>id</code>, and it becomes eligible for
              the daily pool and history logging immediately.
            </p>
          </Card>
        </div>
      </PageSection>
    </div>
  );
}

type DailyGameStatus = "available" | "locked" | "completed";

type DailyEntry = {
  order: number;
  game: MiniGameDefinition;
  completed: boolean;
  status: DailyGameStatus;
  score: number | null;
};

function DailyGameCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: DailyEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { order, game, status, score, completed } = entry;
  return (
    <Card
      className={cn(
        "flex flex-col gap-4 border border-border-light/70 bg-surface/90 shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-muted",
        expanded && "ring-2 ring-brand/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[1.5rem] bg-brand/10 text-2xl shadow-brand-sm dark:bg-brand/20">
            {game.icon}
          </span>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.26em] text-brand-muted dark:text-white/60">
              Game {order}
            </p>
            <h3 className="text-lg font-semibold text-brand-strong dark:text-white">{game.name}</h3>
            <p className="mt-1 text-sm text-brand-muted dark:text-white/70">{game.summary}</p>
          </div>
        </div>
        <StatusBadge status={status} completed={completed} score={score} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-brand-muted dark:text-white/60">
        <span className="rounded-full border border-border-light/60 px-3 py-1 uppercase tracking-[0.22em] dark:border-border-dark/60">
          {game.estTime}
        </span>
        {game.focus.map((focus) => (
          <span
            key={focus}
            className="rounded-full border border-brand/20 bg-brand/5 px-3 py-1 uppercase tracking-[0.22em] text-brand-strong/80 dark:border-brand/40 dark:bg-brand/20 dark:text-brand-foreground/90"
          >
            {focus}
          </span>
        ))}
      </div>

      {expanded ? (
        <div className="space-y-3 text-sm text-brand-muted dark:text-white/70">
          <p className="font-medium text-brand-strong dark:text-white">How to play</p>
          <ul className="space-y-2 text-[13px] leading-relaxed">
            {game.instructions.map((step, index) => (
              <li key={index}>• {step}</li>
            ))}
          </ul>
          <p className="rounded-brand-md border border-dashed border-brand/30 bg-brand/5 p-3 text-[13px] text-brand-strong/80 dark:border-brand/50 dark:bg-brand/15 dark:text-brand-foreground/90">
            {game.scoring}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className={buttonStyles({ variant: "secondary", size: "sm", className: "self-start" })}
      >
        {expanded ? "Hide instructions" : "View instructions"}
      </button>
    </Card>
  );
}

function StatusBadge({
  status,
  completed,
  score,
}: {
  status: DailyGameStatus;
  completed: boolean;
  score: number | null;
}) {
  if (status === "completed") {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-200/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-900 dark:border-emerald-500/80 dark:bg-emerald-400/25 dark:text-emerald-200">
          ✅ Cleared
        </span>
        {score != null ? (
          <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-300">{score} pts</span>
        ) : null}
      </div>
    );
  }

  if (status === "locked") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border-light/70 bg-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted dark:border-border-dark/60 dark:text-white/50">
        🔒 Locked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-strong dark:border-brand/50 dark:bg-brand/20 dark:text-brand-foreground">
      ▶️ Ready
    </span>
  );
}

function StatGridItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-brand-md border border-border-light/60 bg-surface/80 px-3 py-2 text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted dark:text-white/60">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const dateLabel = entry.playedOn ? formatFriendlyDate(entry.playedOn.toDate().toISOString().slice(0, 10)) : "TBD";
  const gameLabels = entry.games.length
    ? entry.games
        .map((id) => MINI_GAME_LIBRARY.find((game) => game.id === id)?.name ?? humanizeId(id))
        .join(" • ")
    : "Lineup pending";
  return (
    <Card className="flex flex-col gap-2 border border-border-light/70 bg-surface/90 p-5 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white/70">
      <div className="flex flex-wrap items-center justify-between gap-3 text-brand-strong dark:text-white">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-strong/90 dark:bg-brand/20 dark:text-brand-foreground">
            {dateLabel}
          </span>
          {entry.theme ? (
            <span className="text-xs uppercase tracking-[0.22em] text-brand-muted dark:text-white/60">{entry.theme}</span>
          ) : null}
        </div>
        {entry.winner ? (
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted dark:text-white/60">
            Winner: {entry.winner}
          </span>
        ) : null}
      </div>
      <p>{gameLabels}</p>
    </Card>
  );
}

function LibraryGameCard({ game }: { game: MiniGameDefinition }) {
  return (
    <Card className="flex h-full flex-col gap-3 border border-border-light/70 bg-surface/90 p-6 shadow-brand-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand dark:border-border-dark/60 dark:bg-surface-muted">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[1.5rem] bg-brand/10 text-2xl shadow-brand-sm dark:bg-brand/20">
          {game.icon}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-brand-strong dark:text-white">{game.name}</h3>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-muted dark:text-white/60">{game.focus.join(" • ")}</p>
        </div>
      </div>
      <p className="text-sm text-brand-muted dark:text-white/70">{game.summary}</p>
      <div className="mt-auto rounded-brand-md border border-dashed border-brand/30 bg-brand/5 p-3 text-xs text-brand-strong/80 dark:border-brand/50 dark:bg-brand/15 dark:text-brand-foreground/90">
        {game.scoring}
      </div>
    </Card>
  );
}

function makePlaceholderGame(id: string): MiniGameDefinition {
  const label = humanizeId(id);
  return {
    id,
    name: label,
    icon: "🎮",
    summary: "Placeholder definition — configure this mini game in Firestore or the library array.",
    focus: ["New"],
    estTime: "—",
    scoring: "Define scoring rules to surface them to players.",
    instructions: ["Set instructions in the mini game library to complete this module."],
  };
}

function humanizeId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatFriendlyDate(key: string) {
  const [year, month, day] = key.split("-").map((part) => Number(part));
  if (!year || !month || !day) return key;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRelativeTime(timestamp?: Timestamp | null) {
  if (!timestamp) return "—";
  const date = timestamp.toDate();
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
