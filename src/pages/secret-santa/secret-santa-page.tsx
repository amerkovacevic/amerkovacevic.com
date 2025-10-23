import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
import { db } from "../../shared/lib/firebase";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

// Secret Santa orchestrates event lifecycle: creation, membership, preference
// capture, and match assignments stored in Firestore collections.

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
  jerseySize: string;
  shippingAddress: string;
  wantPlayers: string[];
  wantTeams: string[];
  avoidPlayers: string[];
  avoidTeams: string[];
};

export default function SecretSanta() {
  const { user } = useOutletContext<Ctx>();

  const [tab, setTab] = useState<"create" | "join" | "event" | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDoc | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [recipientUid, setRecipientUid] = useState<string | null>(null);
  const [myMatch, setMyMatch] = useState<Member | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Convert a comma-separated input into a clean list capped to a few entries.
  const normList = (s: string, max = 3) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, max);

  // Restore the last viewed event from localStorage so organizers rejoin fast.
  useEffect(() => {
    const saved = localStorage.getItem("santaEventId");
    if (saved) {
      setEventId(saved);
      setTab("event");
    }
  }, []);

  // Subscribe to the selected event document for name/date updates.
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

  // Stream member roster changes into local state.
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
            jerseySize: data?.jerseySize ?? "",
            shippingAddress: data?.shippingAddress ?? "",
            wantPlayers: (data?.wantPlayers ?? []) as string[],
            wantTeams: (data?.wantTeams ?? []) as string[],
            avoidPlayers: (data?.avoidPlayers ?? []) as string[],
            avoidTeams: (data?.avoidTeams ?? []) as string[],
          };
        });
        setMembers(list);
      }
    );

    return () => unsub();
  }, [activeEvent?.id]);

  useEffect(() => {
    // Track the signed-in user's assignment document to display their match.
    if (!activeEvent || !user) {
      setRecipientUid(null);
      setMyMatch(null);
      return;
    }

    const assignRef = doc(
      db,
      "santaEvents",
      activeEvent.id,
      "assignments",
      user.uid
    );
    const unsub = onSnapshot(assignRef, (snap) => {
      const recUid = (snap.data() as { recipientUid?: string } | undefined)
        ?.recipientUid;
      setRecipientUid(recUid ?? null);
      if (!recUid) {
        setMyMatch(null);
      }
    });
    return () => unsub();
  }, [activeEvent?.id, user?.uid]);

  useEffect(() => {
    // Lookup the full member record for the assigned recipient when it flips.
    if (!recipientUid) {
      setMyMatch(null);
      return;
    }
    const match = members.find((m) => m.uid === recipientUid) ?? null;
    setMyMatch(match);
  }, [members, recipientUid]);

  // Derived flags that simplify conditional UI logic.
  const isOrganizer = useMemo(
    () => Boolean(activeEvent && user && user.uid === activeEvent.organizerUid),
    [activeEvent, user]
  );
  const hasEnoughMembers = members.length >= 2;
  const canDraw = isOrganizer && hasEnoughMembers;

  // Create event (organizer auto-joins and can edit prefs immediately).
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

      // Organizer joins immediately so they can update preferences right away.
      await setDoc(doc(db, "santaEvents", eventRef.id, "members", user.uid), {
        name: user.displayName ?? "Anonymous",
        email: user.email ?? "",
        jerseySize: "",
        shippingAddress: "",
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

  // Join flow lets guests submit wishlists as they enter.
  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setErr("Please sign in.");
      return;
    }

    const form = e.currentTarget as HTMLFormElement & {
      code: HTMLInputElement;
      displayName: HTMLInputElement;
      jerseySize: HTMLInputElement;
      shippingAddress: HTMLTextAreaElement;
      wantPlayers: HTMLInputElement;
      wantTeams: HTMLInputElement;
      avoidPlayers: HTMLInputElement;
      avoidTeams: HTMLInputElement;
    };

    const code = form.code.value.trim().toUpperCase();
    const displayName = (
      form.displayName.value || user.displayName || "Anonymous"
    ).trim();

    const wantPlayers = normList(form.wantPlayers?.value ?? "");
    const wantTeams = normList(form.wantTeams?.value ?? "");
    const avoidPlayers = normList(form.avoidPlayers?.value ?? "");
    const avoidTeams = normList(form.avoidTeams?.value ?? "");
    const jerseySize = form.jerseySize?.value.trim().toUpperCase() ?? "";
    const shippingAddress = form.shippingAddress?.value.trim() ?? "";

    setLoading(true);
    setErr(null);
    try {
      const q = query(
        collection(db, "santaEvents"),
        where("joinCode", "==", code)
      );
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("No event found for that code.");

      const evSnap = snap.docs[0];
      if (!evSnap) throw new Error("Event not found.");

      await setDoc(
        doc(db, "santaEvents", evSnap.id, "members", user.uid),
        {
          name: displayName,
          email: user.email ?? "",
          jerseySize,
          shippingAddress,
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

  // Update my preferences (inline editor in event view).
  const saveMyPrefs = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeEvent || !user) return;

    const form = e.currentTarget as HTMLFormElement & {
      jerseySize: HTMLInputElement;
      shippingAddress: HTMLTextAreaElement;
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
          jerseySize: form.jerseySize.value.trim().toUpperCase(),
          shippingAddress: form.shippingAddress.value.trim(),
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

  // Draw assigns each member a recipient while avoiding self-assignments.
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
          jerseySize: data?.jerseySize ?? "",
          shippingAddress: data?.shippingAddress ?? "",
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

      // Refresh my match display so the organizer sees their assignment too.
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
                jerseySize: d?.jerseySize ?? "",
                shippingAddress: d?.shippingAddress ?? "",
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
    <div className="space-y-8">
      <PageHero
        icon="🎁"
        title="Secret Santa"
        description="Create a group, invite with a code, set preferences, and auto-assign matches."
        stats={
          <>
            <StatPill>Unlimited members</StatPill>
            <StatPill>Smart pairing</StatPill>
            <StatPill>Preferences built-in</StatPill>
          </>
        }
      />

      <div className="space-y-6">
        {err ? <Alert tone="error">Error: {err}</Alert> : null}
        {loading ? <Alert tone="info">Working…</Alert> : null}

        {!activeEvent ? (
          <PageSection
            title="Plan your exchange"
            description="Create a new event for your crew or join an existing one with a code."
            contentClassName="space-y-5"
          >
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTab("join")}
                className={cn(
                  buttonStyles({ variant: tab === "join" ? "primary" : "secondary", size: "sm" }),
                  "rounded-brand-full"
                )}
                type="button"
              >
                Join with code
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTab("create")}
                className={cn(
                  buttonStyles({ variant: tab === "create" ? "primary" : "secondary", size: "sm" }),
                  "rounded-brand-full"
                )}
                type="button"
              >
                Create event
              </motion.button>
            </div>

            {tab === "create" ? (
              <form onSubmit={handleCreate} className="grid gap-4 md:max-w-xl">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Event name</span>
                  <input
                    name="name"
                    placeholder="e.g., Jerseys 2025"
                    className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    required
                    disabled={!user || loading}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Exchange date</span>
                  <input
                    name="date"
                    type="date"
                    className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:bg-surface-overlayDark dark:text-white"
                    disabled={!user || loading}
                  />
                </label>
                <button
                  className={buttonStyles({ size: "md" })}
                  disabled={!user || loading}
                >
                  Create & join
                </button>
                {!user ? (
                  <p className="text-sm text-red-500">You must be signed in to create a Secret Santa.</p>
                ) : (
                  <p className="text-xs text-brand-muted dark:text-brand-subtle">
                    We’ll automatically add you as the first member so you can set your preferences below.
                  </p>
                )}
              </form>
            ) : null}

            {tab === "join" ? (
              <form onSubmit={handleJoin} className="grid gap-4 md:max-w-xl">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Join code</span>
                  <input
                    name="code"
                    placeholder="7FQK9C"

                    className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong uppercase tracking-[0.4em] shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    required
                    disabled={!user || loading}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Display name</span>
                  <input
                    name="displayName"
                    placeholder="Your name"
                    className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    disabled={!user || loading}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Jersey size</span>
                  <input
                    name="jerseySize"
                    placeholder="e.g., M, L, XL"
                    className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 uppercase placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    disabled={!user || loading}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-brand-muted dark:text-brand-subtle">Shipping address</span>
                  <textarea
                    name="shippingAddress"
                    placeholder="Street, city, state, ZIP"
                    className="min-h-[96px] rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    disabled={!user || loading}
                  />
                  <span className="text-xs text-brand-muted dark:text-brand-subtle">Only your Secret Santa will see this.</span>
                </label>
                <div className="text-xs text-brand-muted">Enter 1–3 items, comma-separated.</div>
                <input name="wantPlayers" placeholder="Desired players" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" disabled={!user || loading} />
                <input name="wantTeams" placeholder="Desired teams" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" disabled={!user || loading} />
                <input name="avoidPlayers" placeholder="Players to avoid" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" disabled={!user || loading} />
                <input name="avoidTeams" placeholder="Teams to avoid" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" disabled={!user || loading} />
                <button
                  className={buttonStyles({ size: "md" })}
                  disabled={!user || loading}
                >
                  Join event
                </button>
                {!user && <p className="text-sm text-red-500">You must be signed in to join a Secret Santa.</p>}
              </form>
            ) : null}
          </PageSection>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <PageSection
              title={activeEvent?.name}
              description={
                activeEvent?.exchangeDate
                  ? `Exchange: ${new Date(activeEvent.exchangeDate.seconds * 1000).toLocaleDateString()}`
                  : "Date: TBA"
              }
              actions={
                <div className="flex flex-col items-end gap-2 text-xs text-brand-muted dark:text-brand-subtle">
                  <span>Join code</span>
                  <code className="rounded-brand bg-surface px-3 py-1 font-mono text-sm tracking-[0.4em] text-brand-strong dark:bg-surface-overlayDark dark:text-brand-foreground">
                    {activeEvent?.joinCode}
                  </code>
                </div>
              }
              contentClassName="space-y-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted dark:text-brand-subtle">
                <span className="rounded-brand-full bg-brand/10 px-3 py-1">
                  Organizer · {activeEvent?.organizerUid ?? "?"}
                </span>
                <span className="rounded-brand-full bg-brand/10 px-3 py-1">
                  Members · {members.length}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Members</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {members.map((m) => (
                    <span
                      key={m.uid}
                      className="inline-flex items-center gap-1 rounded-brand-full bg-surface px-3 py-1 text-sm text-brand-strong shadow-brand-sm"
                    >
                      🧑 {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={runDraw}
                  className={buttonStyles({ size: "sm" })}
                  disabled={!canDraw || loading}
                  title={drawTooltip}
                >
                  Run draw
                </button>
                <span className="text-xs text-brand-muted dark:text-brand-subtle">
                  Only the organizer can run the draw. Each person sees only their own match.
                </span>
              </div>
            </PageSection>

            <div className="space-y-6">
              {user ? (
                <PageSection title="My preferences" description="Update what you hope to receive and any no-goes." contentClassName="space-y-3">
                  <form onSubmit={saveMyPrefs} className="grid gap-3">
                    <div className="text-xs text-brand-muted">Enter 1–3 items, comma-separated.</div>
                    <input
                      name="jerseySize"
                      defaultValue={me?.jerseySize ?? ""}
                      placeholder="Jersey size"
                      className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 uppercase placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    />
                    <textarea
                      name="shippingAddress"
                      defaultValue={me?.shippingAddress ?? ""}
                      placeholder="Shipping address"
                      className="min-h-[96px] rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                    />
                    <input name="wantPlayers" defaultValue={(me?.wantPlayers ?? []).join(", ")} placeholder="Desired players" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" />
                    <input name="wantTeams" defaultValue={(me?.wantTeams ?? []).join(", ")} placeholder="Desired teams" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" />
                    <input name="avoidPlayers" defaultValue={(me?.avoidPlayers ?? []).join(", ")} placeholder="Players to avoid" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" />
                    <input name="avoidTeams" defaultValue={(me?.avoidTeams ?? []).join(", ")} placeholder="Teams to avoid" className="rounded-brand border border-border-light bg-surface px-3 py-2 text-sm text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle" />
                    <div className="flex items-center gap-3">
                      <button className={buttonStyles({ size: "sm" })} disabled={loading}>
                        Save
                      </button>
                      <span className="text-xs text-brand-muted dark:text-brand-subtle">Everyone will see these when they draw you.</span>
                    </div>
                  </form>
                </PageSection>
              ) : null}

              <PageSection title="Your match" contentClassName="space-y-3">
                {myMatch ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-base font-semibold text-brand-strong dark:text-white">{myMatch.name}</div>
                      <div className="text-xs text-brand-muted dark:text-brand-subtle">{myMatch.email}</div>
                    </div>
                    <PreferenceList
                      label="Jersey Size"
                      items={myMatch.jerseySize ? [myMatch.jerseySize] : []}
                    />
                    <div className="space-y-1 text-sm text-brand-muted dark:text-brand-subtle">
                      <span className="font-medium text-brand-strong dark:text-white">Shipping address:</span>
                      <div className="whitespace-pre-wrap text-brand-strong dark:text-white">
                        {myMatch.shippingAddress ? myMatch.shippingAddress : "-"}
                      </div>
                    </div>
                    <PreferenceList label="Wants - Players" items={myMatch.wantPlayers} />
                    <PreferenceList label="Wants - Teams" items={myMatch.wantTeams} />
                    <PreferenceList label="Avoid - Players" items={myMatch.avoidPlayers} />
                    <PreferenceList label="Avoid - Teams" items={myMatch.avoidTeams} />
                  </div>
                ) : (
                  <p className="text-sm text-brand-muted dark:text-brand-subtle">
                    No assignment yet. Ask the organizer to run the draw.
                  </p>
                )}
              </PageSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Presentation-only helpers to keep the main component readable.
function PreferenceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="text-sm text-brand-muted dark:text-brand-subtle">
      <span className="font-medium text-brand-strong dark:text-white">{label}:</span> {listOrDash(items)}
    </div>
  );
}

function Alert({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const toneStyles =
    tone === "error"
      ? "border-red-200 text-red-600 dark:border-red-400/40 dark:text-red-200"
      : "border-brand/30 text-brand";
  return (
    <Card padding="lg" className={cn("text-sm", toneStyles)}>
      {children}
    </Card>
  );
}

// Format preference arrays for display, falling back to an em dash.
function listOrDash(arr: string[]) {
  return arr && arr.length ? arr.join(", ") : "-";
}

// Generate a high-contrast alphanumeric join code with ambiguous characters removed.
function makeCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// Fisher–Yates shuffle used when assigning recipients randomly.
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