import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";
import { PageHero, PageSection, StatPill } from "../../shared/components/page";

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
  {
    id: "links",
    name: "Link in Bio",
    to: "/links",
    emoji: "🌐",
    blurb: "Gather every profile and project in one beautiful hub.",
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
    <div className="space-y-8">
      <PageHero
        icon="✨"
        eyebrow="Featured"
        title="Build playful experiences for your crew in seconds."
        description="Pin the apps you love, discover new experiments, and invite friends to collaborate with delightfully simple tools."
        stats={
          <>
            <StatPill>
              {pinnedApps.length ? `${pinnedApps.length} pinned` : "Pin favorites"}
            </StatPill>
            <StatPill>Instant sharing</StatPill>
            <StatPill>Football & friends</StatPill>
          </>
        }
      />

      <PageSection
        title="Find your tool"
        description="Search across projects and filter by pinned favourites."
        contentClassName="space-y-5"
      >
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
      </PageSection>

      <PageSection
        title="All apps"
        description={`${filteredApps.length} available`}
        contentClassName="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {filteredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            pinned={pinned.includes(app.id)}
            onPin={() => togglePin(app.id)}
          />
        ))}
      </PageSection>
    </div>
  );
}

function AppCard({ app, pinned, onPin }: { app: App; pinned: boolean; onPin: () => void }) {
  const navigate = useNavigate();

  const handleOpen = () => navigate(app.to);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-brand-lg border border-border-light bg-surface/90 p-6 text-left shadow-brand-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand dark:bg-surface-overlayDark"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
      <div className="relative flex items-start justify-between">
        <span className="text-2xl" aria-hidden>
          {app.emoji}
        </span>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onPin();
          }}
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
        <span
          className={cn(
            buttonStyles({ variant: "secondary", size: "sm" }),
            "pointer-events-none select-none no-underline"
          )}
        >
          Open <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
        <span className="rounded-brand-full bg-brand-subtle/10 px-3 py-1 text-[10px] uppercase tracking-wide text-brand-subtle">
          {app.id}
        </span>
      </div>
    </div>
  );
}
