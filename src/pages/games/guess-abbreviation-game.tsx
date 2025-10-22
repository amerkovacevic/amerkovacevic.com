import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

type AbbreviationCard = {
  term: string;
  answers: string[];
  hint: string;
  category: string;
};

const MAX_ATTEMPTS = 3;

const ABBREVIATIONS: AbbreviationCard[] = [
  {
    term: "NASA",
    answers: ["national aeronautics and space administration"],
    hint: "U.S. agency behind Apollo and Artemis missions.",
    category: "Space",
  },
  {
    term: "FIFA",
    answers: ["federation internationale de football association", "fédération internationale de football association"],
    hint: "Governs the World Cup.",
    category: "Sports",
  },
  {
    term: "DIY",
    answers: ["do it yourself"],
    hint: "Weekend warriors swear by this approach.",
    category: "Lifestyle",
  },
  {
    term: "ETA",
    answers: ["estimated time of arrival", "expected time of arrival"],
    hint: "Asked for when tracking someone's commute.",
    category: "Logistics",
  },
  {
    term: "CPU",
    answers: ["central processing unit"],
    hint: "The computer's brain.",
    category: "Technology",
  },
  {
    term: "ASAP",
    answers: ["as soon as possible"],
    hint: "Priority level: now.",
    category: "Business",
  },
  {
    term: "LOL",
    answers: ["laughing out loud"],
    hint: "Classic text reaction.",
    category: "Internet",
  },
  {
    term: "UNESCO",
    answers: [
      "united nations educational scientific and cultural organization",
      "united nations educational, scientific and cultural organization",
    ],
    hint: "Protects world heritage sites.",
    category: "Global",
  },
  {
    term: "VPN",
    answers: ["virtual private network"],
    hint: "Keeps browsing secure on public Wi-Fi.",
    category: "Security",
  },
  {
    term: "ROI",
    answers: ["return on investment"],
    hint: "Key metric for campaign performance.",
    category: "Finance",
  },
  {
    term: "AI",
    answers: ["artificial intelligence"],
    hint: "Powers modern assistants and copilots.",
    category: "Technology",
  },
  {
    term: "BYOB",
    answers: ["bring your own beverage", "bring your own beer", "bring your own booze"],
    hint: "Party planning policy.",
    category: "Social",
  },
  {
    term: "FAQ",
    answers: ["frequently asked questions"],
    hint: "The support page staple.",
    category: "Support",
  },
  {
    term: "GPS",
    answers: ["global positioning system"],
    hint: "Makes turn-by-turn navigation possible.",
    category: "Navigation",
  },
  {
    term: "NBA",
    answers: ["national basketball association"],
    hint: "Hosts the Finals every June.",
    category: "Sports",
  },
];

type Status = "idle" | "correct" | "incorrect" | "locked";

export function GuessTheAbbreviationGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [card, setCard] = useState(() => pickRandom(ABBREVIATIONS));
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [showHint, setShowHint] = useState(false);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const normalizedAnswers = useMemo(
    () => new Set(card.answers.map((answer) => normalize(answer))),
    [card]
  );

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const canAttempt = status === "idle" || status === "incorrect";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guess.trim() || !canAttempt || attemptsLeft <= 0) {
      return;
    }

    const normalizedGuess = normalize(guess);
    if (normalizedAnswers.has(normalizedGuess)) {
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
    setCard(pickRandom(ABBREVIATIONS, card));
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
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
              Guess the abbreviation
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-muted/80 dark:text-brand-subtle/80">
              Category: {card.category}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHint((value) => !value)}>
            {showHint ? "Hide hint" : "Hint"}
          </Button>
        </div>

        <div className="space-y-3 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
            What does this stand for?
          </p>
          <p className="text-balance text-5xl font-semibold tracking-[0.15em] md:text-6xl">{card.term}</p>
          {showHint ? (
            <p className="text-sm text-brand-muted dark:text-brand-subtle">Hint: {card.hint}</p>
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
              placeholder="Type the full phrase"
              disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}>
              Check answer
            </Button>
            {status === "correct" || status === "locked" ? (
              <Button type="button" variant="secondary" onClick={handleNext}>
                New abbreviation
              </Button>
            ) : null}
          </div>
        </form>

        <Feedback status={status} attemptsLeft={attemptsLeft} answers={card.answers} />
      </Card>
    </div>
  );
}

function Feedback({
  status,
  attemptsLeft,
  answers,
}: {
  status: Status;
  attemptsLeft: number;
  answers: string[];
}) {
  if (status === "correct") {
    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        Correct! It stands for {answers[0]}.
      </p>
    );
  }

  if (status === "incorrect") {
    if (attemptsLeft <= 0) {
      return (
        <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
          Out of attempts! Try another abbreviation.
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
        No more tries. It stood for {answers[0]}.
      </p>
    );
  }

  return null;
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
