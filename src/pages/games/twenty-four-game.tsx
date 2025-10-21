import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

type Puzzle = {
  digits: [number, number, number, number];
  solutions: string[];
  hint: string;
};

type Token =
  | { type: "digit"; value: string; digitIndex: number }
  | { type: "operator"; value: string };

type ResultState = { type: "success" | "error" | "info"; message: string } | null;

const PUZZLES: Puzzle[] = [
  {
    digits: [6, 6, 6, 6],
    solutions: ["6 + 6 + 6 + 6"],
    hint: "Sometimes the obvious stack works best.",
  },
  {
    digits: [9, 8, 6, 1],
    solutions: ["9 + 8 + 6 + 1"],
    hint: "Try lining everything up with plus signs.",
  },
  {
    digits: [8, 7, 6, 3],
    solutions: ["8 + 7 + 6 + 3"],
    hint: "A simple addition sweep lands on target.",
  },
  {
    digits: [9, 9, 8, 2],
    solutions: ["9 + 9 + 8 - 2"],
    hint: "Two big numbers get you close—trim the excess.",
  },
  {
    digits: [14, 7, 4, 1],
    solutions: ["14 + 7 + 4 - 1"],
    hint: "Overshoot by a hair, then subtract it away.",
  },
  {
    digits: [15, 6, 5, 2],
    solutions: ["15 + 6 + 5 - 2"],
    hint: "You only need a small subtraction at the end.",
  },
];

const OPERATORS = [
  { value: "+", label: "Add" },
  { value: "-", label: "Subtract" },
];

export function TwentyFourGame({
  onComplete,
}: {
  onComplete?: (result: "win" | "loss") => void;
}) {
  const [puzzle, setPuzzle] = useState(() => pickRandom(PUZZLES));
  const [tokens, setTokens] = useState<Token[]>([]);
  const [usedDigits, setUsedDigits] = useState<boolean[]>(() => puzzle.digits.map(() => false));
  const [result, setResult] = useState<ResultState>(null);
  const [submitted, setSubmitted] = useState(false);
  const completionRef = useRef<"win" | "loss" | null>(null);

  const expression = useMemo(() => tokens.map((token) => token.value).join(" "), [tokens]);

  useEffect(() => {
    setTokens([]);
    setUsedDigits(puzzle.digits.map(() => false));
    setResult(null);
    setSubmitted(false);
    completionRef.current = null;
  }, [puzzle]);

  const addDigit = (digit: number, digitIndex: number) => {
    if (usedDigits[digitIndex]) {
      return;
    }

    const last = tokens[tokens.length - 1];
    if (submitted) {
      return;
    }

    if (last && last.type === "digit") {
      return;
    }

    setTokens([...tokens, { type: "digit", value: String(digit), digitIndex }]);
    setUsedDigits((state) => state.map((used, index) => (index === digitIndex ? true : used)));
  };

  const addOperator = (operator: string) => {
    if (submitted) {
      return;
    }

    const last = tokens[tokens.length - 1];
    if (!last || last.type === "operator") {
      return;
    }
    setTokens([...tokens, { type: "operator", value: operator }]);
  };

  const handleUndo = () => {
    if (submitted) {
      return;
    }

    const nextTokens = tokens.slice(0, -1);
    const removed = tokens[tokens.length - 1];
    setTokens(nextTokens);
    if (removed && removed.type === "digit") {
      setUsedDigits((state) => state.map((used, index) => (index === removed.digitIndex ? false : used)));
    }
    setResult(null);
  };

  const handleClear = () => {
    if (submitted) {
      return;
    }

    setTokens([]);
    setUsedDigits(puzzle.digits.map(() => false));
    setResult(null);
  };

  const evaluateExpression = () => {
    if (submitted) {
      return;
    }

    setSubmitted(true);

    if (usedDigits.some((used) => !used)) {
      setResult({ type: "error", message: "Use every digit exactly once." });
      if (completionRef.current !== "loss") {
        completionRef.current = "loss";
        onComplete?.("loss");
      }
      return;
    }

    if (!expression.trim()) {
      setResult({ type: "error", message: "Build an expression first." });
      if (completionRef.current !== "loss") {
        completionRef.current = "loss";
        onComplete?.("loss");
      }
      return;
    }

    const sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/");
    if (!/^[0-9+\-\s]+$/.test(sanitized)) {
      setResult({ type: "error", message: "Expression contains unsupported characters." });
      if (completionRef.current !== "loss") {
        completionRef.current = "loss";
        onComplete?.("loss");
      }
      return;
    }

    let value: number;
    try {
      // eslint-disable-next-line no-new-func
      value = Function(`"use strict"; return (${sanitized});`)();
    } catch (error) {
      setResult({ type: "error", message: "Unable to evaluate that expression." });
      if (completionRef.current !== "loss") {
        completionRef.current = "loss";
        onComplete?.("loss");
      }
      return;
    }

    if (Number.isFinite(value) && Math.abs(value - 24) < 1e-6) {
      setResult({ type: "success", message: "Exactly 24!" });
      if (completionRef.current !== "win") {
        completionRef.current = "win";
        onComplete?.("win");
      }
    } else {
      const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
      setResult({ type: "error", message: `Close! That made ${formatted}.` });
      if (completionRef.current !== "loss") {
        completionRef.current = "loss";
        onComplete?.("loss");
      }
    }
  };

  const handleNewPuzzle = () => {
    setPuzzle(pickRandom(PUZZLES, puzzle));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-6">
        <header className="space-y-1 text-sm">
          <p className="font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">One-and-done</p>
          <p className="text-brand-muted dark:text-brand-subtle">Make 24 using each number exactly once.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
              Numbers in play
            </p>
            <div className="flex flex-wrap gap-2">
              {puzzle.digits.map((digit, digitIndex) => (
                <button
                  key={`${digit}-${digitIndex}`}
                  type="button"
                  onClick={() => addDigit(digit, digitIndex)}
                  disabled={usedDigits[digitIndex] || submitted}
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-brand-lg border text-lg font-semibold transition",
                    "border-border-light bg-white/90 text-brand-strong hover:border-brand hover:bg-white dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground",
                    usedDigits[digitIndex] && "opacity-50"
                  )}
                >
                  {digit}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">
                Operators
              </p>
              <div className="flex flex-wrap gap-2">
                {OPERATORS.map((operator) => (
                  <Button
                    key={operator.value}
                    type="button"
                    variant="ghost"
                    onClick={() => addOperator(operator.value)}
                    disabled={submitted}
                  >
                    {operator.value}
                  </Button>
                ))}
              </div>
            </div>

            <p className="text-sm text-brand-muted dark:text-brand-subtle">{puzzle.hint}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-brand-md border border-border-light/70 bg-surface px-4 py-4 text-lg font-semibold text-brand-strong shadow-inner dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground">
              {expression || "Build your equation"}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={evaluateExpression} disabled={submitted}>
                Check 24
              </Button>
              <Button type="button" variant="secondary" onClick={handleUndo} disabled={submitted}>
                Undo
              </Button>
              <Button type="button" variant="ghost" onClick={handleClear} disabled={submitted}>
                Clear
              </Button>
              <Button type="button" variant="secondary" onClick={handleNewPuzzle} disabled={!submitted}>
                New puzzle
              </Button>
            </div>

            {result ? <ResultBanner result={result} /> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResultBanner({ result }: { result: ResultState }) {
  if (!result) {
    return null;
  }

  if (result.type === "success") {
    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        {result.message}
      </p>
    );
  }

  if (result.type === "info") {
    return (
      <p className="rounded-brand-md border border-sky-200/60 bg-sky-50/70 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/60 dark:bg-sky-500/20 dark:text-sky-200">
        {result.message}
      </p>
    );
  }

  return (
    <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/20 dark:text-rose-200">
      {result.message}
    </p>
  );
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
