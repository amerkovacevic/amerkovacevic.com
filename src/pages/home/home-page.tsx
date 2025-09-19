import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// Static catalogue of tools surfaced on the landing page.
const APPS = [
  {
    id: "pickup",
    name: "Pickup Soccer",
    to: "/pickup",
    blurb: "Post games, RSVP in one click, see spots left.",
    emoji: "⚽️",
  },
  {
    id: "santa",
    name: "Secret Santa",
    to: "/santa",
    blurb: "Create a group, invite by code, auto-assign matches.",
    emoji: "🎅",
  },
  {
    id: "fm",
    name: "FM Team Draw",
    to: "/fm",
    blurb: "Randomly assign Football Manager teams to your group.",
    emoji: "🎮",
  },
  {
    id: "bracket",
    name: "Bracket Generator",
    to: "/bracket",
    blurb: "Create and manage tournament brackets.",
    emoji: "🏆",
  },
  {
    id: "sbc",
    name: "FC 26 SBC Solver",
    to: "/sbc",
    blurb: "Import your club and auto-build challenge squads.",
    emoji: "🧩",
  },
  {
    id: "links",
    name: "Contact",
    to: "/links",
    blurb: "Reach me anywhere from one tidy home for every profile.",
    emoji: "🔗",
  },
] as const;

type App = (typeof APPS)[number];

// HomePage showcases every mini-app and routes users when a card is selected.
export default function HomePage() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {APPS.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}

// Individual app card handles keyboard interaction so the grid stays accessible.
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
        <span className="relative grid h-14 w-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-white via-white/60 to-white/20 text-3xl shadow-brand-sm ring-1 ring-border-light transition-colors duration-300 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 dark:ring-border-dark">
          <span aria-hidden>{app.emoji}</span>
          <span className="sr-only">{app.name} icon</span>
        </span>
        <span className="mt-1 text-brand-muted transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-brand-subtle">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{app.name}</h3>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{app.blurb}</p>
      </div>
    </div>
  );
}
