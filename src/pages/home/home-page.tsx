import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { useTheme } from "../../app/providers";

const APPS = [
  {
    id: "pickup",
    name: "Pickup Soccer",
    to: "/pickup",
    blurb: "Post games, RSVP in one click, see spots left.",
  },
  {
    id: "santa",
    name: "Secret Santa",
    to: "/santa",
    blurb: "Create a group, invite by code, auto-assign matches.",
  },
  {
    id: "fm",
    name: "FM Team Draw",
    to: "/fm",
    blurb: "Randomly assign Football Manager teams to your group.",
  },
  {
    id: "bracket",
    name: "Bracket Generator",
    to: "/bracket",
    blurb: "Create and manage tournament brackets.",
  },
  {
    id: "links",
    name: "Contact",
    to: "/links",
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
        <AppIcon id={app.id} />
        <span className="mt-1 text-brand-muted transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-brand-subtle">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        <h3 className="text-lg font-semibold text-brand-strong dark:text-brand-foreground">{app.name}</h3>
        <p className="text-sm text-brand-muted dark:text-brand-subtle">{app.blurb}</p>
      </div>
      <div className="relative mt-6 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.28em] text-brand-muted transition-colors duration-300 dark:text-brand-subtle">
        <span>Explore</span>
        <span>{app.name}</span>
      </div>
    </div>
  );
}

function AppIcon({ id }: { id: App["id"] }) {
  const { theme } = useTheme();

  const palette =
    theme === "dark"
      ? {
          primary: "#38bdf8",
          secondary: "#22d3ee",
          background: "#082f49",
          stroke: "#f8fafc",
        }
      : {
          primary: "#0284c7",
          secondary: "#0ea5e9",
          background: "#e0f2fe",
          stroke: "#0f172a",
        };

  const iconProps = { palette } as const;

  return (
    <span className="relative grid h-14 w-14 place-items-center rounded-[1.35rem] bg-gradient-to-br from-white via-white/60 to-white/20 shadow-brand-sm ring-1 ring-border-light transition-colors duration-300 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 dark:ring-border-dark">
      {ICONS[id](iconProps)}
    </span>
  );
}

const ICONS: Record<App["id"], ({ palette }: { palette: Palette }) => JSX.Element> = {
  pickup: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <circle cx="24" cy="24" r="18" fill={background} stroke={primary} strokeWidth="2.5" />
        <path d="M24 15l7 4-2.5 8h-9L17 19z" fill={primary} />
        <path
          d="M24 33l-4.2-2.5-4.1 1.7M24 33l4.2-2.5 4.1 1.7M24 15l1.5 6h6.5M24 15l-1.5 6H16"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="13" cy="22" r="2.5" fill={secondary} />
        <circle cx="35" cy="22" r="2.5" fill={secondary} />
      </svg>
    );
  },
  santa: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <rect x="10" y="18" width="28" height="20" rx="5" fill={background} stroke={primary} strokeWidth="2.5" />
        <path d="M10 24h28" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="21.5" y="14" width="5" height="24" rx="2.5" fill={secondary} />
        <path d="M18 16c2-3.5 5-5 6-5s4 1.5 6 5" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill={primary} stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  },
  fm: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <path
          d="M12 30c0-5.5 4-10 12-10s12 4.5 12 10c0 3-1.5 5-4.5 5h-15C13.5 35 12 33 12 30Z"
          fill={background}
          stroke={primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="27" r="2.5" fill={primary} />
        <circle cx="30" cy="27" r="2.5" fill={primary} />
        <path d="M21 22l-3-5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M27 22l3-5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M24 24l-2 3h4l-2-3Z" fill={secondary} />
      </svg>
    );
  },
  bracket: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <rect x="12" y="12" width="24" height="24" rx="6" fill={background} stroke={primary} strokeWidth="2.5" />
        <path
          d="M19 17h-3v14h3M29 17h3v14h-3M19 24h10"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="3" fill={secondary} />
      </svg>
    );
  },
  links: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <circle cx="24" cy="24" r="18" fill={background} stroke={primary} strokeWidth="2.5" />
        <path
          d="M24 9c5.5 4 8 9 8 15s-2.5 11-8 15c-5.5-4-8-9-8-15s2.5-11 8-15Z"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M11 24h26" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15 15h18M15 33h18" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  },
};

type Palette = {
  primary: string;
  secondary: string;
  background: string;
  stroke: string;
};
