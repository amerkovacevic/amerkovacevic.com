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

  const pinnedApps = useMemo(
    () => APPS.filter((app) => pinned.includes(app.id)),
    [pinned]
  );

  return (
    <div className="relative space-y-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-36 -left-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-16 h-[28rem] w-[26rem] rounded-full bg-brand-accent/15 blur-3xl" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden" padding="lg">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-brand-accent/10" aria-hidden />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-brand-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Featured
              </span>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Build playful experiences for your crew in seconds.
              </h1>
              <p className="max-w-xl text-base text-brand-subtle">
                Pin the apps you love, discover new experiments, and invite your friends to collaborate with delightfully simple tools.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
              <span className="rounded-brand-full bg-brand/10 px-3 py-1 text-brand">
                {pinnedApps.length ? `${pinnedApps.length} pinned` : "Pin favorites"}
              </span>
              <span className="rounded-brand-full bg-brand-accent/10 px-3 py-1 text-brand-accent">Instant sharing</span>
              <span className="rounded-brand-full bg-brand/5 px-3 py-1">Football & friends</span>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden" padding="lg">
          <div className="absolute right-[-120px] top-[-120px] h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden />
          <div className="relative space-y-5">
            <div>
              <p className="text-sm font-semibold text-brand-strong">Find your tool</p>
              <p className="text-sm text-brand-subtle">Search across projects and filter by pinned favourites.</p>
            </div>
            <div className="relative">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search apps, e.g. pickup"
                className="w-full rounded-brand border border-border-light bg-surface/90 px-4 py-3 pl-11 text-sm text-brand-strong shadow-brand-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-accent/40 hover:border-brand-muted dark:bg-surface-overlayDark"
                inputMode="search"
              />
              <span className="pointer-events-none absolute left-4 top-3 text-base">🔍</span>
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-semibold uppercase tracking-[0.2em] text-brand-muted">Pinned</p>
              {pinnedApps.length ? (
                <div className="flex flex-wrap gap-2">
                  {pinnedApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setQuery(app.name)}
                      className="group flex items-center gap-2 rounded-brand-full border border-border-light bg-surface/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-muted transition hover:border-brand/40 hover:text-brand-strong"
                    >
                      <span>{app.emoji}</span>
                      {app.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-brand bg-brand/5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-brand-subtle">
                  Pin an app to spotlight it here.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-strong">All apps</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-brand-muted">{filteredApps.length} available</span>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              pinned={pinned.includes(app.id)}
              onPin={() => togglePin(app.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AppCard({ app, pinned, onPin }: { app: App; pinned: boolean; onPin: () => void }) {
  return (
    <Card className="group relative flex h-full flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-brand" padding="lg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
      <div className="relative flex items-start justify-between">
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
          <span className="transition-transform duration-200 group-hover:scale-110">
            {pinned ? "★" : "☆"}
          </span>
        </button>
      </div>
      <div className="relative mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong">{app.name}</h3>
        <p className="text-sm text-brand-subtle">{app.blurb}</p>
      </div>
      <div className="relative mt-6 flex items-center justify-between">
        <Link
          to={app.to}
          className={cn(
            buttonStyles({ variant: "secondary", size: "sm" }),
            "no-underline transition-transform duration-200 group-hover:translate-x-1"
          )}
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
