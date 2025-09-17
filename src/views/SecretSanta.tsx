import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

type Ctx = { user: User | null };

type EventDoc = {
  id: string;
  name: string;
  exchangeDate?: Timestamp | null;
  joinCode: string;
  organizerUid: string;
  createdAt: any;
};

type Member = { uid: string; name: string; email: string };

export default function SecretSanta() {
  const { user } = useOutletContext<Ctx>();
  const [tab, setTab] = useState<"create" | "join" | "event">("create");
  const [activeEvent, setActiveEvent] = useState<EventDoc | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myMatch, setMyMatch] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // live members + my assignment
  useEffect(() => {
    if (!activeEvent) return;
    const unsub = onSnapshot(
      collection(db, "santaEvents", activeEvent.id, "members"),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          return { uid: d.id, name: data.name, email: data.email } as Member;
        });
        setMembers(list);
      }
    );
    (async () => {
      if (!user) return;
      const myAssignRef = doc(
        db,
        "santaEvents",
        activeEvent.id,
        "assignments",
        user.uid
      );
      const my = await getDoc(myAssignRef);
      if (my.exists()) {
        const recUid = (my.data() as any).recipientUid as string;
        const rec = await getDoc(
          doc(db, "santaEvents", activeEvent.id, "members", recUid)
        );
        if (rec.exists()) {
          const d = rec.data() as any;
          setMyMatch({ uid: rec.id, name: d.name, email: d.email });
        }
      } else {
        setMyMatch(null);
      }
    })();
    return () => unsub();
  }, [activeEvent?.id, user?.uid]);

  const canDraw = useMemo(
    () => !!activeEvent && user?.uid === activeEvent.organizerUid && members.length >= 2,
    [activeEvent, user?.uid, members.length]
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setErr("Please sign in.");
      return;
    }
    const form = e.currentTarget as HTMLFormElement & {
      name: HTMLInputElement;
      date: HTMLInputElement;
    };
    const name = form.name.value.trim();
    const dateStr = form.date.value;

    const joinCode = makeCode(6);
    setLoading(true);
    setErr(null);
    try {
      const ref = await addDoc(collection(db, "santaEvents"), {
        name,
        exchangeDate: dateStr ? Timestamp.fromDate(new Date(dateStr)) : null,
        joinCode,
        organizerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // organizer auto-joins
      await setDoc(doc(db, "santaEvents", ref.id, "members", user.uid), {
        name: user.displayName ?? "Anonymous",
        email: user.email ?? "",
      });

      setActiveEvent({
        id: ref.id,
        name,
        exchangeDate: dateStr ? Timestamp.fromDate(new Date(dateStr)) : null,
        joinCode,
        organizerUid: user.uid,
        createdAt: null,
      });
      setTab("event");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setErr("Please sign in.");
    const form = e.currentTarget as HTMLFormElement & {
      code: HTMLInputElement;
      displayName: HTMLInputElement;
    };
    const code = form.code.value.trim().toUpperCase();
    const displayName = form.displayName.value.trim() || user.displayName || "Anonymous";
    setLoading(true);
    setErr(null);
    try {
      const q = query(collection(db, "santaEvents"), where("joinCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No event found for that code.");
      const evRef = snap.docs[0];
      await setDoc(doc(db, "santaEvents", evRef.id, "members", user.uid), {
        name: displayName,
        email: user.email ?? "",
      }, { merge: true });
      const evData = evRef.data() as any;
      setActiveEvent({
        id: evRef.id,
        name: evData.name,
        exchangeDate: evData.exchangeDate ?? null,
        joinCode: evData.joinCode,
        organizerUid: evData.organizerUid,
        createdAt: evData.createdAt,
      });
      setTab("event");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runDraw = async () => {
    if (!activeEvent || !canDraw) return;
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocs(collection(db, "santaEvents", activeEvent.id, "members"));
      const people: Member[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return { uid: d.id, name: data.name, email: data.email };
      });
      if (people.length < 2) throw new Error("Need at least 2 members.");

      const givers = [...people];
      const receivers = shuffle([...people]);

      // fix self-assignments
      for (let tries = 0; tries < 10; tries++) {
        const selfHit = givers.some((g, i) => g.uid === receivers[i].uid);
        if (!selfHit) break;
        receivers.push(receivers.shift()!);
      }
      if (givers.some((g, i) => g.uid === receivers[i].uid)) {
        const n = receivers.length;
        [receivers[n - 1], receivers[n - 2]] = [receivers[n - 2], receivers[n - 1]];
      }

      await Promise.all(
        givers.map((g, i) =>
          setDoc(
            doc(db, "santaEvents", activeEvent.id, "assignments", g.uid),
            { recipientUid: receivers[i].uid, assignedAt: serverTimestamp() },
            { merge: true }
          )
        )
      );

      if (user) {
        const my = await getDoc(doc(db, "santaEvents", activeEvent.id, "assignments", user.uid));
        if (my.exists()) {
          const recUid = (my.data() as any).recipientUid as string;
          const rec = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
          if (rec.exists()) {
            const d = rec.data() as any;
            setMyMatch({ uid: rec.id, name: d.name, email: d.email });
          }
        }
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header card */}
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Secret Santa — Soccer Jerseys</h1>
        <p className="mt-1 text-white/80">Create a group, invite with a code, and auto-assign matches.</p>
      </div>

      {!activeEvent && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTab("create")}
            className={`px-3 py-1.5 rounded-lg border ${tab==="create" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}
          >
            Create event
          </button>
          <button
            onClick={() => setTab("join")}
            className={`px-3 py-1.5 rounded-lg border ${tab==="join" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}
          >
            Join with code
          </button>
        </div>
      )}

      {err && <div className="mt-4 text-red-600 text-sm">Error: {err}</div>}
      {loading && <div className="mt-4">Working…</div>}

      {/* Create form */}
      {!activeEvent && tab === "create" && (
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 max-w-md">
          <input
            name="name"
            placeholder="e.g., Jerseys 2025"
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
            required
          />
          <label className="text-sm">
            Exchange date
            <input
              name="date"
              type="date"
              className="mt-1 border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
            />
          </label>
          <button className="px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand" disabled={!user || loading}>
            Create & get join code
          </button>
          {!user && <div className="text-sm text-red-600">Sign in to create an event.</div>}
        </form>
      )}

      {/* Join form */}
      {!activeEvent && tab === "join" && (
        <form onSubmit={handleJoin} className="mt-4 grid gap-3 max-w-md">
          <input
            name="code"
            placeholder="Join code (e.g., 7FQK9C)"
            className="uppercase border rounded-lg px-3 py-2 tracking-widest focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
            required
          />
          <input
            name="displayName"
            placeholder="Your display name"
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
          />
          <button className="px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand" disabled={!user || loading}>
            Join event
          </button>
          {!user && <div className="text-sm text-red-600">Sign in to join.</div>}
        </form>
      )}

      {/* Event view */}
      {activeEvent && (
        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{activeEvent.name}</h2>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {activeEvent.exchangeDate
                    ? `Exchange: ${new Date(activeEvent.exchangeDate.seconds * 1000).toLocaleDateString()}`
                    : "Date: TBA"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-300">Join code</div>
                <code className="inline-block mt-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono tracking-widest">
                  {activeEvent.joinCode}
                </code>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium">Members ({members.length})</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.map((m) => (
                  <span
                    key={m.uid}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    🧑 {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {canDraw && (
                <button
                  onClick={runDraw}
                  className="px-3 py-1.5 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
                  disabled={loading}
                >
                  Run draw
                </button>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Only the organizer can run the draw. Each person sees only their own match.
              </span>
            </div>
          </div>

          {/* My assignment */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
            <h3 className="text-sm font-medium mb-2">Your match</h3>
            {myMatch ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{myMatch.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{myMatch.email}</div>
                </div>
                <span className="rounded-lg px-2 py-1 text-xs bg-brand-light text-white dark:bg-brand-dark">
                  🎁 Buy a jersey
                </span>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                No assignment yet. Ask the organizer to run the draw.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function makeCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
