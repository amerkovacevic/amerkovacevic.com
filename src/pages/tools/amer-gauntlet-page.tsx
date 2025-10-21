import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type LazyExoticComponent,
} from "react";
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

type MiniGameComponentProps = {
  onComplete?: (result: "win" | "loss") => void;
};

type MiniGameDefinition = {
  id: string;
  name: string;
  icon: string;
  summary: string;
  focus: string[];
  estTime: string;
  scoring: string;
  instructions: string[];
  component?: LazyExoticComponent<
    (props: MiniGameComponentProps) => JSX.Element | null
  >;
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

const EmojiRiddleGame = lazy(() =>
  import("../games/emoji-riddle-game").then((module) => ({ default: module.EmojiRiddleGame }))
);
const SynonymMatchGame = lazy(() =>
  import("../games/synonym-match-game").then((module) => ({ default: module.SynonymMatchGame }))
);
const TwentyFourGame = lazy(() =>
  import("../games/twenty-four-game").then((module) => ({ default: module.TwentyFourGame }))
);
const CodebreakerGame = lazy(() =>
  import("../games/codebreaker-game").then((module) => ({ default: module.CodebreakerGame }))
);

const MINI_GAME_LIBRARY: MiniGameDefinition[] = [
  {
    id: "emoji-riddle",
    name: "Emoji Riddle",
    icon: "🧠",
    summary: "Decode the hidden word or phrase from nothing but emoji clues.",
    focus: ["Wordplay", "Pattern Spotting"],
    estTime: "2 min",
    scoring: "Solve as many riddles as you can. Streaks boost your gauntlet momentum.",
    instructions: [
      "Study the emoji sequence and enter the matching word or phrase.",
      "Submit to check your guess, reveal a hint if you need help, and skip to keep tempo.",
      "Track streaks and solved count — perfect sessions fuel a gauntlet sweep.",
    ],
    component: EmojiRiddleGame,
  },
  {
    id: "synonym-match",
    name: "Synonym Match",
    icon: "🔤",
    summary: "Select the true synonym before the round timer slips away.",
    focus: ["Vocabulary", "Speed"],
    estTime: "3 min",
    scoring: "+5 pts per correct pick, bonus streak after 5 in a row.",
    instructions: [
      "Read the target word and review all four options closely.",
      "Tap the synonym that best matches the meaning — wrong picks break your streak.",
      "Lock in answers quickly to finish all cards within the gauntlet window.",
    ],
    component: SynonymMatchGame,
  },
  {
    id: "twenty-four",
    name: "24 Game",
    icon: "24️⃣",
    summary: "Combine all four digits with math operations to land exactly on 24.",
    focus: ["Arithmetic", "Creativity"],
    estTime: "4 min",
    scoring: "Each solved puzzle grants +8 pts. Run the table for a combo multiplier.",
    instructions: [
      "Use addition, subtraction, multiplication, division, or parentheses with every digit once.",
      "Drag operators or tap quick actions to assemble a valid expression equal to 24.",
      "Submit solutions to advance — reset if you need a fresh angle on the numbers.",
    ],
    component: TwentyFourGame,
  },
  {
    id: "codebreaker",
    name: "Codebreaker",
    icon: "🕵️",
    summary: "Crack the secret four-digit code with Mastermind-style feedback.",
    focus: ["Logic", "Deduction"],
    estTime: "5 min",
    scoring: "Guess the code within eight attempts for full marks. Efficient solves earn bonus points.",
    instructions: [
      "Enter a unique four-digit guess to probe the hidden combination.",
      "Use feedback pegs to track digits that are correct and in the right spot.",
      "Iterate on clues quickly — a clean solve keeps your gauntlet streak alive.",
    ],
    component: CodebreakerGame,
  },
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
  const [localResults, setLocalResults] = useState<Record<string, "win" | "loss">>({});
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [sessionEndedAt, setSessionEndedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);

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
  const lineupKey = useMemo(() => lineupIds.join("-"), [lineupIds]);

  const lineup = useMemo(() => {
    return lineupIds.map((id) => MINI_GAME_LIBRARY.find((game) => game.id === id) ?? makePlaceholderGame(id));
  }, [lineupIds]);

  useEffect(() => {
    setLocalResults({});
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setElapsedSeconds(0);
    setPenaltySeconds(0);
  }, [lineupKey]);

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

    return lineup.map((game, index) => {
      const completed = completedSet.has(game.id);
      return {
        order: index + 1,
        game,
        completed,
        score: todaysScoreByGame?.[game.id] ?? null,
      };
    });
  }, [lineup, todaysCompleted, todaysScoreByGame]);

  const sessionEntries = useMemo(() => {
    const firstPendingIndex = dailyEntries.findIndex(
      (entry) => !(entry.completed || localResults[entry.game.id] != null)
    );

    return dailyEntries.map((entry, index) => {
      const localResult = localResults[entry.game.id] ?? null;
      const completed = entry.completed || localResult != null;
      const status: DailyGameStatus = completed
        ? "completed"
        : firstPendingIndex === -1
        ? "completed"
        : index === firstPendingIndex
        ? "active"
        : "queued";

      return {
        ...entry,
        completed,
        status,
        localResult,
      };
    });
  }, [dailyEntries, localResults]);

  const activeEntry = sessionEntries.find((entry) => entry.status === "active") ?? null;
  const totalGames = sessionEntries.length;
  const completedCount = sessionEntries.filter((entry) => entry.completed).length;
  const progressPercent = totalGames ? Math.round((completedCount / totalGames) * 100) : 0;
  const remainingGames = sessionEntries.filter((entry) => !entry.completed).length;

  useEffect(() => {
    if (!sessionEntries.length) {
      return;
    }
    if (!sessionStartedAt && activeEntry) {
      setSessionStartedAt(new Date());
      return;
    }
    if (
      sessionStartedAt &&
      !activeEntry &&
      sessionEntries.every((entry) => entry.completed) &&
      !sessionEndedAt
    ) {
      setSessionEndedAt(new Date());
    }
  }, [sessionEntries, activeEntry, sessionStartedAt, sessionEndedAt]);

  useEffect(() => {
    if (!sessionStartedAt || sessionEndedAt) {
      return;
    }
    const updateElapsed = () => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000))
      );
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [sessionStartedAt, sessionEndedAt]);

  const wins = Object.values(localResults).filter((result) => result === "win").length;
  const losses = Object.values(localResults).filter((result) => result === "loss").length;
  const baseElapsedSeconds = sessionStartedAt
    ? getDisplayDurationSeconds(sessionStartedAt, sessionEndedAt, elapsedSeconds)
    : 0;
  const displayElapsedSeconds = baseElapsedSeconds + penaltySeconds;

  const handleCompleteGame = (
    result: "win" | "loss",
    options?: { penaltySeconds?: number }
  ) => {
    if (!activeEntry) return;
    const gameId = activeEntry.game.id;
    let applied = false;
    setLocalResults((prev) => {
      if (prev[gameId]) {
        return prev;
      }
      applied = true;
      return {
        ...prev,
        [gameId]: result,
      };
    });
    if (!applied) {
      return;
    }
    if (!sessionStartedAt) {
      setSessionStartedAt(new Date());
    }
    const penalty = options?.penaltySeconds ?? 0;
    if (penalty) {
      setPenaltySeconds((prev) => prev + penalty);
    }
    if (remainingGames === 1) {
      setSessionEndedAt(new Date());
    }
  };

  const handleSkipGame = () => {
    handleCompleteGame("loss", { penaltySeconds: 30 });
  };

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
          <SessionHeader
            progressPercent={progressPercent}
            completedCount={completedCount}
            totalGames={totalGames}
            todaysScore={todaysScore}
            wins={wins}
            losses={losses}
            elapsedSeconds={displayElapsedSeconds}
            note={dailyConfig?.note}
          />

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <ActiveGamePanel
              activeEntry={activeEntry}
              totalGames={totalGames}
              elapsedSeconds={displayElapsedSeconds}
              onComplete={handleCompleteGame}
              onSkip={handleSkipGame}
              sessionEnded={sessionEntries.every((entry) => entry.completed)}
              wins={wins}
              losses={losses}
            />

            <div className="space-y-4">
              <SessionSummaryCard
                completedCount={completedCount}
                totalGames={totalGames}
                wins={wins}
                losses={losses}
                elapsedSeconds={displayElapsedSeconds}
              />

              <SessionProgressList entries={sessionEntries} />
            </div>
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


type SessionGameResult = "win" | "loss" | null;
type DailyGameStatus = "active" | "queued" | "completed";

type SessionEntry = {
  order: number;
  game: MiniGameDefinition;
  completed: boolean;
  status: DailyGameStatus;
  score: number | null;
  localResult: SessionGameResult;
};

function SessionHeader({
  progressPercent,
  completedCount,
  totalGames,
  todaysScore,
  wins,
  losses,
  elapsedSeconds,
  note,
}: {
  progressPercent: number;
  completedCount: number;
  totalGames: number;
  todaysScore: number | null;
  wins: number;
  losses: number;
  elapsedSeconds: number;
  note?: string;
}) {
  const hasRun = completedCount > 0 || wins > 0 || losses > 0 || elapsedSeconds > 0;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-2 w-48 overflow-hidden rounded-full bg-border-light/60 dark:bg-border-dark/50">
            <div
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, completedCount ? progressPercent : 6)}%` }}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-white/60">
            {completedCount}/{totalGames || 5} cleared
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted dark:text-white/60">
          <span className="rounded-full border border-border-light/60 px-3 py-1 uppercase tracking-[0.22em] dark:border-border-dark/60">
            Time: {hasRun ? formatDurationLabel(elapsedSeconds) : "--:--"}
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-100/60 px-3 py-1 font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-400/15 dark:text-emerald-200">
            Wins: {wins}
          </span>
          <span className="rounded-full border border-rose-200 bg-rose-100/60 px-3 py-1 font-semibold uppercase tracking-[0.22em] text-rose-600 dark:border-rose-400/70 dark:bg-rose-400/15 dark:text-rose-200">
            Losses: {losses}
          </span>
          {todaysScore != null ? (
            <span className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1 uppercase tracking-[0.22em] text-brand-strong/80 dark:border-brand/50 dark:bg-brand/15 dark:text-brand-foreground/90">
              Firestore score: {todaysScore} pts
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted dark:text-white/60">
              Finish all five to post today&apos;s score
            </span>
          )}
        </div>
      </div>

      {note ? (
        <div className="rounded-brand-lg border border-brand/20 bg-brand/5 px-4 py-3 text-xs text-brand-strong shadow-brand-sm dark:border-brand/40 dark:bg-brand/10 dark:text-brand-foreground">
          <span className="font-semibold uppercase tracking-[0.24em]">Coach&apos;s note:</span>
          <p className="mt-2 text-[13px] leading-relaxed tracking-normal">{note}</p>
        </div>
      ) : null}
    </div>
  );
}

function ActiveGamePanel({
  activeEntry,
  totalGames,
  elapsedSeconds,
  onComplete,
  onSkip,
  sessionEnded,
  wins,
  losses,
}: {
  activeEntry: SessionEntry | null;
  totalGames: number;
  elapsedSeconds: number;
  onComplete: (result: "win" | "loss") => void;
  onSkip: () => void;
  sessionEnded: boolean;
  wins: number;
  losses: number;
}) {
  if (totalGames === 0) {
    return (
      <Card className="flex h-full flex-col items-center justify-center gap-4 border border-border-light/70 bg-surface/90 p-10 text-center text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white/70">
        <p>Today&apos;s gauntlet lineup is loading. Check back shortly for the five featured games.</p>
      </Card>
    );
  }

  if (!activeEntry) {
    return (
      <Card className="flex h-full flex-col justify-center gap-6 border border-emerald-200 bg-emerald-100/60 p-8 text-center text-emerald-700 shadow-brand-sm dark:border-emerald-500/80 dark:bg-emerald-400/15 dark:text-emerald-100">
        <div className="text-4xl">🎉</div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold uppercase tracking-[0.28em]">Run complete</h3>
          <p className="text-sm uppercase tracking-[0.2em]">Time: {formatDurationLabel(elapsedSeconds)}</p>
          <p className="text-sm uppercase tracking-[0.2em]">Record: {wins}-{losses}</p>
        </div>
        {sessionEnded ? (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200/80">
            Your results are ready to sync. Firestore updates when each mini game reports completion.
          </p>
        ) : null}
      </Card>
    );
  }

  const { game, order } = activeEntry;
  const GameComponent = game.component;

  return (
    <Card className="flex h-full flex-col gap-5 border border-border-light/70 bg-surface/95 p-6 shadow-brand-md dark:border-border-dark/60 dark:bg-surface-muted">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-[1.75rem] bg-brand/10 text-3xl shadow-brand-sm dark:bg-brand/20">
            {game.icon}
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-muted dark:text-white/60">
              Game {order} of {totalGames}
            </p>
            <h3 className="text-2xl font-semibold text-brand-strong dark:text-white">{game.name}</h3>
          </div>
        </div>
        <div className="rounded-brand-md border border-border-light/70 bg-surface px-4 py-2 text-right text-xs uppercase tracking-[0.2em] text-brand-muted dark:border-border-dark/60 dark:bg-surface-muted/80 dark:text-white/60">
          <p>Elapsed</p>
          <p className="text-sm font-semibold text-brand-strong dark:text-white">{formatDurationLabel(elapsedSeconds)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-brand-md border border-border-light/70 bg-surface px-4 py-4 shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted">
          {GameComponent ? (
            <Suspense
              fallback={
                <div className="grid h-48 place-items-center text-sm font-medium uppercase tracking-[0.2em] text-brand-muted dark:text-white/60">
                  Loading {game.name}...
                </div>
              }
            >
              <div className="space-y-4">
                <GameComponent onComplete={onComplete} />
              </div>
            </Suspense>
          ) : (
            <div className="grid h-40 place-items-center text-center text-sm text-brand-muted dark:text-white/60">
              <p className="max-w-sm text-balance">
                Interactive mode is in development. Use the cues below to simulate the challenge and keep the gauntlet moving.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onComplete("win")}
          className={buttonStyles({ size: "lg", className: "flex-1 min-w-[140px]" })}
        >
          Mark win &amp; advance
        </button>
        <button
          type="button"
          onClick={() => onComplete("loss")}
          className={buttonStyles({ variant: "secondary", size: "lg", className: "flex-1 min-w-[140px]" })}
        >
          Mark loss &amp; advance
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={buttonStyles({ variant: "ghost", size: "lg", className: "flex-1 min-w-[140px]" })}
        >
          Skip (+30s)
        </button>
      </div>
    </Card>
  );
}

function SessionSummaryCard({
  completedCount,
  totalGames,
  wins,
  losses,
  elapsedSeconds,
}: {
  completedCount: number;
  totalGames: number;
  wins: number;
  losses: number;
  elapsedSeconds: number;
}) {
  return (
    <Card className="border border-border-light/70 bg-surface/90 p-5 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white/70">
      <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-muted dark:text-white/60">
        Run tracker
      </h3>
      <div className="mt-4 grid gap-3">
        <SummaryStat label="Games cleared" value={`${completedCount}/${totalGames || 5}`} />
        <SummaryStat label="Wins" value={`${wins}`} accent="emerald" />
        <SummaryStat label="Losses" value={`${losses}`} accent="rose" />
        <SummaryStat label="Elapsed time" value={formatDurationLabel(elapsedSeconds)} />
      </div>
    </Card>
  );
}

function SessionProgressList({ entries }: { entries: SessionEntry[] }) {
  return (
    <Card className="border border-border-light/70 bg-surface/90 p-5 text-sm text-brand-muted shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-muted dark:text-white/70">
      <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-muted dark:text-white/60">
        Progression order
      </h3>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <SessionProgressRow key={entry.game.id} entry={entry} />
        ))}
      </div>
    </Card>
  );
}

function SessionProgressRow({ entry }: { entry: SessionEntry }) {
  const { game, order, status, localResult, completed } = entry;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-brand-md border px-4 py-3",
        status === "active"
          ? "border-brand/40 bg-brand/10 text-brand-strong dark:border-brand/60 dark:bg-brand/20 dark:text-brand-foreground"
          : "border-border-light/60 bg-surface text-brand-muted dark:border-border-dark/60 dark:bg-surface-muted dark:text-white/70"
      )}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em]">Game {order}</p>
        <p className="text-sm font-semibold text-brand-strong dark:text-white">{game.name}</p>
      </div>
      <StatusIndicator status={status} result={localResult} completed={completed} />
    </div>
  );
}

function StatusIndicator({
  status,
  result,
  completed,
}: {
  status: DailyGameStatus;
  result: SessionGameResult;
  completed: boolean;
}) {
  if (status === "completed") {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-200/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-900 dark:border-emerald-500/80 dark:bg-emerald-400/25 dark:text-emerald-200">
          ✅ Cleared
        </span>
        {result ? (
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-200">
            {result === "win" ? "Win" : "Loss"}
          </span>
        ) : completed ? (
          <span className="text-xs uppercase tracking-[0.2em] text-brand-muted dark:text-white/60">
            Synced
          </span>
        ) : null}
      </div>
    );
  }

  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-strong dark:border-brand/60 dark:bg-brand/20 dark:text-brand-foreground">
        ▶️ In play
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border-light/70 bg-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted dark:border-border-dark/60 dark:text-white/60">
      ⏳ Queued
    </span>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "rose";
}) {
  const accentStyles =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-400/10 dark:text-emerald-200"
      : accent === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/70 dark:bg-rose-400/10 dark:text-rose-200"
      : "border-border-light/60 bg-surface text-brand-strong dark:border-border-dark/60 dark:bg-surface-muted dark:text-white";

  return (
    <div className={cn("flex items-center justify-between rounded-brand-md border px-3 py-2", accentStyles)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
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
      {game.component ? (
        <span className="inline-flex w-fit items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200">
          Play in browser
        </span>
      ) : null}
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
    component: undefined,
  };
}

function humanizeId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDisplayDurationSeconds(startedAt: Date, endedAt: Date | null, liveElapsed: number) {
  if (endedAt) {
    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  }
  return liveElapsed;
}

function formatDurationLabel(seconds: number) {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
