import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

type LetterStatus = "correct" | "present" | "absent";

type GuessRecord = {
  guess: string;
  letters: LetterStatus[];
};

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const WORD_BANK = [
  "ANGEL",
  "BRAVE",
  "CLEAN",
  "DREAM",
  "EAGER",
  "FAITH",
  "GLOBE",
  "HONEY",
  "IVORY",
  "JAZZY",
  "KNACK",
  "LEMON",
  "MIGHT",
  "NOBLE",
  "OCEAN",
  "PRISM",
  "QUEEN",
  "RIVER",
  "SOLAR",
  "TOKEN",
  "UNITY",
  "VIVID",
  "WISER",
  "YOUNG",
  "ZESTY",
] as const;

function pickRandomWord(previous?: string) {
  const filtered = previous ? WORD_BANK.filter((word) => word !== previous) : WORD_BANK;
  const pool = filtered.length > 0 ? filtered : WORD_BANK;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? WORD_BANK[0]!;
}

function scoreGuess(guess: string, solution: string): LetterStatus[] {
  const letters: LetterStatus[] = Array.from({ length: WORD_LENGTH }, () => "absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    const solutionLetter = solution[i]!;
    if (guess[i] === solutionLetter) {
      letters[i] = "correct";
    } else {
      remaining[solutionLetter] = (remaining[solutionLetter] ?? 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (letters[i] === "correct") continue;
    const letter = guess[i]!;
    const available = remaining[letter] ?? 0;
    if (available > 0) {
      letters[i] = "present";
      remaining[letter] = available - 1;
    }
  }

  return letters;
}

export function WordleGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [solution, setSolution] = useState(() => pickRandomWord());
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [feedback, setFeedback] = useState<string | null>(null);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const rows = useMemo(() => {
    return Array.from({ length: MAX_ATTEMPTS }, (_, rowIndex) => guesses[rowIndex] ?? null);
  }, [guesses]);

  const remainingAttempts = MAX_ATTEMPTS - guesses.length;
  const canGuess = status === "playing";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGuess) return;

    const trimmed = guess.trim().toUpperCase();
    if (trimmed.length !== WORD_LENGTH) {
      setFeedback(`Enter a ${WORD_LENGTH}-letter word to lock it in.`);
      return;
    }

    setFeedback(null);
    const result = scoreGuess(trimmed, solution);
    const nextGuesses = [...guesses, { guess: trimmed, letters: result }];
    setGuesses(nextGuesses);
    setGuess("");

    if (trimmed === solution) {
      setStatus("won");
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      setStatus("lost");
    }
  };

  const handlePlayAgain = () => {
    setSolution((previous) => pickRandomWord(previous));
    setGuess("");
    setGuesses([]);
    setStatus("playing");
    setFeedback(null);
    completionRef.current = null;
  };

  useEffect(() => {
    if (status === "won" && completionRef.current !== "win") {
      completionRef.current = "win";
      onComplete?.("win");
    }
    if (status === "lost" && completionRef.current !== "loss") {
      completionRef.current = "loss";
      onComplete?.("loss");
    }
  }, [status, onComplete]);

  return (
    <div className="space-y-6">
      <Card className="space-y-5" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
            Wordle challenge
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
            {remainingAttempts} left
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((record, rowIndex) => (
            <div className="grid grid-cols-5 gap-2" key={rowIndex}>
              {Array.from({ length: WORD_LENGTH }, (_, colIndex) => {
                const letter = record?.guess[colIndex] ?? "";
                const state = record?.letters[colIndex] ?? null;
                return (
                  <div
                    key={colIndex}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-brand-sm border text-lg font-semibold uppercase tracking-[0.3em] transition",
                      state === "correct"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : state === "present"
                        ? "border-amber-400 bg-amber-200/70 text-amber-900 dark:border-amber-400/70 dark:bg-amber-500/40 dark:text-amber-100"
                        : state === "absent" && letter
                        ? "border-border-light/80 bg-surface-default/80 text-brand-muted dark:border-border-dark dark:bg-surface-muted/70 dark:text-brand-subtle"
                        : "border-border-light/70 bg-white/80 text-brand-muted dark:border-border-dark/80 dark:bg-surface-muted/40"
                    )}
                  >
                    <span>{letter}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">
            Guess the word
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={guess}
              onChange={(event) => {
                const next = event.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                setGuess(next.slice(0, WORD_LENGTH));
                setFeedback(null);
              }}
              className="mt-2 w-full rounded-brand-md border border-border-light/80 bg-white/90 px-4 py-3 text-base text-brand-strong shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
              placeholder="Enter letters"
              disabled={!canGuess}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canGuess}>
              Submit guess
            </Button>
            {status !== "playing" ? (
              <Button type="button" variant="secondary" onClick={handlePlayAgain}>
                New word
              </Button>
            ) : null}
          </div>
        </form>

        <Feedback status={status} feedback={feedback} solution={solution} />
      </Card>
    </div>
  );
}

function Feedback({
  status,
  feedback,
  solution,
}: {
  status: "playing" | "won" | "lost";
  feedback: string | null;
  solution: string;
}) {
  if (feedback) {
    return (
      <p className="rounded-brand-md border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/20 dark:text-amber-200">
        {feedback}
      </p>
    );
  }

  if (status === "won") {
    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        Perfect! {solution} was the hidden word.
      </p>
    );
  }

  if (status === "lost") {
    return (
      <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
        Tough break. The word was {solution}.
      </p>
    );
  }

  return (
    <p className="rounded-brand-md border border-border-light/70 bg-white/70 px-4 py-3 text-sm text-brand-muted dark:border-border-dark/60 dark:bg-surface-muted/40 dark:text-brand-subtle">
      Enter a five-letter word and follow the color clues to zero in on the answer.
    </p>
  );
}
