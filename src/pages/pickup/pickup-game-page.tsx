import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../shared/lib/firebase";
import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

import type { Game } from "./pickup-page";
import { toDate } from "./pickup-page";

type Ctx = { user: User | null };
type RSVPStatus = "going" | "maybe" | "out";

type RSVPEntry = {
  id: string;
  name: string;
  status: RSVPStatus;
  joinedAt?: Timestamp | null;
  guests?: number;
};

const STATUS_LABELS: Record<RSVPStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  out: "Out",
};

const STATUS_ORDER: RSVPStatus[] = ["going", "maybe", "out"];

const MotionLink = motion(Link);
const MotionButton = motion.button;

export default function PickupGamePage() {
  const { user } = useOutletContext<Ctx>();
  const { gameId } = useParams<{ gameId: string }>();
  const nav = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rsvps, setRsvps] = useState<Record<RSVPStatus, RSVPEntry[]>>({
    going: [],
    maybe: [],
    out: [],
  });

  useEffect(() => {
    if (!gameId) {
      setErr("Game not found.");
      setLoading(false);
      return;
    }

    const ref = doc(db, "games", gameId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setGame(null);
          setErr("This game was removed or never existed.");
          setLoading(false);
          return;
        }
        const data = snap.data() as Omit<Game, "id">;
        setGame({ ...data, id: snap.id });
        setErr(null);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setErr("Failed to load the game. Please try again.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    const ref = collection(db, "games", gameId, "rsvps");
    const unsub = onSnapshot(ref, (snap) => {
      const groups: Record<RSVPStatus, RSVPEntry[]> = {
        going: [],
        maybe: [],
        out: [],
      };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const status = data?.status as RSVPStatus | undefined;
        const guests = normalizeGuests(data?.guests);
        if (status === "going" || status === "maybe" || status === "out") {
          groups[status].push({
            id: docSnap.id,
            name: (data?.name as string) || "Player",
            status,
            joinedAt: data?.joinedAt ?? null,
            guests,
          });
        }
      });

      STATUS_ORDER.forEach((status) => {
        groups[status].sort((a, b) => a.name.localeCompare(b.name));
      });

      setRsvps(groups);
    });

    return () => unsub();
  }, [gameId]);

  const gameDate = useMemo(() => toDate(game?.dateTime ?? null), [game?.dateTime]);
  const dateText = useMemo(() => {
    if (!gameDate) return "Date TBA";
    return gameDate.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [gameDate]);

  const counts = useMemo(() => {
    const sumHeads = (entries: RSVPEntry[]) =>
      entries.reduce((total, entry) => total + 1 + (entry.guests ?? 0), 0);
    return {
      goingPlayers: rsvps.going.length,
      maybePlayers: rsvps.maybe.length,
      outPlayers: rsvps.out.length,
      goingHeads: sumHeads(rsvps.going),
      maybeHeads: sumHeads(rsvps.maybe),
      outHeads: sumHeads(rsvps.out),
    };
  }, [rsvps]);

  const spotsLeft =
    game ? Math.max(game.maxPlayers - counts.goingHeads, 0) : 0;
  const canManage = Boolean(user && game && user.uid === game.organizerUid);
  const duplicateGameUrl = useMemo(() => {
    if (!game) return null;
    const params = new URLSearchParams();
    if (game.title) params.set("title", game.title);
    if (game.fieldName) params.set("fieldName", game.fieldName);
    if (game.maxPlayers) params.set("maxPlayers", String(game.maxPlayers));
    params.set("dateTime", new Date().toISOString());
    return `/new?${params.toString()}`;
  }, [game]);

  const handleDelete = async () => {
    if (!gameId || !canManage) return;
    const confirmed = window.confirm(
      "Delete this game and all RSVP data? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteErr(null);
    try {
      const batch = writeBatch(db);
      const rsvpSnap = await getDocs(collection(db, "games", gameId, "rsvps"));
      rsvpSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      batch.delete(doc(db, "games", gameId));
      await batch.commit();
      nav("/pickup");
    } catch (error) {
      console.error(error);
      setDeleteErr("Failed to delete the game. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        icon="⚽"
        title={game ? game.title : "Pickup game"}
        description={
          game
            ? `${game.fieldName} • ${dateText}`
            : "Manage RSVPs and details for your pickup session."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <MotionLink
              to="/pickup"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              ← Back to games
            </MotionLink>
            {canManage && duplicateGameUrl ? (
              <MotionLink
                to={duplicateGameUrl}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className={buttonStyles({ size: "sm" })}
              >
                Duplicate game
              </MotionLink>
            ) : null}
          </div>
        }
        stats={
          game ? (
            <>
              <StatPill>Going · {counts.goingHeads}</StatPill>
              <StatPill>Maybe · {counts.maybeHeads}</StatPill>
              <StatPill>Out · {counts.outHeads}</StatPill>
              <StatPill>
                Spots left · {spotsLeft}
              </StatPill>
            </>
          ) : null
        }
      />

      {err ? (
        <Card padding="lg" className="text-sm text-red-500">
          {err}
        </Card>
      ) : null}

      {loading ? (
        <Card padding="lg" className="text-sm text-brand-muted">
          Loading game…
        </Card>
      ) : !game ? (
        <Card padding="lg" className="text-sm text-brand-muted">
          Game not available.
        </Card>
      ) : (
        <>
          <PageSection
            title="Game details"
            description="All the key info in one place."
            contentClassName="space-y-4"
          >
            <Card>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <DetailItem label="Field">{game.fieldName}</DetailItem>
                <DetailItem label="When">{dateText}</DetailItem>
                <DetailItem label="Max players">{game.maxPlayers}</DetailItem>
                <DetailItem label="Status">{game.status}</DetailItem>
                <DetailItem label="Organizer UID">{game.organizerUid}</DetailItem>
                <DetailItem label="RSVP heads so far">
                  {counts.goingHeads + counts.maybeHeads + counts.outHeads}
                </DetailItem>
              </dl>
            </Card>
          </PageSection>

          <PageSection
            title="RSVP breakdown"
            description="Only the organizer can see individual responses."
            contentClassName="space-y-6"
          >
            {canManage ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {STATUS_ORDER.map((status) => {
                  const entries = rsvps[status];
                  return (
                    <Card key={status} className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-brand-strong dark:text-white">
                          {STATUS_LABELS[status]}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                          {entries.length} {entries.length === 1 ? "player" : "players"}
                        </span>
                      </div>
                      {entries.length ? (
                        <ul className="space-y-1 text-sm">
                          {entries.map((entry) => (
                            <li
                              key={entry.id}
                              className="rounded-brand bg-surface px-3 py-1 text-brand-strong shadow-brand-sm dark:bg-surface-overlayDark dark:text-white"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{entry.name}</span>
                                {entry.guests ? (
                                  <span className="inline-flex items-center gap-1 rounded-brand-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                                    +{entry.guests} guest
                                    {entry.guests > 1 ? "s" : ""}
                                  </span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-brand-muted">No one yet.</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-sm text-brand-muted">
                Only the organizer can view the detailed RSVP list.
              </Card>
            )}

            {canManage ? (
              <div className="flex flex-col gap-3 border-t border-border-light pt-4 dark:border-border-dark">
                <MotionButton
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  disabled={deleting}
                  className={buttonStyles({
                    variant: "secondary",
                    size: "sm",
                    className:
                      "justify-start border-red-200 text-red-600 ring-1 ring-inset ring-red-300/80 hover:border-red-300 hover:bg-red-50 dark:border-red-500/50 dark:text-red-100 dark:ring-red-500/70 dark:hover:bg-red-500/20",
                  })}
                >
                  {deleting ? "Deleting…" : "Delete game"}
                </MotionButton>
                {deleteErr ? (
                  <p className="text-sm text-red-500">{deleteErr}</p>
                ) : null}
              </div>
            ) : null}
          </PageSection>
        </>
      )}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </dt>
      <dd className="font-medium text-brand-strong dark:text-white">{children}</dd>
    </div>
  );
}

function normalizeGuests(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampGuestValue(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return clampGuestValue(parsed);
  }
  return 0;
}

function clampGuestValue(value: number) {
  return Math.max(0, Math.min(3, Math.trunc(value)));
}
