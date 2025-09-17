import { useEffect, useMemo, useState } from "react";
import { db } from "../../shared/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { useOutletContext, Link } from "react-router-dom";
import type { User } from "firebase/auth";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

type Ctx = { user: User | null };

type Game = {
  id: string;
  title: string;
  dateTime: any;
  fieldName: string;
  maxPlayers: number;
  organizerUid: string;
  status: "open" | "full" | "cancelled";
};

export default function Pickup() {
  const { user } = useOutletContext<Ctx>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const totalSpots = useMemo(
    () => games.reduce((sum, game) => sum + game.maxPlayers, 0),
    [games]
  );

  useEffect(() => {
    const q = query(
      collection(db, "games"),
      where("status", "==", "open"),
      orderBy("dateTime", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Game[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setGames(list);
        setErr(null);
        setLoading(false);
      },
      (e) => {
        setErr(e.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const nextGame = games[0] ?? null;
  const nextGameMs = nextGame
    ? nextGame.dateTime?.seconds
      ? nextGame.dateTime.seconds * 1000
      : Number(nextGame.dateTime)
    : null;

  return (
    <div className="space-y-8">
      <PageHero
        icon="⚽"
        title="Pickup Soccer"
        description="Create a game, share the link, and let friends RSVP in one click. Keep track of spots remaining in real time."
        actions={
          <Link to="/new" className={buttonStyles({ size: "sm" })}>
            + Create game
          </Link>
        }
        stats={
          <>
            <StatPill>Open games · {games.length}</StatPill>
            <StatPill>
              {totalSpots ? `${totalSpots} total spots` : "Add your game"}
            </StatPill>
            {nextGameMs ? (
              <StatPill>
                Next: {new Date(nextGameMs).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </StatPill>
            ) : null}
          </>
        }
      />

      <PageSection
        title="Upcoming games"
        description="Browse open sessions and RSVP instantly."
        contentClassName="grid gap-4"
      >
        {loading ? (
          <LoadingState />
        ) : err ? (
          <ErrorState message={err} />
        ) : !games.length ? (
          <EmptyState />
        ) : (
          games.map((g) => <GameCard key={g.id} game={g} user={user} />)
        )}
      </PageSection>
    </div>
  );
}

function GameCard({ game, user }: { game: Game; user: User | null }) {
  const [goingCount, setGoingCount] = useState(0);
  const [myStatus, setMyStatus] = useState<"going" | "maybe" | "out" | "none">(
    "none"
  );

  const ms = game.dateTime?.seconds
    ? game.dateTime.seconds * 1000
    : Number(game.dateTime);
  const dateStr = useMemo(() => {
    const d = new Date(ms);
    const day = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${day} • ${time}`;
  }, [ms]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rsvpsCol = collection(db, "games", game.id, "rsvps");
      const all = await getDocs(rsvpsCol);
      const going = all.docs.filter(
        (d) => (d.data() as any).status === "going"
      ).length;
      if (!cancelled) setGoingCount(going);

      if (user) {
        const mine = all.docs.find((d) => d.id === user.uid);
        setMyStatus(mine ? (mine.data() as any).status : "none");
      } else {
        setMyStatus("none");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game.id, user?.uid]);

  const full = goingCount >= game.maxPlayers;
  const pct = Math.max(
    0,
    Math.min(100, Math.round((goingCount / game.maxPlayers) * 100))
  );

  const setRSVP = async (status: "going" | "maybe" | "out") => {
    if (!user) {
      alert("Please sign in first");
      return;
    }
    if (status === "going" && full) {
      alert("This game is full.");
      return;
    }
    await setDoc(
      doc(db, "games", game.id, "rsvps", user.uid),
      { status, joinedAt: serverTimestamp() },
      { merge: true }
    );
    setMyStatus(status);

    const rsvpsCol = collection(db, "games", game.id, "rsvps");
    const all = await getDocs(rsvpsCol);
    const going = all.docs.filter(
      (d) => (d.data() as any).status === "going"
    ).length;
    setGoingCount(going);
  };

  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-strong dark:text-white">{game.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-muted">
              <span className="inline-flex items-center gap-1 rounded-brand-full bg-surface/70 px-3 py-1">
                📍 {game.fieldName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-brand-full bg-surface/70 px-3 py-1">
                🕒 {dateStr}
              </span>
              {user?.uid === game.organizerUid && (
                <span className="inline-flex items-center gap-1 rounded-brand-full bg-brand/15 px-3 py-1 text-brand">
                  👑 Organizer
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-brand">{goingCount}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-muted">of {game.maxPlayers} spots</div>
            <div className="mt-1 text-xs text-brand-subtle">
              {full ? "Roster full" : `${game.maxPlayers - goingCount} spots left`}
            </div>
          </div>
        </header>

        <div className="h-2 rounded-brand-full bg-surface/60">
          <div
            className="h-2 rounded-brand-full bg-brand/80 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRSVP("going")}
            className={cn(
              buttonStyles({ variant: "primary", size: "sm" }),
              myStatus === "going"
                ? ""
                : "bg-brand/20 text-brand-strong hover:bg-brand/30 dark:text-white"
            )}
            disabled={!user || full}
            title={!user ? "Sign in to RSVP" : full ? "Game is full" : ""}
          >
            I’m in
          </button>
          <button
            onClick={() => setRSVP("maybe")}
            className={cn(
              buttonStyles({ variant: "secondary", size: "sm" }),
              myStatus === "maybe"
                ? "border-brand text-brand"
                : "hover:border-brand/40"
            )}
            disabled={!user}
          >
            Maybe
          </button>
          <button
            onClick={() => setRSVP("out")}
            className={cn(
              buttonStyles({ variant: "ghost", size: "sm" }),
              myStatus === "out" ? "bg-surface/80 text-brand-strong" : ""
            )}
            disabled={!user}
          >
            Out
          </button>
        </div>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card padding="lg" className="animate-pulse text-sm text-brand-muted">
      Loading games…
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card padding="lg" className="text-sm text-red-500">
      Error: {message}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card padding="lg" className="text-center">
      <div className="text-3xl">🟦</div>
      <h3 className="mt-3 text-lg font-semibold text-brand-strong dark:text-white">
        No upcoming games
      </h3>
      <p className="mt-2 text-sm text-brand-muted">
        Be the first to post one for this week.
      </p>
      <Link to="/new" className={cn(buttonStyles({ size: "sm" }), "mt-4 inline-flex")}>Create game</Link>
    </Card>
  );
}
