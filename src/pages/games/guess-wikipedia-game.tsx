import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

const MAX_ATTEMPTS = 3;

const WIKIPEDIA_PAGES = [
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
    title: "Taj Mahal",
    accepted: ["Taj Mahal"],
    hint: "Mughal mausoleum on the Yamuna River.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Eiffel_Tower_%28square%29.JPG/640px-Eiffel_Tower_%28square%29.JPG",
    title: "Eiffel Tower",
    accepted: ["Eiffel Tower", "La Tour Eiffel"],
    hint: "Wrought-iron icon overlooking the Seine.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Great_Wall_of_China_June_2007.jpg/640px-Great_Wall_of_China_June_2007.jpg",
    title: "Great Wall of China",
    accepted: ["Great Wall of China", "Great Wall"],
    hint: "Ancient fortification stretching thousands of miles.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/ISS-65_International_Space_Station.jpg/640px-ISS-65_International_Space_Station.jpg",
    title: "International Space Station",
    accepted: ["International Space Station", "ISS"],
    hint: "Modular outpost orbiting Earth every 90 minutes.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/640px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    title: "Mona Lisa",
    accepted: ["Mona Lisa", "La Gioconda"],
    hint: "Renaissance portrait guarding a mysterious smile.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/NASA-Apollo8-Dec24-Earthrise.jpg/640px-NASA-Apollo8-Dec24-Earthrise.jpg",
    title: "Earthrise",
    accepted: ["Earthrise"],
    hint: "Famous lunar-orbit photograph captured in 1968.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_the_United_Nations.svg/640px-Flag_of_the_United_Nations.svg.png",
    title: "United Nations",
    accepted: ["United Nations", "UN"],
    hint: "Global organization founded after World War II.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Golden_Gate_Bridge_from_Battery_Spencer.jpg/640px-Golden_Gate_Bridge_from_Battery_Spencer.jpg",
    title: "Golden Gate Bridge",
    accepted: ["Golden Gate Bridge"],
    hint: "Suspension landmark linking San Francisco to Marin.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Mount_Everest_as_seen_from_Drukair2_PLW_edit.jpg/640px-Mount_Everest_as_seen_from_Drukair2_PLW_edit.jpg",
    title: "Mount Everest",
    accepted: ["Mount Everest", "Everest"],
    hint: "Tallest mountain on Earth's surface.",
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sydney_Opera_House_-_Dec_2008.jpg/640px-Sydney_Opera_House_-_Dec_2008.jpg",
    title: "Sydney Opera House",
    accepted: ["Sydney Opera House"],
    hint: "Sail-inspired performing arts venue on Bennelong Point.",
  },
] as const;

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
