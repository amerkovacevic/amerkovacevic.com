import { FormEvent, useMemo, useState } from "react";

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

const MAX_ATTEMPTS_PER_RIDDLE = 3;

type Status = "idle" | "correct" | "incorrect" | "revealed";

export function EmojiRiddleGame() {
  const [order, setOrder] = useState(() => shuffle(RIDDLES));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const riddle = order[index] ?? order[0];

  if (!riddle) {
    return null;
  }

  const normalizedAnswers = useMemo(
    () => new Set(riddle.answers.map((answer) => normalize(answer))),
    [riddle]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guess.trim() || status === "correct" || attempts >= MAX_ATTEMPTS_PER_RIDDLE) {
      return;
    }

    const normalizedGuess = normalize(guess);
    if (normalizedAnswers.has(normalizedGuess)) {
      setStatus("correct");
      setSolved((count) => count + 1);
      setStreak((value) => value + 1);
    } else {
      setStatus("incorrect");
      setAttempts((value) => value + 1);
      setStreak(0);
    }
  };

  const handleReveal = () => {
    setStatus("revealed");
    setStreak(0);
  };

  const handleNext = () => {
    const nextIndex = index + 1;
    if (nextIndex >= order.length) {
      setOrder(shuffle(RIDDLES));
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }

    setGuess("");
    setStatus("idle");
    setAttempts(0);
    setShowHint(false);
  };

  const attemptsLeft = MAX_ATTEMPTS_PER_RIDDLE - attempts;
  const progressLabel = `${index + 1} of ${order.length}`;

  return (
    <div className="space-y-6">
      <Card className="space-y-4" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            <span>{progressLabel}</span>
            <span>Streak: {streak}</span>
            <span>Solved: {solved}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHint((value) => !value)}>
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
              Decode this
            </p>
            <p className="text-balance text-center text-5xl md:text-left md:text-6xl">{riddle.emojis}</p>
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
                disabled={status === "correct" || status === "revealed"}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={status === "correct"}>
                Check answer
              </Button>
              <Button type="button" variant="secondary" onClick={handleNext}>
                {status === "correct" || status === "revealed" ? "Next riddle" : "Skip"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReveal}
                disabled={status === "revealed"}
              >
                Reveal
              </Button>
            </div>

            <Feedback status={status} attemptsLeft={attemptsLeft} answers={riddle.answers} />
          </form>
        </div>
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
    const primaryAnswer = answers[0];
    if (!primaryAnswer) {
      return null;
    }

    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        Nailed it! You decoded {primaryAnswer.toLowerCase()}.
      </p>
    );
  }

  if (status === "revealed") {
    return (
      <p className="rounded-brand-md border border-border-light/70 bg-surface/80 px-4 py-3 text-sm text-brand-muted dark:border-border-dark dark:bg-surface-muted/70 dark:text-brand-subtle">
        Answer: {answers.join(" / ")}
      </p>
    );
  }

  if (status === "incorrect") {
    if (attemptsLeft <= 0) {
      return (
        <p className="rounded-brand-md border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/15 dark:text-amber-200">
          Out of tries! Reveal the answer or skip to the next riddle.
        </p>
      );
    }

    return (
      <p className="rounded-brand-md border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/15 dark:text-amber-200">
        Not quite. {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left.
      </p>
    );
  }

  return null;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function shuffle<T>(items: readonly T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = clone[i];
    const swapTarget = clone[j];
    if (temp === undefined || swapTarget === undefined) {
      continue;
    }
    clone[i] = swapTarget;
    clone[j] = temp;
  }
  return clone;
}
