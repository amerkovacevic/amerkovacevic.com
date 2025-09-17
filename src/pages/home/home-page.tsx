import { useNavigate } from "react-router-dom";

import { buttonStyles } from "../../shared/components/ui/button";
import { cn } from "../../shared/lib/classnames";

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
    name: "Contact",
    to: "/links",
    emoji: "🌐",
    blurb: "Reach me anywhere from one tidy home for every profile.",
  },
] as const;

type App = (typeof APPS)[number];

export default function HomePage() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {APPS.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}

function AppCard({ app }: { app: App }) {
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
      className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-brand-lg border border-border-light bg-surface p-6 text-left text-brand-strong shadow-brand-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-brand-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
      <div className="relative flex items-start justify-between">
        <span className="text-2xl" aria-hidden>
          {app.emoji}
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{app.name}</h3>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{app.blurb}</p>
      </div>
      <div className="relative mt-6 flex items-center justify-between">
        <span
          className={cn(
            buttonStyles({ variant: "secondary", size: "sm" }),
            "pointer-events-none select-none no-underline text-brand-strong dark:text-brand-foreground"
          )}
        >
          Open <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
        <span className="rounded-brand-full bg-brand-subtle/10 px-3 py-1 text-[10px] uppercase tracking-wide text-brand-muted dark:bg-brand-subtle/20 dark:text-brand-subtle">
          {app.id}
        </span>
      </div>
    </div>
  );
}
