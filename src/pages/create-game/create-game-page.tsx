import { FormEvent, useMemo, useState } from "react";
import { useOutletContext, useNavigate, Link, useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { db } from "../../shared/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { PageHero, PageSection, StatPill } from "../../shared/components/page";
import { buttonStyles } from "../../shared/components/ui/button";

// CreateGame is the admin-facing form that persists pickup matches to
// Firestore and redirects back to the public listing once the document exists.

type Ctx = { user: User | null };

// When cloning from older games we nudge the date one week into the future.
const DATE_SHIFT_DAYS = 7;

// Convert a Date into the browser-friendly value for a datetime-local input.

function toLocalDateTimeInput(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export default function CreateGame() {
  const { user } = useOutletContext<Ctx>();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Support pre-filling the form via query params so existing games can be
  // cloned with minimal typing.
  const titlePrefill = searchParams.get("title")?.trim() ?? "";
  const fieldPrefill = searchParams.get("fieldName")?.trim() ?? "";
  const maxPlayersPrefill = (() => {
    const raw = searchParams.get("maxPlayers");
    if (!raw) return "";
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return "";
    return String(Math.min(30, Math.max(2, parsed)));
  })();
  const dateParamRaw = searchParams.get("dateTime");
  const datePrefill = useMemo(() => {
    if (!dateParamRaw) return "";
    const parsed = new Date(dateParamRaw);
    if (Number.isNaN(parsed.getTime())) return "";
    const shifted = new Date(
      parsed.getTime() + DATE_SHIFT_DAYS * 24 * 60 * 60 * 1000
    );
    return toLocalDateTimeInput(shifted);
  }, [dateParamRaw]);

  const hasPrefillNotice = Boolean(
    titlePrefill ||
      fieldPrefill ||
      maxPlayersPrefill ||
      dateParamRaw
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to create a game.");
      return;
    }

    const form = e.currentTarget as HTMLFormElement & {
      title: HTMLInputElement;
      dateTime: HTMLInputElement;
      fieldName: HTMLInputElement;
      maxPlayers: HTMLInputElement;
    };

    const title = form.title.value.trim();
    const dateTimeLocal = form.dateTime.value;
    const fieldName = form.fieldName.value.trim();
    const maxPlayersRaw = parseInt(form.maxPlayers.value, 10);
    const maxPlayers = Number.isFinite(maxPlayersRaw)
      ? Math.min(30, Math.max(2, maxPlayersRaw))
      : 0;

    if (!title || !dateTimeLocal || !fieldName || !maxPlayers) {
      setError("Fill in all fields before submitting.");
      return;
    }

    // Disable inputs while Firestore requests resolve so users cannot submit
    // duplicate games.
    setBusy(true);
    setError(null);
    try {
      const when = Timestamp.fromDate(new Date(dateTimeLocal));
      await addDoc(collection(db, "games"), {
        title,
        dateTime: when,
        fieldName,
        maxPlayers,
        organizerUid: user.uid,
        status: "open",
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "fields", fieldName.toLowerCase().replace(/\s+/g, "-")),
        { name: fieldName },
        { merge: true }
      );

      nav("/pickup");
    } catch (e) {
      console.error(e);
      setError("Could not create the game. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        icon="🛠️"
        title="Create a pickup game"
        description="Schedule your next session, cap the roster, and instantly share it with your crew."
        stats={
          <>
            <StatPill>Publish in under a minute</StatPill>
            <StatPill>Auto-track RSVPs</StatPill>
            <StatPill>Remember favourite fields</StatPill>
          </>
        }
        actions={
          <Link to="/pickup" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            ← Back to games
          </Link>
        }
      />

      {hasPrefillNotice ? (
        <p className="text-sm text-brand-muted dark:text-brand-subtle">
          We prefilled these details from a previous game—double-check anything you
          need before publishing.
        </p>
      ) : null}

      <PageSection
        title="Game details"
        description="Fill out the essentials. We’ll auto-save the field for next time and ping your friends as soon as it’s live."
      >
        <form onSubmit={onSubmit} className="grid gap-5">
          {error ? (
            <div className="rounded-brand border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-brand-muted dark:text-brand-subtle">Title</span>
              <input
                name="title"
                placeholder="7v7 at Tower Grove"
                defaultValue={titlePrefill}
                className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-brand-muted dark:text-brand-subtle">Date & time</span>
              <input
                name="dateTime"
                type="datetime-local"
                defaultValue={datePrefill}
                className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:bg-surface-overlayDark dark:text-white"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-brand-muted dark:text-brand-subtle">Field name</span>
              <input
                name="fieldName"
                placeholder="Imo’s Soccer Park"
                defaultValue={fieldPrefill}
                className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 placeholder:text-brand-muted dark:bg-surface-overlayDark dark:text-white dark:placeholder:text-brand-subtle"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-brand-muted dark:text-brand-subtle">Max players (2–30)</span>
              <input
                name="maxPlayers"
                type="number"
                min={2}
                max={30}
                defaultValue={maxPlayersPrefill || "14"}

                className="rounded-brand border border-border-light bg-surface px-3 py-2 text-brand-strong shadow-brand-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/30 dark:bg-surface-overlayDark dark:text-white"
                required
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              disabled={!user || busy}
              className={buttonStyles({ size: "md" })}
            >
              {busy ? "Creating…" : "Create game"}
            </button>

            {!user ? (
              <p className="text-sm text-red-500">Sign in to create a game.</p>
            ) : (
              <p className="text-sm text-brand-muted dark:text-brand-subtle">
                Need to adjust later? Visit the game in <Link to="/pickup" className="underline">Pickup Soccer</Link> and edit RSVPs live.
              </p>
            )}
          </div>
        </form>
      </PageSection>
    </div>
  );
}
