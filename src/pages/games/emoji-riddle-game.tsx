import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

type Riddle = {
  emojis: string;
  answers: string[];
  clue: string;
};

const RIDDLES: Riddle[] = [
  { emojis: "🎬🍿🏠", answers: ["movie night"], clue: "Couch-friendly weekend plan." },
  { emojis: "☕️⏸️", answers: ["coffee break"], clue: "Grab a sip between meetings." },
  { emojis: "🛏️📖🌙", answers: ["bedtime story"], clue: "Wind-down routine for kids." },
  { emojis: "💡💭", answers: ["bright idea"], clue: "A clever spark pops in." },
  { emojis: "🐝🌙", answers: ["honeymoon", "honey moon"], clue: "Post-wedding getaway." },
  { emojis: "🧊🪓", answers: ["break the ice", "ice breaker", "icebreaker"], clue: "Kickstart a conversation." },
  { emojis: "🤫🤝", answers: ["secret handshake"], clue: "Exclusive club greeting." },
  { emojis: "🧠🌧️", answers: ["brainstorm", "brain storm"], clue: "Idea shower with the team." },
  { emojis: "⏰🪰", answers: ["time flies", "time flys"], clue: "The hours disappear." },
  { emojis: "📚🪱", answers: ["bookworm", "book worm"], clue: "Devours chapters for fun." },
  { emojis: "❤️💔", answers: ["heartbreak", "heart break"], clue: "Emotional rough patch." },
  { emojis: "🌧️✅", answers: ["rain check", "raincheck"], clue: "Politely delay the plan." },
];

const MAX_ATTEMPTS = 3;

type Status = "idle" | "correct" | "incorrect" | "locked";

export function EmojiRiddleGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [riddle, setRiddle] = useState(() => pickRandom(RIDDLES));
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const normalizedAnswers = useMemo(
    () => new Set(riddle.answers.map((answer) => normalize(answer))),
    [riddle]
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

  const handlePlayAgain = () => {
    setRiddle(pickRandom(RIDDLES, riddle));
    setGuess("");
    setStatus("idle");
    setAttempts(0);
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
            Emoji riddle
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowHint((value) => !value)}>
            {showHint ? "Hide hint" : "Hint"}
          </Button>
        </div>

        <div className="space-y-3 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
            Decode this
          </p>
          <p className="text-balance text-5xl md:text-6xl">{riddle.emojis}</p>
          {showHint ? (
            <p className="text-sm text-brand-muted dark:text-brand-subtle">Hint: {riddle.clue}</p>
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
              placeholder="Type the phrase"
              disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canAttempt || attemptsLeft <= 0 || completionRef.current !== null}>
              Check answer
            </Button>
            {status === "correct" || status === "locked" ? (
              <Button type="button" variant="secondary" onClick={handlePlayAgain}>
                New riddle
              </Button>
            ) : null}
          </div>
        </form>

        <Feedback status={status} attemptsLeft={attemptsLeft} answers={riddle.answers} />
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
        Nailed it! {answers[0]} was the phrase.
      </p>
    );
  }

  if (status === "incorrect") {
    if (attemptsLeft <= 0) {
      return (
        <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
          Out of tries! Start fresh for a new phrase.
        </p>
      );
    }

    return (
      <p className="rounded-brand-md border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/20 dark:text-amber-200">
        Keep going! {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} left.
      </p>
    );
  }

  if (status === "locked") {
    return (
      <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
        No more attempts. The phrase was {answers[0]}.
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
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
