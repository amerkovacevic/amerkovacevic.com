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

type Member = {
  uid: string;
  name: string;
  email: string;
  wantPlayers: string[];
  wantTeams: string[];
  avoidPlayers: string[];
  avoidTeams: string[];
};

export default function SecretSanta() {
  const { user } = useOutletContext<Ctx>();

  const [tab, setTab] = useState<"create" | "join" | "event">("create");
  const [eventId, setEventId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDoc | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [myMatch, setMyMatch] = useState<Member | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- LOCAL HELPERS ---
  const normList = (s: string, max = 3) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, max);

  // Restore event
  useEffect(() => {
    const saved = localStorage.getItem("santaEventId");
    if (saved) {
      setEventId(saved);
      setTab("event");
    }
  }, []);

  // Subscribe to event
  useEffect(() => {
    if (!eventId) return;
    const ref = doc(db, "santaEvents", eventId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setActiveEvent(null);
        return;
      }
      const d = snap.data() as any;
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

  // Members + my assignment
  useEffect(() => {
    if (!activeEvent) return;

    const unsub = onSnapshot(
      collection(db, "santaEvents", activeEvent.id, "members"),
      (snap) => {
        const list: Member[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            uid: d.id,
            name: data?.name ?? "Unknown",
            email: data?.email ?? "",
            wantPlayers: (data?.wantPlayers ?? []) as string[],
            wantTeams: (data?.wantTeams ?? []) as string[],
            avoidPlayers: (data?.avoidPlayers ?? []) as string[],
            avoidTeams: (data?.avoidTeams ?? []) as string[],
          };
        });
        setMembers(list);
      }
    );

    (async () => {
      if (!user) return;
      const myRef = doc(db, "santaEvents", activeEvent.id, "assignments", user.uid);
      const mySnap = await getDoc(myRef);
      if (!mySnap.exists()) {
        setMyMatch(null);
        return;
      }
      const recUid = (mySnap.data() as { recipientUid?: string })?.recipientUid;
      if (!recUid) return;
      const recSnap = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
      if (!recSnap.exists()) return;
      const rd = recSnap.data() as any;
      setMyMatch({
        uid: recSnap.id,
        name: rd?.name ?? "Unknown",
        email: rd?.email ?? "",
        wantPlayers: (rd?.wantPlayers ?? []) as string[],
        wantTeams: (rd?.wantTeams ?? []) as string[],
        avoidPlayers: (rd?.avoidPlayers ?? []) as string[],
        avoidTeams: (rd?.avoidTeams ?? []) as string[],
      });
    })();

    return () => unsub();
  }, [activeEvent?.id, user?.uid]);

  // Derived
  const isOrganizer = useMemo(
    () => Boolean(activeEvent && user && user.uid === activeEvent.organizerUid),
    [activeEvent, user]
  );
  const hasEnoughMembers = members.length >= 2;
  const canDraw = isOrganizer && hasEnoughMembers;

  // Create event (organizer auto-joins, can edit prefs in-event)
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setErr("Please sign in.");

    const form = e.currentTarget as HTMLFormElement & {
      name: HTMLInputElement;
      date: HTMLInputElement;
    };
    const name = form.name.value.trim();
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

      // organizer joins immediately (blank prefs; they can edit below)
      await setDoc(doc(db, "santaEvents", eventRef.id, "members", user.uid), {
        name: user.displayName ?? "Anonymous",
        email: user.email ?? "",
        wantPlayers: [],
        wantTeams: [],
        avoidPlayers: [],
        avoidTeams: [],
      });

      setEventId(eventRef.id);
      localStorage.setItem("santaEventId", eventRef.id);
      setTab("event");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  // Join (with preferences)
  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!user) {
    setErr("Please sign in.");
    return;
  }

  const form = e.currentTarget as HTMLFormElement & {
    code: HTMLInputElement;
    displayName: HTMLInputElement;
    wantPlayers: HTMLInputElement;
    wantTeams: HTMLInputElement;
    avoidPlayers: HTMLInputElement;
    avoidTeams: HTMLInputElement;
  };

  const code = form.code.value.trim().toUpperCase();
  const displayName = (form.displayName.value || user.displayName || "Anonymous").trim();

  const wantPlayers = normList(form.wantPlayers?.value ?? "");
  const wantTeams   = normList(form.wantTeams?.value ?? "");
  const avoidPlayers = normList(form.avoidPlayers?.value ?? "");
  const avoidTeams   = normList(form.avoidTeams?.value ?? "");

  setLoading(true);
  setErr(null);
  try {
    const q = query(collection(db, "santaEvents"), where("joinCode", "==", code));
    const snap = await getDocs(q);

    if (snap.empty) throw new Error("No event found for that code.");

    // Explicit guard so TS knows this is defined
    const evSnap = snap.docs[0];
    if (!evSnap) throw new Error("Event not found.");

    await setDoc(
      doc(db, "santaEvents", evSnap.id, "members", user.uid),
      {
        name: displayName,
        email: user.email ?? "",
        wantPlayers,
        wantTeams,
        avoidPlayers,
        avoidTeams,
      },
      { merge: true }
    );

    setEventId(evSnap.id);
    localStorage.setItem("santaEventId", evSnap.id);
    setTab("event");
  } catch (e) {
    setErr(e instanceof Error ? e.message : "Failed to join event.");
  } finally {
    setLoading(false);
  }
};


  // Update my preferences (inline editor in event view)
  const saveMyPrefs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeEvent || !user) return;

    const form = e.currentTarget as HTMLFormElement & {
      wantPlayers: HTMLInputElement;
      wantTeams: HTMLInputElement;
      avoidPlayers: HTMLInputElement;
      avoidTeams: HTMLInputElement;
    };

    setLoading(true);
    setErr(null);
    try {
      await setDoc(
        doc(db, "santaEvents", activeEvent.id, "members", user.uid),
        {
          wantPlayers: normList(form.wantPlayers.value),
          wantTeams: normList(form.wantTeams.value),
          avoidPlayers: normList(form.avoidPlayers.value),
          avoidTeams: normList(form.avoidTeams.value),
        },
        { merge: true }
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Draw (unchanged pairing logic)
  const runDraw = async () => {
    if (!activeEvent || !isOrganizer) return;
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocs(collection(db, "santaEvents", activeEvent.id, "members"));
      const people: Member[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          uid: d.id,
          name: data?.name ?? "Unknown",
          email: data?.email ?? "",
          wantPlayers: (data?.wantPlayers ?? []) as string[],
          wantTeams: (data?.wantTeams ?? []) as string[],
          avoidPlayers: (data?.avoidPlayers ?? []) as string[],
          avoidTeams: (data?.avoidTeams ?? []) as string[],
        };
      });
      if (people.length < 2) throw new Error("Need at least 2 members.");

      const givers = [...people];
      let receivers = shuffle([...people]);

      const hasSelfAssignments = (A: Member[], B: Member[]) =>
        A.some((a, i) => a?.uid === B[i]?.uid);

      for (let tries = 0; tries < 12 && hasSelfAssignments(givers, receivers); tries++) {
        const first = receivers.shift();
        if (first) receivers.push(first);
      }

      if (hasSelfAssignments(givers, receivers)) {
        const n = receivers.length;
        if (n >= 2) {
          const last = receivers[n - 1];
          const prev = receivers[n - 2];
          if (last && prev) {
            receivers[n - 1] = prev;
            receivers[n - 2] = last;
          }
        }
      }

      await Promise.all(
        givers.map((g, i) => {
          const r = receivers[i];
          if (!r) throw new Error("Internal pairing error.");
          return setDoc(
            doc(db, "santaEvents", activeEvent.id, "assignments", g.uid),
            { recipientUid: r.uid, assignedAt: serverTimestamp() },
            { merge: true }
          );
        })
      );

      // Refresh my match display
      if (user) {
        const my = await getDoc(doc(db, "santaEvents", activeEvent.id, "assignments", user.uid));
        if (my.exists()) {
          const recUid = (my.data() as any)?.recipientUid;
          if (recUid) {
            const recSnap = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
            if (recSnap.exists()) {
              const d = recSnap.data() as any;
              setMyMatch({
                uid: recSnap.id,
                name: d?.name ?? "Unknown",
                email: d?.email ?? "",
                wantPlayers: d?.wantPlayers ?? [],
                wantTeams: d?.wantTeams ?? [],
                avoidPlayers: d?.avoidPlayers ?? [],
                avoidTeams: d?.avoidTeams ?? [],
              });
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

  // UI
  const drawTooltip =
    !isOrganizer
      ? "Only the organizer can run the draw."
      : !hasEnoughMembers
      ? "Need at least 2 members to draw."
      : loading
      ? "Working…"
      : "";

  const me = user ? members.find((m) => m.uid === user.uid) : null;

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Secret Santa — Soccer Jerseys</h1>
        <p className="mt-1 text-white/80">Create a group, invite with a code, set preferences, and auto-assign matches.</p>
      </div>

      {/* Tabs */}
      {!activeEvent && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => setTab("create")} className={`px-3 py-1.5 rounded-lg border ${tab === "create" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}>Create event</button>
          <button onClick={() => setTab("join")} className={`px-3 py-1.5 rounded-lg border ${tab === "join" ? "bg-brand-light text-white dark:bg-brand-dark" : "hover:bg-gray-50 dark:hover:bg-white/10"}`}>Join with code</button>
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
      className="border rounded-lg px-3 py-2"
      required
      disabled={!user}
    />
    <label className="text-sm">
      Exchange date
      <input
        name="date"
        type="date"
        className="mt-1 border rounded-lg px-3 py-2 w-full"
        disabled={!user}
      />
    </label>
    <button
      className="px-3 py-2 rounded-lg bg-brand-light text-white disabled:opacity-50"
      disabled={!user || loading}
    >
      Create & join
    </button>
    {!user && (
      <div className="text-sm text-red-600">
        You must be signed in to create a Secret Santa.
      </div>
    )}
  </form>
)}

      {/* Join form */}
{!activeEvent && tab === "join" && (
  <form onSubmit={handleJoin} className="mt-4 grid gap-3 max-w-md">
    <input
      name="code"
      placeholder="Join code (e.g., 7FQK9C)"
      className="uppercase border rounded-lg px-3 py-2 tracking-widest"
      required
      disabled={!user}
    />
    <input
      name="displayName"
      placeholder="Your display name"
      className="border rounded-lg px-3 py-2"
      disabled={!user}
    />
    <div className="text-sm text-gray-600">Enter 1–3 items, comma-separated.</div>
    <input name="wantPlayers" placeholder="Desired players" className="border rounded-lg px-3 py-2" disabled={!user} />
    <input name="wantTeams" placeholder="Desired teams" className="border rounded-lg px-3 py-2" disabled={!user} />
    <input name="avoidPlayers" placeholder="Players to avoid" className="border rounded-lg px-3 py-2" disabled={!user} />
    <input name="avoidTeams" placeholder="Teams to avoid" className="border rounded-lg px-3 py-2" disabled={!user} />
    <button
      className="px-3 py-2 rounded-lg bg-brand-light text-white disabled:opacity-50"
      disabled={!user || loading}
    >
      Join event
    </button>
    {!user && (
      <div className="text-sm text-red-600">
        You must be signed in to join a Secret Santa.
      </div>
    )}
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
                  {activeEvent.exchangeDate ? `Exchange: ${new Date(activeEvent.exchangeDate.seconds * 1000).toLocaleDateString()}` : "Date: TBA"}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You: <code>{user?.uid || "?"}</code> · Organizer: <code>{activeEvent.organizerUid || "?"}</code> · Members: {members.length}
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
                  <span key={m.uid} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    🧑 {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={runDraw}
                className="px-3 py-1.5 rounded-lg bg-brand-light text-white dark:bg-brand-dark disabled:opacity-50"
                disabled={!canDraw || loading}
                title={drawTooltip}
              >
                Run draw
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Only the organizer can run the draw. Each person sees only their own match.
              </span>
            </div>
          </div>

          {/* My preferences editor */}
          {user && (
            <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
              <h3 className="text-sm font-medium mb-2">My preferences</h3>
              <form onSubmit={saveMyPrefs} className="grid gap-3">
                <div className="text-xs text-gray-600">Enter 1–3 items, comma-separated.</div>
                <input name="wantPlayers" defaultValue={(me?.wantPlayers ?? []).join(", ")} placeholder="Desired players (comma-separated)" className="border rounded-lg px-3 py-2" />
                <input name="wantTeams" defaultValue={(me?.wantTeams ?? []).join(", ")} placeholder="Desired teams (comma-separated)" className="border rounded-lg px-3 py-2" />
                <input name="avoidPlayers" defaultValue={(me?.avoidPlayers ?? []).join(", ")} placeholder="Players to avoid (comma-separated)" className="border rounded-lg px-3 py-2" />
                <input name="avoidTeams" defaultValue={(me?.avoidTeams ?? []).join(", ")} placeholder="Teams to avoid (comma-separated)" className="border rounded-lg px-3 py-2" />
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-brand-light text-white dark:bg-brand-dark disabled:opacity-50" disabled={loading}>Save</button>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Everyone will see these when they draw you.</span>
                </div>
              </form>
            </div>
          )}

          {/* My assignment with recipient prefs */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
            <h3 className="text-sm font-medium mb-2">Your match</h3>
            {myMatch ? (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{myMatch.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{myMatch.email}</div>
                  </div>
                  <span className="rounded-lg px-2 py-1 text-xs bg-brand-light text-white dark:bg-brand-dark">
                    🎁 Buy a jersey
                  </span>
                </div>
                <div className="text-sm mt-1">
                  <div><span className="font-medium">Wants — Players:</span> {listOrDash(myMatch.wantPlayers)}</div>
                  <div><span className="font-medium">Wants — Teams:</span> {listOrDash(myMatch.wantTeams)}</div>
                  <div><span className="font-medium">Avoid — Players:</span> {listOrDash(myMatch.avoidPlayers)}</div>
                  <div><span className="font-medium">Avoid — Teams:</span> {listOrDash(myMatch.avoidTeams)}</div>
                </div>
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
function listOrDash(arr: string[]) {
  return arr && arr.length ? arr.join(", ") : "—";
}

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