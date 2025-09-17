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
  exchangeDate: Timestamp | null;
  joinCode: string;
  organizerUid: string;
  createdAt: unknown;
};

type Member = { uid: string; name: string; email: string };

export default function SecretSanta() {
  const { user } = useOutletContext<Ctx>();

  const [tab, setTab] = useState<"create" | "join" | "event">("create");

  // event identity & data
  const [eventId, setEventId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDoc | null>(null);

  // live data
  const [members, setMembers] = useState<Member[]>([]);
  const [myMatch, setMyMatch] = useState<Member | null>(null);

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** ---------- Bootstrap: restore eventId if we have one ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("santaEventId");
    if (saved) {
      setEventId(saved);
      setTab("event");
    }
  }, []);

  /** ---------- Subscribe to the event doc when we have an id ---------- */
  useEffect(() => {
    if (!eventId) {
      setActiveEvent(null);
      return;
    }
    const ref = doc(db, "santaEvents", eventId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setActiveEvent(null);
        return;
      }
      const d = snap.data() as {
        name?: string;
        exchangeDate?: Timestamp | null;
        joinCode?: string;
        organizerUid?: string;
        createdAt?: unknown;
      };
      setActiveEvent({
        id: snap.id,
        name: d?.name ?? "Event",
        exchangeDate: d?.exchangeDate ?? null,
        joinCode: d?.joinCode ?? "",
        organizerUid: d?.organizerUid ?? "",
        createdAt: d?.createdAt ?? null,
      });
    });
    return () => unsub();
  }, [eventId]);

  /** ---------- Members subscription & my assignment fetch ---------- */
  useEffect(() => {
    if (!activeEvent) return;

    const unsub = onSnapshot(
      collection(db, "santaEvents", activeEvent.id, "members"),
      (snap) => {
        const list: Member[] = snap.docs.map((d) => {
          const data = d.data() as { name?: string; email?: string } | undefined;
          return {
            uid: d.id,
            name: data?.name ?? "Unknown",
            email: data?.email ?? "",
          };
        });
        setMembers(list);
      }
    );

    // fetch my assignment (if any)
    (async () => {
      if (!user) {
        setMyMatch(null);
        return;
      }
      const myRef = doc(db, "santaEvents", activeEvent.id, "assignments", user.uid);
      const mySnap = await getDoc(myRef);
      if (!mySnap.exists()) {
        setMyMatch(null);
        return;
      }
      const recUid = (mySnap.data() as { recipientUid: string } | undefined)?.recipientUid;
      if (!recUid) {
        setMyMatch(null);
        return;
      }
      const recSnap = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
      if (!recSnap.exists()) {
        setMyMatch(null);
        return;
      }
      const rd = recSnap.data() as { name?: string; email?: string } | undefined;
      setMyMatch({ uid: recSnap.id, name: rd?.name ?? "Unknown", email: rd?.email ?? "" });
    })();

    return () => unsub();
  }, [activeEvent?.id, user?.uid]);

  /** ---------- Derived permissions/state ---------- */
  const isOrganizer = useMemo(
    () => Boolean(activeEvent && user && user.uid === activeEvent.organizerUid),
    [activeEvent, user]
  );
  const hasEnoughMembers = members.length >= 2;
  const canDraw = isOrganizer && hasEnoughMembers;

  /** ---------- Create an event (organizer auto-joins) ---------- */
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
    if (!name) {
      setErr("Please enter a name.");
      return;
    }
    const dateStr = form.date.value;
    const exchangeDate = dateStr ? Timestamp.fromDate(new Date(dateStr)) : null;

    setLoading(true);
    setErr(null);
    try {
      const joinCode = makeCode(6);
      const eventRef = await addDoc(collection(db, "santaEvents"), {
        name,
        exchangeDate,
        joinCode,
        organizerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // organizer joins
      await setDoc(doc(db, "santaEvents", eventRef.id, "members", user.uid), {
        name: user.displayName ?? "Anonymous",
        email: user.email ?? "",
      });

      // persist & let the subscription populate activeEvent
      setEventId(eventRef.id);
      localStorage.setItem("santaEventId", eventRef.id);
      setTab("event");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------- Join via code ---------- */
  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setErr("Please sign in.");
      return;
    }
    const form = e.currentTarget as HTMLFormElement & {
      code: HTMLInputElement;
      displayName: HTMLInputElement;
    };
    const code = form.code.value.trim().toUpperCase();
    const displayName = (form.displayName.value || user.displayName || "Anonymous").trim();
    if (!code) {
      setErr("Enter a join code.");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const q = query(collection(db, "santaEvents"), where("joinCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No event found for that code.");
      const evSnap = snap.docs[0];

      // add/merge me into members
      await setDoc(
        doc(db, "santaEvents", evSnap.id, "members", user.uid),
        { name: displayName, email: user.email ?? "" },
        { merge: true }
      );

      // persist & let the subscription populate activeEvent
      setEventId(evSnap.id);
      localStorage.setItem("santaEventId", evSnap.id);
      setTab("event");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to join event.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------- Run the draw (organizer only) ---------- */
  const runDraw = async () => {
    if (!activeEvent || !isOrganizer) return;
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocs(collection(db, "santaEvents", activeEvent.id, "members"));
      const people: Member[] = snap.docs.map((d) => {
        const data = d.data() as { name?: string; email?: string } | undefined;
        return { uid: d.id, name: data?.name ?? "Unknown", email: data?.email ?? "" };
      });
      if (people.length < 2) throw new Error("Need at least 2 members.");

      const givers: Member[] = [...people];
      let receivers: Member[] = shuffle([...people]);

      const hasSelfAssignments = (A: Member[], B: Member[]) => {
        const n = Math.min(A.length, B.length);
        for (let i = 0; i < n; i++) {
          const a = A[i];
          const b = B[i];
          if (!a || !b) return true;
          if (a.uid === b.uid) return true;
        }
        return false;
      };

      // attempt to rotate to remove self-assignments
      for (let tries = 0; tries < 12 && hasSelfAssignments(givers, receivers); tries++) {
        const first = receivers.shift();
        if (first) receivers.push(first);
      }

      // last-resort swap
      if (hasSelfAssignments(givers, receivers)) {
        const n = receivers.length;
        if (n >= 2) {
          const a = receivers[n - 1];
          const b = receivers[n - 2];
          if (a && b) {
            receivers[n - 1] = b;
            receivers[n - 2] = a;
          }
        }
      }

      if (receivers.length !== givers.length) {
        throw new Error("Internal pairing error: list lengths differ.");
      }

      await Promise.all(
        givers.map((g, i) => {
          const r = receivers[i];
          if (!r) throw new Error("Internal pairing error: missing receiver.");
          return setDoc(
            doc(db, "santaEvents", activeEvent.id, "assignments", g.uid),
            { recipientUid: r.uid, assignedAt: serverTimestamp() },
            { merge: true }
          );
        })
      );

      // refresh my match if I'm in the event
      if (user) {
        const my = await getDoc(doc(db, "santaEvents", activeEvent.id, "assignments", user.uid));
        if (my.exists()) {
          const recUid = (my.data() as { recipientUid?: string })?.recipientUid;
          if (recUid) {
            const recSnap = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
            if (recSnap.exists()) {
              const d = recSnap.data() as { name?: string; email?: string } | undefined;
              setMyMatch({ uid: recSnap.id, name: d?.name ?? "Unknown", email: d?.email ?? "" });
            }
          }
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to run draw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Secret Santa — Soccer Jerseys</h1>
        <p className="mt-1 text-white/80">Create a group, invite with a code, and auto-assign matches.</p>
      </div>

      {/* Tabs */}
      {!activeEvent && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTab("create")}
            className={`px-3 py-1.5 rounded-lg border ${
              tab === "create" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"
            }`}
          >
            Create event
          </button>
          <button
            onClick={() => setTab("join")}
            className={`px-3 py-1.5 rounded-lg border ${
              tab === "join" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"
            }`}
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
          <button
            className="px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
            disabled={!user || loading}
          >
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
          <button
            className="px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand"
            disabled={!user || loading}
          >
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
                {/* Debug (remove later) */}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You: <code>{user?.uid || "?"}</code> · Organizer:{" "}
                  <code>{activeEvent.organizerUid || "?"}</code> · Members: {members.length}
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
              <button
                onClick={runDraw}
                className="px-3 py-1.5 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand disabled:opacity-50"
                disabled={!canDraw || loading}
                title={
                  !isOrganizer
                    ? "Only the organizer can run the draw."
                    : !hasEnoughMembers
                    ? "Need at least 2 members to draw."
                    : loading
                    ? "Working…"
                    : ""
                }
              >
                Run draw
              </button>
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

/** Helpers */
function makeCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i]!;
    const aj = a[j]!;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}
