import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { db } from "../../shared/lib/firebase";
import {
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useOutletContext, Link } from "react-router-dom";
import type { User } from "firebase/auth";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

// Pickup surfaces all open community games, keeps the roster updated via
// Firestore listeners, and lets signed-in users manage their RSVP status.

type Ctx = { user: User | null };

// Snapshot of a pickup game document; `dateTime` may already be materialized
// into a JS timestamp depending on where the data originated.
export type Game = {
  id: string;
  title: string;
  dateTime: Timestamp | number;
  fieldName: string;
  maxPlayers: number;
  organizerUid: string;
  status: "open" | "full" | "cancelled";
  guests?: number | null;
};

const MotionLink = motion(Link);
const MotionButton = motion.button;

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
    // Subscribe to live updates for all open games so the lobby reacts instantly
    // when another player signs up.
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
  const nextGameDate = useMemo(() => toDate(nextGame?.dateTime ?? null), [
    nextGame?.dateTime,
  ]);

  return (
    <div className="space-y-8">
      <PageHero
        icon="⚽"
        title="Pickup Soccer"
        description="Create a game, share the link, and let friends RSVP in one click. Keep track of spots remaining in real time."
        actions={<CreateGameButton />}
        stats={
          <>
            <StatPill>Open games · {games.length}</StatPill>
            <StatPill>
              {totalSpots ? `${totalSpots} total spots` : "Add your game"}
            </StatPill>
            {nextGameDate ? (
              <StatPill>
                Next: {nextGameDate.toLocaleString([], {
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

// GameCard renders a single lobby entry and exposes RSVP controls.
function GameCard({ game, user }: { game: Game; user: User | null }) {
  const [goingCount, setGoingCount] = useState(0);
  const [myStatus, setMyStatus] = useState<"going" | "maybe" | "out" | "none">(
    "none"
  );
  const [guestCount, setGuestCount] = useState(0);
  const [myGuestSnapshot, setMyGuestSnapshot] = useState(0);

  const gameDate = useMemo(() => toDate(game.dateTime), [game.dateTime]);
  const dateStr = useMemo(() => {
    const d = gameDate ?? new Date();
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
  }, [gameDate]);

  useEffect(() => {
    // Listen to the RSVP subcollection so seats remaining update in real time
    // without reloading the whole page.
    const rsvpsCol = collection(db, "games", game.id, "rsvps");
    const unsubscribe = onSnapshot(rsvpsCol, (snap) => {
      let going = 0;
      let my = "none" as "going" | "maybe" | "out" | "none";
      let myGuests = 0;
      snap.forEach((d) => {
        const status = (d.data() as any)?.status as
          | "going"
          | "maybe"
          | "out"
          | undefined;
        const guests = normalizeGuests((d.data() as any)?.guests);
        if (status === "going") going += 1 + guests;
        if (user && d.id === user.uid) {
          my = status ?? "none";
          myGuests = status === "going" ? guests : 0;
        }
      });
      setGoingCount(going);
      if (user) {
        setMyStatus(my);
        setGuestCount(my === "going" ? myGuests : 0);
        setMyGuestSnapshot(my === "going" ? myGuests : 0);
      } else {
        setMyStatus("none");
        setGuestCount(0);
        setMyGuestSnapshot(0);
      }
    });
    return () => unsubscribe();
  }, [game.id, user?.uid]);

  const spotsLeft = Math.max(game.maxPlayers - goingCount, 0);
  const full = spotsLeft <= 0;
  const pct = Math.max(
    0,
    Math.min(100, Math.round((goingCount / game.maxPlayers) * 100))
  );

  const setRSVP = async (status: "going" | "maybe" | "out") => {
    // Guardrails ensure anonymous users cannot mutate Firestore and that
    // we respect the roster size.
    if (!user) {
      alert("Please sign in first");
      return;
    }
    const guests = normalizeGuests(status === "going" ? guestCount : 0);
    if (status === "going") {
      const currentWithoutMe =
        goingCount - (myStatus === "going" ? 1 + myGuestSnapshot : 0);
      if (currentWithoutMe + 1 + guests > game.maxPlayers) {
        alert("Not enough spots remaining for you and your guests.");
        return;
      }
    }
    try {
      const name =
        user.displayName?.trim() ||
        user.email?.split("@")[0]?.trim() ||
        "Player";
      await setDoc(
        doc(db, "games", game.id, "rsvps", user.uid),
        {
          status,
          guests,
          joinedAt: serverTimestamp(),
          name,
        },
        { merge: true }
      );
      if (status !== "going") {
        setGuestCount(0);
        setMyGuestSnapshot(0);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update RSVP. Please try again.");
    }
  };

  const handleGuestChange = async (value: number) => {
    // Persist guest counts on change so the organizer always has the latest
    // headcount without additional save buttons.
    const guests = normalizeGuests(value);
    setGuestCount(guests);
    if (!user || myStatus !== "going") return;

    const currentWithoutMe =
      goingCount - (myStatus === "going" ? 1 + myGuestSnapshot : 0);
    if (currentWithoutMe + 1 + guests > game.maxPlayers) {
      alert("Not enough spots remaining for your guest selection.");
      setGuestCount(myGuestSnapshot);
      return;
    }

    try {
      await setDoc(
        doc(db, "games", game.id, "rsvps", user.uid),
        { guests },
        { merge: true }
      );
      setMyGuestSnapshot(guests);
    } catch (error) {
      console.error(error);
      alert("Failed to update guest count. Please try again.");
      setGuestCount(myGuestSnapshot);
    }
  };

  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-strong dark:text-white">{game.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-muted dark:text-brand-subtle">
              <span className="inline-flex items-center gap-1 rounded-brand-full border border-border-light/60 bg-surface/80 px-3 py-1 text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80 dark:text-white">
                📍 {game.fieldName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-brand-full border border-border-light/60 bg-surface/80 px-3 py-1 text-brand-strong shadow-brand-sm dark:border-border-dark/60 dark:bg-surface-overlayDark/80 dark:text-white">
                🕒 {dateStr}
              </span>
              {user?.uid === game.organizerUid && (
                <span className="inline-flex items-center gap-1 rounded-brand-full border border-brand/30 bg-brand/15 px-3 py-1 text-brand shadow-brand-sm dark:border-brand/50 dark:bg-brand/30 dark:text-brand-foreground">
                  👑 Organizer
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-brand dark:text-brand-foreground">
              {goingCount}
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-muted dark:text-brand-subtle">of {game.maxPlayers} spots</div>
            <div className="mt-1 text-xs text-brand-subtle">
              {full ? "Roster full" : `${spotsLeft} spots left`}
            </div>
            {user?.uid === game.organizerUid ? (
            <MotionLink
              to={`/tools/pickup/${game.id}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                  className: "mt-3",
                })}
              >
                Manage game
              </MotionLink>
            ) : null}
          </div>
        </header>

        <div className="h-2 rounded-brand-full bg-surface/60">
          <div
            className="h-2 rounded-brand-full bg-brand/80 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <MotionButton
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRSVP("going")}
            className={cn(
              buttonStyles({ variant: "secondary", size: "sm" }),
              myStatus === "going"
                ? "border-emerald-300 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300/80 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/70"
                : "text-brand-strong dark:text-brand-foreground"
            )}
            disabled={!user || full}
            title={!user ? "Sign in to RSVP" : full ? "Game is full" : ""}
          >
            I’m in
          </MotionButton>
          {user ? (
            <label className="flex items-center gap-2 text-xs text-brand-muted dark:text-brand-subtle">
              Guests
              <select
                value={guestCount}
                onChange={(event) =>
                  handleGuestChange(Number(event.target.value))
                }
                className="h-8 rounded-brand border border-border-light bg-surface px-2 text-sm font-medium text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand dark:border-border-dark dark:bg-surface-overlayDark dark:text-brand-foreground"
              >
                {[0, 1, 2, 3].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <MotionButton
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRSVP("maybe")}
            className={cn(
              buttonStyles({ variant: "secondary", size: "sm" }),
              myStatus === "maybe"
                ? "border-amber-300 bg-amber-100 text-amber-800 ring-2 ring-amber-300/80 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/70"
                : "text-brand-strong dark:text-brand-foreground"
            )}
            disabled={!user}
          >
            Maybe
          </MotionButton>
          <MotionButton
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setRSVP("out")}
            className={cn(
              buttonStyles({ variant: "secondary", size: "sm" }),
              myStatus === "out"
                ? "border-red-300 bg-red-100 text-red-700 ring-2 ring-red-300/80 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-500/70"
                : "text-brand-strong dark:text-brand-foreground"
            )}
            disabled={!user}
          >
            Out
          </MotionButton>
        </div>
      </div>
    </Card>
  );
}

// Skeleton card shown while Firestore fetches the game list.
function LoadingState() {
  return (
    <Card padding="lg" className="animate-pulse text-sm text-brand-muted dark:text-brand-subtle">
      Loading games…
    </Card>
  );
}

// Friendly error message when the games query fails.
function ErrorState({ message }: { message: string }) {
  return (
    <Card padding="lg" className="text-sm text-red-500">
      Error: {message}
    </Card>
  );
}

// Prompt when no games are scheduled yet.
function EmptyState() {
  return (
    <Card padding="lg" className="text-center">
      <div className="text-3xl">🟦</div>
      <h3 className="mt-3 text-lg font-semibold text-brand-strong dark:text-white">
        No upcoming games
      </h3>
      <p className="mt-2 text-sm text-brand-muted dark:text-brand-subtle">
        Be the first to post one for this week.
      </p>
      <CreateGameButton className="mt-4" />
    </Card>
  );
}

// Shared CTA used both in the hero and empty state.
function CreateGameButton({ className }: { className?: string }) {
  return (
    <MotionLink
      to="/tools/new"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        buttonStyles({ variant: "secondary", size: "sm" }),
        "inline-flex items-center gap-2 rounded-brand-full",
        className
      )}
    >
      <Plus className="h-4 w-4" />
      Create game
    </MotionLink>
  );
}

// Utility to coerce Firestore timestamps, epoch numbers, or nullish values
// into a plain Date object when possible.
export function toDate(value: Timestamp | number | null | undefined) {
  if (!value && value !== 0) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof (value as any)?.toDate === "function")
    return (value as { toDate: () => Date }).toDate();
  return null;
}

// Guest selections come from <select> elements; normalize whatever shape we
// receive into a safe integer between 0 and 3.
function normalizeGuests(value: unknown) {
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return clampGuestValue(value);
    }
    return 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return clampGuestValue(parsed);
  }
  return 0;
}

function clampGuestValue(value: number) {
  const clamped = Math.max(0, Math.min(3, Math.trunc(value)));
  return clamped;
}
