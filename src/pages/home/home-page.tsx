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
          secondary: "#facc15",
          background: "#0f172a",
          stroke: "#e2e8f0",
        }
      : {
          primary: "#0284c7",
          secondary: "#f97316",
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
        <circle cx="24" cy="24" r="17" fill={background} stroke={primary} strokeWidth="2.5" />
        <polygon points="24,16 28,19 26,24 22,24 20,19" fill={primary} stroke={stroke} strokeLinejoin="round" strokeWidth="1.5" />
        <path
          d="M24 16l4-2m-4 2-4-2m-4 6-3 3m7 1-2 5m12-5 2 5m1-11 3 3m-10-3h6m-16 0h6m-1 12-4 2m13-2 4 2"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="15" cy="24" r="2" fill={secondary} />
        <circle cx="33" cy="24" r="2" fill={secondary} />
      </svg>
    );
  },
  santa: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <path
          d="M10 30c0-5.5 4.5-9.5 14-12.5L38 12l-6 9.5c3 1.5 5 4.3 5 7.5 0 4-3 7-7.5 7h-12C13 36 10 33 10 30Z"
          fill={background}
          stroke={primary}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M15 28h18"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M36 12c-3-2.5-7-4-11-4-3 0-6 1-8.5 2.5"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M12 26l14-9 9 3" fill={primary} fillOpacity={0.85} />
        <path d="M14 30h20" stroke={secondary} strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="37" cy="13" r="3.3" fill={secondary} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  },
  fm: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <path
          d="M10 18c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6v12c0 3.3-2.7 6-6 6H16c-3.3 0-6-2.7-6-6V18Z"
          fill={background}
          stroke={primary}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M18 29v-9h6m-6 4h4"
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M31 20c-2 0-3 .8-3 2.5V29h2.6v-3.3h2l1.4 3.3H37l-1.6-3.7c1-.5 1.6-1.4 1.6-2.6 0-2-1.4-3.4-4-3.4Z"
          fill={secondary}
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M17 33h14" stroke={primary} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  },
  bracket: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <path
          d="M15 16h18l-1.2 8.5c-.4 2.9-2.8 5-5.8 5h-4c-3 0-5.4-2.1-5.8-5L15 16Z"
          fill={background}
          stroke={primary}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M17 16v-3h14v3M20 29l-1 6m10-6 1 6"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19 35h10l-.8 3.5c-.2.9-1 1.5-1.9 1.5h-4.6c-.9 0-1.7-.6-1.9-1.5L19 35Z"
          fill={secondary}
        />
        <circle cx="24" cy="23" r="3" fill={secondary} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  },
  links: ({ palette }) => {
    const { background, primary, secondary, stroke } = palette;
    return (
      <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10">
        <rect x="9" y="14" width="30" height="20" rx="5" fill={background} stroke={primary} strokeWidth="2.4" />
        <path d="M12 18l12 8 12-8" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 32h24" stroke={primary} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="37" cy="16" r="3" fill={secondary} stroke={stroke} strokeWidth="1.4" />
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
