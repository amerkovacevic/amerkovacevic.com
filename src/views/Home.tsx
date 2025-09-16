import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp, getDocs
} from "firebase/firestore";
import { useOutletContext } from "react-router-dom";
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

export default function Home() {
  const { user } = useOutletContext<Ctx>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "games"),
      where("status", "==", "open"),
      orderBy("dateTime", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Game[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setGames(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!games.length) return <div className="text-gray-600">No upcoming games.</div>;

  return (
    <div className="grid gap-4">
      {games.map(g => <GameCard key={g.id} game={g} user={user} />)}
    </div>
  );
}

function GameCard({ game, user }: { game: Game; user: User | null; }) {
  const [goingCount, setGoingCount] = useState(0);
  const [myStatus, setMyStatus] = useState<"going"|"maybe"|"out"|"none">("none");
  const dateStr = useMemo(() => {
    const ms = game.dateTime?.seconds ? game.dateTime.seconds * 1000 : Number(game.dateTime);
    return new Date(ms).toLocaleString();
  }, [game.dateTime]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rsvpsCol = collection(db, "games", game.id, "rsvps");
      const all = await getDocs(rsvpsCol);
      const going = all.docs.filter(d => (d.data() as any).status === "going").length;
      if (!cancelled) setGoingCount(going);

      if (user) {
        const mine = all.docs.find(d => d.id === user.uid);
        setMyStatus(mine ? (mine.data() as any).status : "none");
      } else {
        setMyStatus("none");
      }
    })();
    return () => { cancelled = true; };
  }, [game.id, user?.uid]);

  const full = goingCount >= game.maxPlayers;

  const setRSVP = async (status: "going"|"maybe"|"out") => {
    if (!user) { alert("Please sign in first"); return; }
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
    const going = all.docs.filter(d => (d.data() as any).status === "going").length;
    setGoingCount(going);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{game.title}</h3>
        <span className="text-sm text-gray-600">{game.fieldName}</span>
      </div>
      <div className="mt-1 text-sm">{dateStr}</div>
      <div className="mt-2 text-sm">
        <strong>{goingCount}</strong> going / {game.maxPlayers} spots
        {full && <span className="ml-2 text-red-600 font-medium">Full</span>}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setRSVP("going")}
          className={`px-3 py-1.5 rounded border ${myStatus==="going" ? "bg-gray-900 text-white" : ""}`}
          disabled={!user || full}
          title={!user ? "Sign in to RSVP" : full ? "Game is full" : ""}
        >I’m in</button>
        <button
          onClick={() => setRSVP("maybe")}
          className={`px-3 py-1.5 rounded border ${myStatus==="maybe" ? "bg-gray-900 text-white" : ""}`}
          disabled={!user}
        >Maybe</button>
        <button
          onClick={() => setRSVP("out")}
          className={`px-3 py-1.5 rounded border ${myStatus==="out" ? "bg-gray-900 text-white" : ""}`}
          disabled={!user}
        >Out</button>
      </div>

      {user?.uid === game.organizerUid && (
        <div className="mt-3 text-xs text-gray-500">You are the organizer.</div>
      )}
    </div>
  );
}