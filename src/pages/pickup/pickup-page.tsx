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

  return (
    <div>
      {/* Page hero */}
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pickup Soccer
            </h1>
            <p className="mt-1 text-white/80">
              Create a game, share the link, and RSVP in one click.
            </p>
          </div>
          <Link
            to="/new"
            className="shrink-0 px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
            title="Create a new game"
          >
            + Create Game
          </Link>
        </div>
      </div>

      {/* Status area */}
      {loading && <div className="mt-4">Loading…</div>}
      {err && <div className="mt-4 text-red-600 text-sm">Error: {err}</div>}

      {/* Empty state */}
      {!loading && !err && !games.length && (
        <div className="mt-6 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-6 text-center">
          <div className="text-3xl">🟦</div>
          <h3 className="mt-2 text-lg font-semibold">No upcoming games</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Be the first to post one for this week.
          </p>
          <Link
            to="/new"
            className="inline-flex mt-4 px-3 py-1.5 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
          >
            Create Game
          </Link>
        </div>
      )}

      {/* Games list */}
      <div className="mt-6 grid gap-4">
        {games.map((g) => (
          <GameCard key={g.id} game={g} user={user} />
        ))}
      </div>
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
    <div className="border rounded-xl p-5 bg-white dark:bg-gray-900 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{game.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              📍 {game.fieldName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              🕒 {dateStr}
            </span>
            {user?.uid === game.organizerUid && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-brand-light text-white dark:bg-brand-dark">
                👑 Organizer
              </span>
            )}
          </div>
        </div>

        {/* Spots summary */}
        <div className="text-right">
          <div className="text-sm">
            <strong className="text-brand">{goingCount}</strong> / {game.maxPlayers}
          </div>
          {full ? (
            <span className="text-xs text-brand font-medium">Full</span>
          ) : (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {game.maxPlayers - goingCount} spots left
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-2 bg-slate-600 dark:bg-slate-300 rounded transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setRSVP("going")}
          className={`px-3 py-1.5 rounded-lg border ${
            myStatus === "going"
              ? "bg-brand-light text-white border-brand-light hover:bg-brand dark:bg-brand-dark dark:border-brand-dark dark:hover:bg-brand"
              : "hover:bg-gray-50 dark:hover:bg-white/10"
          }`}
          disabled={!user || full}
          title={!user ? "Sign in to RSVP" : full ? "Game is full" : ""}
        >
          I’m in
        </button>

        <button
          onClick={() => setRSVP("maybe")}
          className={`px-3 py-1.5 rounded-lg border ${
            myStatus === "maybe"
              ? "bg-brand-light text-white border-brand-light hover:bg-brand dark:bg-brand-dark dark:border-brand-dark dark:hover:bg-brand"
              : "hover:bg-gray-50 dark:hover:bg-white/10"
          }`}
          disabled={!user}
        >
          Maybe
        </button>

        <button
          onClick={() => setRSVP("out")}
          className={`px-3 py-1.5 rounded-lg border ${
            myStatus === "out"
              ? "bg-brand-light text-white border-brand-light hover:bg-brand dark:bg-brand-dark dark:border-brand-dark dark:hover:bg-brand"
              : "hover:bg-gray-50 dark:hover:bg-white/10"
          }`}
          disabled={!user}
        >
          Out
        </button>
      </div>
    </div>
  );
}
