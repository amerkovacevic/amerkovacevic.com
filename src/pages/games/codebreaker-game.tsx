import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";

type GuessEntry = {
  guess: string;
  exact: number;
  partial: number;
};

type GameStatus = "playing" | "won" | "lost";

const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;

export function CodebreakerGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [secret, setSecret] = useState(() => generateCode());
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<GuessEntry[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const attemptsLeft = MAX_ATTEMPTS - history.length;
  const progress = useMemo(() => Math.round(((MAX_ATTEMPTS - attemptsLeft) / MAX_ATTEMPTS) * 100), [attemptsLeft]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "playing") {
      return;
    }

    if (!/^\d{4}$/.test(guess)) {
      setFeedback("Enter a 4-digit guess using numbers only.");
      return;
    }

    const evaluation = evaluateGuess(guess, secret);
    const nextHistory = [{ guess, ...evaluation }, ...history];
    setHistory(nextHistory);
    setGuess("");
    setFeedback(null);

    if (evaluation.exact === CODE_LENGTH) {
      setStatus("won");
      setFeedback("Code cracked! You win.");
      setRevealSecret(true);
      return;
    }

    if (nextHistory.length >= MAX_ATTEMPTS) {
      setStatus("lost");
      setFeedback("Out of attempts! The vault stays locked.");
      setRevealSecret(true);
      return;
    }
  };

  const handleReset = () => {
    setSecret(generateCode());
    setGuess("");
    setHistory([]);
    setStatus("playing");
    setFeedback(null);
    setRevealSecret(false);
    completionRef.current = null;
  };

  const statusMessage = status === "won" ? "Mission accomplished." : status === "lost" ? "Mission failed." : "";

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
      <Card padding="lg" className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
          <span>Attempts left: {attemptsLeft}</span>
          <span>Progress: {progress}%</span>
          <span>Status: {status === "playing" ? "Decoding" : status === "won" ? "Unlocked" : "Locked"}</span>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-brand-strong dark:text-brand-foreground">Enter a 4-digit code</h3>
              <p className="text-sm text-brand-muted dark:text-brand-subtle">
                Digits can repeat. After each guess, you’ll see how many numbers are in the correct position and how many are correct but misplaced.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">
                Your guess
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={CODE_LENGTH}
                  value={guess}
                  onChange={(event) => setGuess(event.target.value.replace(/[^0-9]/g, ""))}
                  className="mt-2 w-full rounded-brand-md border border-border-light/80 bg-white/90 px-4 py-3 text-lg text-brand-strong shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
                  placeholder="####"
                  disabled={status !== "playing"}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={status !== "playing"}>
                  Submit guess
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  New code
                </Button>
              </div>
            </form>

            {feedback ? (
              <p
                className={`rounded-brand-md border px-4 py-3 text-sm ${
                  status === "won"
                    ? "border-emerald-200/60 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : status === "lost"
                    ? "border-rose-200/60 bg-rose-50/70 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200"
                    : "border-border-light/70 bg-surface/80 text-brand-muted dark:border-border-dark dark:bg-surface-muted/70 dark:text-brand-subtle"
                }`}
              >
                {feedback}
              </p>
            ) : null}

            {statusMessage ? (
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">{statusMessage}</p>
            ) : null}

            {revealSecret ? (
              <div className="rounded-brand-md border border-border-light/70 bg-white/80 px-4 py-3 text-sm font-semibold text-brand-strong shadow-sm dark:border-border-dark dark:bg-surface-muted/80 dark:text-brand-foreground">
                Secret code: {secret}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">Guess history</p>
            {history.length === 0 ? (
              <p className="rounded-brand-md border border-dashed border-border-light/80 bg-surface/60 px-4 py-6 text-sm text-brand-muted dark:border-border-dark dark:bg-surface-muted/60 dark:text-brand-subtle">
                No guesses yet. Break the code!
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((entry, index) => (
                  <li
                    key={`${entry.guess}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-brand-md border border-border-light/80 bg-white/90 px-4 py-3 text-sm font-medium text-brand-strong shadow-sm dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground"
                  >
                    <span className="font-mono text-base">{entry.guess}</span>
                    <span className="text-xs uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
                      Exact: {entry.exact} • Misplaced: {entry.partial}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function generateCode() {
  return Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join("");
}

function evaluateGuess(guess: string, secret: string) {
  let exact = 0;
  let partial = 0;
  const secretDigits = secret.split("");
  const guessDigits = guess.split("");

  const unmatchedSecret: string[] = [];
  const unmatchedGuess: string[] = [];

  secretDigits.forEach((digit, index) => {
    const guessDigit = guessDigits[index];
    if (!guessDigit) {
      return;
    }

    if (guessDigit === digit) {
      exact += 1;
    } else {
      unmatchedSecret.push(digit);
      unmatchedGuess.push(guessDigit);
    }
  });

  unmatchedGuess.forEach((digit) => {
    const matchIndex = unmatchedSecret.indexOf(digit);
    if (matchIndex >= 0) {
      partial += 1;
      unmatchedSecret.splice(matchIndex, 1);
    }
  });

  return { exact, partial };
}
