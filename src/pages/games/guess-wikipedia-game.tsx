import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

const MAX_ATTEMPTS = 3;

const WIKIPEDIA_PAGES = createWikipediaPages();

function createWikipediaPages() {
  return [
    {
      imageUrl: createPoster({
        id: "taj-mahal",
        emoji: "🕌",
        title: "Taj Mahal",
        gradientFrom: "#fde3cf",
        gradientTo: "#f6a7a0",
        accent: "#5e2b1f",
      }),
      title: "Taj Mahal",
      accepted: ["Taj Mahal"],
      hint: "Mughal mausoleum on the Yamuna River.",
    },
    {
      imageUrl: createPoster({
        id: "eiffel-tower",
        emoji: "🗼",
        title: "Eiffel Tower",
        gradientFrom: "#d7ecff",
        gradientTo: "#86b0ff",
        accent: "#1c3f73",
      }),
      title: "Eiffel Tower",
      accepted: ["Eiffel Tower", "La Tour Eiffel"],
      hint: "Wrought-iron icon overlooking the Seine.",
    },
    {
      imageUrl: createPoster({
        id: "great-wall",
        emoji: "🧱",
        title: "Great Wall",
        gradientFrom: "#f9e7d2",
        gradientTo: "#d1b48f",
        accent: "#5f3c20",
      }),
      title: "Great Wall of China",
      accepted: ["Great Wall of China", "Great Wall"],
      hint: "Ancient fortification stretching thousands of miles.",
    },
    {
      imageUrl: createPoster({
        id: "iss",
        emoji: "🛰️",
        title: "ISS",
        gradientFrom: "#131a2a",
        gradientTo: "#2b4f73",
        accent: "#b7d7ff",
      }),
      title: "International Space Station",
      accepted: ["International Space Station", "ISS"],
      hint: "Modular outpost orbiting Earth every 90 minutes.",
    },
    {
      imageUrl: createPoster({
        id: "mona-lisa",
        emoji: "🖼️",
        title: "Mona Lisa",
        gradientFrom: "#f2e0c4",
        gradientTo: "#caa177",
        accent: "#4a3623",
      }),
      title: "Mona Lisa",
      accepted: ["Mona Lisa", "La Gioconda"],
      hint: "Renaissance portrait guarding a mysterious smile.",
    },
    {
      imageUrl: createPoster({
        id: "earthrise",
        emoji: "🌍",
        title: "Earthrise",
        gradientFrom: "#001d3d",
        gradientTo: "#00436d",
        accent: "#8dd2ff",
      }),
      title: "Earthrise",
      accepted: ["Earthrise"],
      hint: "Famous lunar-orbit photograph captured in 1968.",
    },
    {
      imageUrl: createPoster({
        id: "united-nations",
        emoji: "🇺🇳",
        title: "United Nations",
        gradientFrom: "#d2ecff",
        gradientTo: "#6db4ff",
        accent: "#134a9b",
      }),
      title: "United Nations",
      accepted: ["United Nations", "UN"],
      hint: "Global organization founded after World War II.",
    },
    {
      imageUrl: createPoster({
        id: "golden-gate",
        emoji: "🌉",
        title: "Golden Gate",
        gradientFrom: "#ffe4d6",
        gradientTo: "#ff9575",
        accent: "#9b2f20",
      }),
      title: "Golden Gate Bridge",
      accepted: ["Golden Gate Bridge"],
      hint: "Suspension landmark linking San Francisco to Marin.",
    },
    {
      imageUrl: createPoster({
        id: "mount-everest",
        emoji: "🏔️",
        title: "Everest",
        gradientFrom: "#e6f2ff",
        gradientTo: "#7fb3e5",
        accent: "#1d4168",
      }),
      title: "Mount Everest",
      accepted: ["Mount Everest", "Everest"],
      hint: "Tallest mountain on Earth's surface.",
    },
    {
      imageUrl: createPoster({
        id: "sydney-opera-house",
        emoji: "🎶",
        title: "Sydney Opera",
        gradientFrom: "#f4ecff",
        gradientTo: "#b99bff",
        accent: "#4a2d7b",
      }),
      title: "Sydney Opera House",
      accepted: ["Sydney Opera House"],
      hint: "Sail-inspired performing arts venue on Bennelong Point.",
    },
  ] as const;
}

function createPoster({
  id,
  emoji,
  title,
  gradientFrom,
  gradientTo,
  accent,
}: {
  id: string;
  emoji: string;
  title: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
}) {
  const safeTitle = escapeXml(title);
  const safeEmoji = escapeXml(emoji);
  const gradientId = `grad-${id}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gradientFrom}" />
          <stop offset="100%" stop-color="${gradientTo}" />
        </linearGradient>
        <filter id="shadow-${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="rgba(0,0,0,0.25)" />
        </filter>
      </defs>
      <rect width="640" height="360" rx="48" fill="url(#${gradientId})" />
      <g filter="url(#shadow-${id})">
        <circle cx="180" cy="180" r="96" fill="rgba(255,255,255,0.25)" />
        <circle cx="470" cy="120" r="56" fill="rgba(255,255,255,0.18)" />
        <circle cx="520" cy="250" r="72" fill="rgba(255,255,255,0.22)" />
      </g>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-size="120" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">${safeEmoji}</text>
      <text x="50%" y="74%" dominant-baseline="middle" text-anchor="middle" font-size="54" font-family="'Poppins', 'Segoe UI', sans-serif" font-weight="600" fill="${accent}">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickRandom<T>(items: readonly T[], exclude?: T) {
  if (items.length === 0) {
    throw new Error("No items provided");
  }

  const filtered = exclude ? items.filter((item) => item !== exclude) : items;
  const pool = filtered.length > 0 ? filtered : items;
  const index = Math.floor(Math.random() * pool.length);
  const selection = pool[index];
  if (!selection) {
    return items[0]!;
  }
  return selection;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

type Status = "idle" | "correct" | "incorrect" | "locked";

export function GuessTheWikipediaGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [page, setPage] = useState(() => pickRandom(WIKIPEDIA_PAGES));
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [showHint, setShowHint] = useState(false);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const acceptedTitles = useMemo(() => {
    return new Set(page.accepted.map((title) => normalize(title)));
  }, [page]);

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const canAttempt = status === "idle" || status === "incorrect";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guess.trim() || !canAttempt || attemptsLeft <= 0) {
      return;
    }

    const normalizedGuess = normalize(guess);
    if (acceptedTitles.has(normalizedGuess)) {
      setStatus("correct");
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setStatus("locked");
      } else {
        setStatus("incorrect");
      }
    }
  };

  const handleNext = () => {
    setPage(pickRandom(WIKIPEDIA_PAGES, page));
    setGuess("");
    setAttempts(0);
    setStatus("idle");
    setShowHint(false);
    completionRef.current = null;
  };

  useEffect(() => {
    if (status === "correct" && completionRef.current !== "win") {
      completionRef.current = "win";
      onComplete?.("win");
    }
    if (status === "locked" && completionRef.current !== "loss") {
      completionRef.current = "loss";
      onComplete?.("loss");
    }
  }, [status, onComplete]);

  return (
    <div className="space-y-6">
      <Card className="space-y-5" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            Guess the page
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowHint((value) => !value)}>
            {showHint ? "Hide hint" : "Hint"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-brand-lg border border-border-light/70 bg-white/80 shadow-sm dark:border-border-dark/60 dark:bg-surface-muted/60">
            <img
              src={page.imageUrl}
              alt={page.title}
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </div>
          {showHint ? (
            <p className="text-sm text-brand-muted dark:text-brand-subtle">Hint: {page.hint}</p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">
            Your guess
            <input
              type="text"
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              className="mt-2 w-full rounded-brand-md border border-border-light/80 bg-white/90 px-4 py-3 text-base text-brand-strong shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
              placeholder="Name the Wikipedia page"
              disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}>
              Check answer
            </Button>
            {status === "correct" || status === "locked" ? (
              <Button type="button" variant="secondary" onClick={handleNext}>
                New page
              </Button>
            ) : null}
          </div>
        </form>

        <Feedback status={status} attemptsLeft={attemptsLeft} title={page.title} />
      </Card>
    </div>
  );
}

function Feedback({
  status,
  attemptsLeft,
  title,
}: {
  status: Status;
  attemptsLeft: number;
  title: string;
}) {
  if (status === "correct") {
    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        Correct! The page was {title}.
      </p>
    );
  }

  if (status === "incorrect") {
    if (attemptsLeft <= 0) {
      return (
        <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
          Out of attempts! Try another page.
        </p>
      );
    }

    return (
      <p className="rounded-brand-md border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/20 dark:text-amber-200">
        Not quite. {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} left.
      </p>
    );
  }

  if (status === "locked") {
    return (
      <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
        No more tries. That was the Wikipedia page for {title}.
      </p>
    );
  }

  return null;
}
