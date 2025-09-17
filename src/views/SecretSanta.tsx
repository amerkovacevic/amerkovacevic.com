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
  // preferences (all optional)
  wantPlayers?: string[];
  wantTeams?: string[];
  avoidPlayers?: string[];
  avoidTeams?: string[];
};

export default function SecretSanta() {
  const { user } = useOutletContext<Ctx>();

  const [tab, setTab] = useState<"create" | "join" | "event">("create");
  const [activeEvent, setActiveEvent] = useState<EventDoc | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [myMatch, setMyMatch] = useState<Member | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // For editing my preferences in-event
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [myPrefs, setMyPrefs] = useState({
    wantPlayers: "",
    wantTeams: "",
    avoidPlayers: "",
    avoidTeams: "",
  });

  // Subscribe to members; also fetch my assignment once
  useEffect(() => {
    if (!activeEvent) return;

    const unsub = onSnapshot(
      collection(db, "santaEvents", activeEvent.id, "members"),
      (snap) => {
        const list: Member[] = snap.docs.map((d) => {
          const data = d.data() as Partial<Member> & { name?: string; email?: string } | undefined;
        return {
            uid: d.id,
            name: data?.name ?? "Unknown",
            email: data?.email ?? "",
            wantPlayers: data?.wantPlayers ?? [],
            wantTeams: data?.wantTeams ?? [],
            avoidPlayers: data?.avoidPlayers ?? [],
            avoidTeams: data?.avoidTeams ?? [],
          };
        });
        setMembers(list);

        // If this is me, hydrate myPrefs UI from doc
        if (user) {
          const mine = list.find((m) => m.uid === user.uid);
          if (mine) {
            setMyPrefs({
              wantPlayers: (mine.wantPlayers ?? []).join(", "),
              wantTeams: (mine.wantTeams ?? []).join(", "),
              avoidPlayers: (mine.avoidPlayers ?? []).join(", "),
              avoidTeams: (mine.avoidTeams ?? []).join(", "),
            });
          }
        }
      }
    );

    // fetch my assignment (if any)
    (async () => {
      if (!user) return;
      const myRef = doc(db, "santaEvents", activeEvent.id, "assignments", user.uid);
      const mySnap = await getDoc(myRef);
      if (!mySnap.exists()) {
        setMyMatch(null);
        return;
      }
      const recUid = (mySnap.data() as { recipientUid?: string })?.recipientUid;
      if (!recUid) {
        setMyMatch(null);
        return;
      }
      const recSnap = await getDoc(doc(db, "santaEvents", activeEvent.id, "members", recUid));
      if (!recSnap.exists()) {
        setMyMatch(null);
        return;
      }
      const rd = recSnap.data() as Partial<Member> & { name?: string; email?: string } | undefined;
      setMyMatch({
        uid: recSnap.id,
        name: rd?.name ?? "Unknown",
        email: rd?.email ?? "",
        wantPlayers: rd?.wantPlayers ?? [],
        wantTeams: rd?.wantTeams ?? [],
        avoidPlayers: rd?.avoidPlayers ?? [],
        avoidTeams: rd?.avoidTeams ?? [],
      });
    })();

    return () => unsub();
  }, [activeEvent?.id, user?.uid]);

  const canDraw = useMemo(
    () => Boolean(activeEvent && user && user.uid === activeEvent.organizerUid && members.length >= 2),
    [activeEvent, user, members.length]
  );

  // Create an event (organizer auto-joins)
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

      setActiveEvent({
        id: eventRef.id,
        name,
        exchangeDate,
        joinCode,
        organizerUid: user.uid,
        createdAt: null,
      });
      setTab("event");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

// Join via code (with optional preferences)
const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!user) return setErr("Please sign in.");

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
  if (!code) return setErr("Enter a join code.");

  const wantPlayers = parseTop3(form.wantPlayers.value);
  const wantTeams = parseTop3(form.wantTeams.value);
  const avoidPlayers = parseTop3(form.avoidPlayers.value);
  const avoidTeams = parseTop3(form.avoidTeams.value);

  setLoading(true);
  setErr(null);
  try {
    const q = query(collection(db, "santaEvents"), where("joinCode", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No event found for that code.");

    // ✅ after the empty-check, assert the first doc exists
    const evSnap = snap.docs[0]!;
    const eventId = evSnap.id;

    // add/merge me into members
    await setDoc(
      doc(db, "santaEvents", eventId, "members", user.uid),
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

    // ✅ use consistent property names
    const evData = evSnap.data() as {
      name?: string;
      exchangeDate?: Timestamp | null;
      joinCode?: string;
      organizerUid?: string;
      createdAt?: unknown;
    };

    setActiveEvent({
      id: eventId,
      name: evData.name ?? "Event",
      exchangeDate: evData.exchangeDate ?? null,
      joinCode: evData.joinCode ?? code,
      organizerUid: evData.organizerUid ?? "",
      createdAt: evData.createdAt ?? null,
    });
    setTab("event");
  } catch (e) {
    setErr(e instanceof Error ? e.message : "Failed to join event.");
  } finally {
    setLoading(false);
  }
};


  // Update my preferences from the event view
  const saveMyPreferences = async () => {
    if (!user || !activeEvent) return;
    setPrefsBusy(true);
    try {
      await setDoc(
        doc(db, "santaEvents", activeEvent.id, "members", user.uid),
        {
          wantPlayers: parseTop3(myPrefs.wantPlayers),
          wantTeams: parseTop3(myPrefs.wantTeams),
          avoidPlayers: parseTop3(myPrefs.avoidPlayers),
          avoidTeams: parseTop3(myPrefs.avoidTeams),
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPrefsBusy(false);
    }
  };

  // Run the draw (organizer only)
  const runDraw = async () => {
    if (!activeEvent || !canDraw) return;
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocs(collection(db, "santaEvents", activeEvent.id, "members"));
      const people: Member[] = snap.docs.map((d) => {
        const data = d.data() as Partial<Member> & { name?: string; email?: string } | undefined;
        return {
          uid: d.id,
          name: data?.name ?? "Unknown",
          email: data?.email ?? "",
          wantPlayers: data?.wantPlayers ?? [],
          wantTeams: data?.wantTeams ?? [],
          avoidPlayers: data?.avoidPlayers ?? [],
          avoidTeams: data?.avoidTeams ?? [],
        };
      });
      if (people.length < 2) throw new Error("Need at least 2 members.");

      const givers: Member[] = [...people];
      let receivers: Member[] = shuffle([...people]);

      // helper to detect unsafe pairings (self)
      const hasSelfAssignments = (A: Member[], B: Member[]) => {
        const n = Math.min(A.length, B.length);
        for (let i = 0; i < n; i++) {
          const a = A[i]; const b = B[i];
          if (!a || !b) return true;
          if (a.uid === b.uid) return true;
        }
        return false;
      };

      // try to avoid self-assignments
      for (let tries = 0; tries < 12 && hasSelfAssignments(givers, receivers); tries++) {
        const first = receivers.shift();
        if (first) receivers.push(first);
      }
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
              const d = recSnap.data() as Partial<Member> & { name?: string; email?: string } | undefined;
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

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Secret Santa — Soccer Jerseys</h1>
        <p className="mt-1 text-white/80">
          Create a group, invite with a code, and auto-assign matches.
        </p>
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

      {/* Join form (with preferences) */}
      {!activeEvent && tab === "join" && (
        <form onSubmit={handleJoin} className="mt-4 grid gap-3 max-w-xl">
          <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
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
          </div>

          <div className="rounded-lg border p-3 dark:bg-gray-900 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Preferences (optional): add <strong>1–3 players</strong> you want and/or <strong>1–3 teams</strong> you want.
              Also list up to <strong>3 players</strong> and <strong>3 teams</strong> you’d like to avoid.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm">Desired players (comma-separated)</label>
                <input
                  name="wantPlayers"
                  placeholder="e.g., Messi, Salah, Haaland"
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                />
              </div>
              <div>
                <label className="text-sm">Desired teams (comma-separated)</label>
                <input
                  name="wantTeams"
                  placeholder="e.g., Barcelona, Liverpool, Inter"
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                />
              </div>
              <div>
                <label className="text-sm">Avoid players (comma-separated)</label>
                <input
                  name="avoidPlayers"
                  placeholder="e.g., Ronaldo, Neymar"
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                />
              </div>
              <div>
                <label className="text-sm">Avoid teams (comma-separated)</label>
                <input
                  name="avoidTeams"
                  placeholder="e.g., Real Madrid, Man United"
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                />
              </div>
            </div>
          </div>

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
                    title={tooltipForMember(m)}
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

          {/* My preferences editor */}
          {user && (
            <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
              <h3 className="text-sm font-medium mb-2">Your preferences</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                Add <strong>1–3 players</strong> and/or <strong>1–3 teams</strong> you want. Also list up to <strong>3 players</strong> and <strong>3 teams</strong> to avoid.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm">Desired players</label>
                  <input
                    value={myPrefs.wantPlayers}
                    onChange={(e) => setMyPrefs((p) => ({ ...p, wantPlayers: e.target.value }))}
                    placeholder="Messi, Salah, Haaland"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm">Desired teams</label>
                  <input
                    value={myPrefs.wantTeams}
                    onChange={(e) => setMyPrefs((p) => ({ ...p, wantTeams: e.target.value }))}
                    placeholder="Barcelona, Liverpool, Inter"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm">Avoid players</label>
                  <input
                    value={myPrefs.avoidPlayers}
                    onChange={(e) => setMyPrefs((p) => ({ ...p, avoidPlayers: e.target.value }))}
                    placeholder="Ronaldo, Neymar"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="text-sm">Avoid teams</label>
                  <input
                    value={myPrefs.avoidTeams}
                    onChange={(e) => setMyPrefs((p) => ({ ...p, avoidTeams: e.target.value }))}
                    placeholder="Real Madrid, Man United"
                    className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
              </div>
              <button
                onClick={saveMyPreferences}
                disabled={prefsBusy}
                className="mt-3 px-3 py-2 rounded-lg bg-brand-light text-white hover:bg-brand dark:bg-brand-dark dark:hover:bg-brand disabled:opacity-50"
              >
                {prefsBusy ? "Saving…" : "Save preferences"}
              </button>
            </div>
          )}

          {/* My assignment */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 p-4">
            <h3 className="text-sm font-medium mb-2">Your match</h3>
            {myMatch ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{myMatch.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{myMatch.email}</div>
                  {/* Optional: show their wants/avoids to help you buy */}
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {renderPrefLine("Wants (players)", myMatch.wantPlayers)}
                    {renderPrefLine("Wants (teams)", myMatch.wantTeams)}
                    {renderPrefLine("Avoid (players)", myMatch.avoidPlayers)}
                    {renderPrefLine("Avoid (teams)", myMatch.avoidTeams)}
                  </ul>
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

/** ---------- helpers ---------- */

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

function parseTop3(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function tooltipForMember(m: Member): string | undefined {
  const wantsP = (m.wantPlayers ?? []).join(", ");
  const wantsT = (m.wantTeams ?? []).join(", ");
  const avoidsP = (m.avoidPlayers ?? []).join(", ");
  const avoidsT = (m.avoidTeams ?? []).join(", ");
  const bits = [
    wantsP && `Wants players: ${wantsP}`,
    wantsT && `Wants teams: ${wantsT}`,
    avoidsP && `Avoid players: ${avoidsP}`,
    avoidsT && `Avoid teams: ${avoidsT}`,
  ].filter(Boolean);
  return bits.length ? bits.join(" • ") : undefined;
}

function renderPrefLine(label: string, arr?: string[]) {
  if (!arr || arr.length === 0) return null;
  return (
    <li>
      <span className="font-medium">{label}:</span> {arr.join(", ")}
    </li>
  );
}
