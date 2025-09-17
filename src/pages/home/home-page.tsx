import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { buttonStyles } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

const PIN_STORAGE_KEY = "pinnedApps";

const APPS = [
  {
    id: "pickup",
    name: "Pickup Soccer",
    to: "/pickup",
    emoji: "⚽",
    blurb: "Post games, RSVP in one click, see spots left.",
  },
  {
    id: "santa",
    name: "Secret Santa",
    to: "/santa",
    emoji: "🎁",
    blurb: "Create a group, invite by code, auto-assign matches.",
  },
  {
    id: "fm",
    name: "FM Team Draw",
    to: "/fm",
    emoji: "🎮",
    blurb: "Randomly assign Football Manager teams to your group.",
  },
  {
    id: "bracket",
    name: "Bracket Generator",
    to: "/bracket",
    emoji: "🏆",
    blurb: "Create and manage tournament brackets.",
  },
] as const;

type App = (typeof APPS)[number];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PIN_STORAGE_KEY);
      if (raw) setPinned(JSON.parse(raw));
    } catch {
      setPinned([]);
    }
  }, []);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id];
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return APPS.filter((app) =>
      `${app.name} ${app.blurb}`.toLowerCase().includes(normalized)
    ).sort((a, b) => {
      const aPinned = pinned.includes(a.id);
      const bPinned = pinned.includes(b.id);
      if (aPinned === bPinned) return a.name.localeCompare(b.name);
      return aPinned ? -1 : 1;
    });
  }, [query, pinned]);

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-16 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl" />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Apps</h1>
            <p className="text-sm text-brand-subtle">
              A curated set of side projects, experiments, and reusable tools.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search apps…"
              className="w-full rounded-brand border border-border-light bg-surface-overlay px-4 py-2 pl-10 text-sm text-brand-strong shadow-brand-sm focus:border-brand hover:border-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/40 dark:bg-surface-overlayDark"
              inputMode="search"
            />
            <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-brand-subtle">🔎</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filteredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            pinned={pinned.includes(app.id)}
            onPin={() => togglePin(app.id)}
          />
        ))}
      </section>
    </div>
  );
}

function AppCard({ app, pinned, onPin }: { app: App; pinned: boolean; onPin: () => void }) {
  return (
    <Card className="group flex h-full flex-col justify-between" padding="lg">
      <div className="flex items-start justify-between">
        <span className="text-2xl" aria-hidden>
          {app.emoji}
        </span>
        <button
          onClick={onPin}
          className={cn(
            buttonStyles({ variant: "ghost", size: "sm" }),
            "!h-8 !px-3 text-[11px] font-medium"
          )}
          title={pinned ? "Unpin" : "Pin"}
          aria-pressed={pinned}
        >
          {pinned ? "★" : "☆"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong">{app.name}</h3>
        <p className="text-sm text-brand-subtle">{app.blurb}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Link
          to={app.to}
          className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "no-underline")}
        >
          Open <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <span className="rounded-brand-full bg-brand-subtle/10 px-3 py-1 text-[10px] uppercase tracking-wide text-brand-subtle">
          {app.id}
        </span>
      </div>
    </Card>
  );
}
