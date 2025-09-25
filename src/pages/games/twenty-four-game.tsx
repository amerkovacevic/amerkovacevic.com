import { useEffect, useMemo, useState } from "react";

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
  | { type: "operator"; value: string }
  | { type: "paren"; value: "(" | ")" };

type ResultState = { type: "success" | "error" | "info"; message: string } | null;

const PUZZLES: Puzzle[] = [
  {
    digits: [1, 3, 4, 6],
    solutions: ["6 / (1 - 3/4)"],
    hint: "Try building a tiny denominator by subtracting a fraction from 1.",
  },
  {
    digits: [2, 3, 4, 6],
    solutions: ["(6 * 4) / (3 - 2)"],
    hint: "Multiplication plus a small subtraction can lock in 24 quickly.",
  },
  {
    digits: [1, 5, 5, 5],
    solutions: ["5 * (5 - 1/5)"],
    hint: "Think about turning one of the fives into a fractional adjustment.",
  },
  {
    digits: [3, 3, 8, 8],
    solutions: ["8 / (3 - 8/3)"],
    hint: "Use division to create a tiny number in the denominator.",
  },
  {
    digits: [2, 2, 3, 9],
    solutions: ["(9 - 3) * (2 + 2)"],
    hint: "Can you create two numbers that multiply cleanly to 24?",
  },
  {
    digits: [2, 4, 6, 6],
    solutions: ["(6 + 6) * (4 / 2)"],
    hint: "Pair addition with a simple fraction.",
  },
  {
    digits: [1, 2, 3, 4],
    solutions: ["4 * (3 + 2 + 1)"],
    hint: "Sometimes stacking simple additions inside parentheses is enough.",
  },
  {
    digits: [1, 2, 3, 8],
    solutions: ["8 / (1 - 2/3)"],
    hint: "Fractions are your friend. Aim for one-third in the denominator.",
  },
];

const OPERATORS = [
  { value: "+", label: "Add" },
  { value: "-", label: "Subtract" },
  { value: "×", label: "Multiply" },
  { value: "÷", label: "Divide" },
];

export function TwentyFourGame() {
  const [order, setOrder] = useState<Puzzle[]>(() => shuffle(PUZZLES));
  const [index, setIndex] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const initialPuzzle: Puzzle = order[0] ?? PUZZLES[0]!;
  const [usedDigits, setUsedDigits] = useState<boolean[]>(() => initialPuzzle.digits.map(() => false));
  const [result, setResult] = useState<ResultState>(null);
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [history, setHistory] = useState<{ expression: string; success: boolean }[]>([]);

  const puzzle: Puzzle = order[index] ?? initialPuzzle;
  const expression = useMemo(() => tokens.map((token) => token.value).join(" "), [tokens]);
  const openParens = useMemo(
    () => tokens.reduce((count, token) => count + (token.value === "(" ? 1 : token.value === ")" ? -1 : 0), 0),
    [tokens]
  );

  useEffect(() => {
    setTokens([]);
    setUsedDigits(puzzle.digits.map(() => false));
    setResult(null);
    setShowSolution(false);
    setHistory([]);
  }, [puzzle]);

  const addDigit = (digit: number, digitIndex: number) => {
    if (usedDigits[digitIndex]) {
      return;
    }

    const last = tokens[tokens.length - 1];
    if (last && (last.type === "digit" || (last.type === "paren" && last.value === ")"))) {
      return;
    }

    setTokens([...tokens, { type: "digit", value: String(digit), digitIndex }]);
    setUsedDigits((state) => state.map((used, index) => (index === digitIndex ? true : used)));
  };

  const addOperator = (operator: string) => {
    const last = tokens[tokens.length - 1];
    if (!last || last.type === "operator" || (last.type === "paren" && last.value === "(")) {
      return;
    }
    setTokens([...tokens, { type: "operator", value: operator }]);
  };

  const addParen = (paren: "(" | ")") => {
    const last = tokens[tokens.length - 1];
    if (paren === "(") {
      if (last && last.type === "digit") {
        return;
      }
      setTokens([...tokens, { type: "paren", value: "(" }]);
      return;
    }

    if (openParens <= 0 || !last || last.type !== "digit") {
      return;
    }

    setTokens([...tokens, { type: "paren", value: ")" }]);
  };

  const handleUndo = () => {
    const nextTokens = tokens.slice(0, -1);
    const removed = tokens[tokens.length - 1];
    setTokens(nextTokens);
    if (removed && removed.type === "digit") {
      setUsedDigits((state) => state.map((used, index) => (index === removed.digitIndex ? false : used)));
    }
    setResult(null);
  };

  const handleClear = () => {
    setTokens([]);
    setUsedDigits(puzzle.digits.map(() => false));
    setResult(null);
  };

  const evaluateExpression = () => {
    if (usedDigits.some((used) => !used)) {
      setResult({ type: "error", message: "Use every digit exactly once." });
      return;
    }

    if (openParens !== 0) {
      setResult({ type: "error", message: "Close all parentheses before checking." });
      return;
    }

    if (!expression.trim()) {
      setResult({ type: "error", message: "Build an expression first." });
      return;
    }

    const sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/");
    if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
      setResult({ type: "error", message: "Expression contains unsupported characters." });
      return;
    }

    let value: number;
    try {
      // eslint-disable-next-line no-new-func
      value = Function(`"use strict"; return (${sanitized});`)();
    } catch (error) {
      setResult({ type: "error", message: "Unable to evaluate that expression." });
      return;
    }

    setAttempts((count) => count + 1);

    if (Math.abs(value - 24) < 1e-6) {
      setResult({ type: "success", message: "Exactly 24!" });
      setSolved((count) => count + 1);
      setHistory((entries) => [{ expression, success: true }, ...entries.slice(0, 4)]);
      setStreak((value) => {
        const next = value + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
      setResult({ type: "error", message: `Close! That made ${formatted}.` });
      setHistory((entries) => [{ expression, success: false }, ...entries.slice(0, 4)]);
      setStreak(0);
    }
  };

  const handleRevealSolution = () => {
    setShowSolution(true);
    setResult({ type: "info", message: "Study the sample solution, then reset and try again." });
  };

  const goToNextPuzzle = () => {
    const nextIndex = index + 1;
    if (nextIndex >= order.length) {
      setOrder(shuffle(PUZZLES));
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
          <span>{index + 1} of {order.length}</span>
          <span>Solved: {solved}</span>
          <span>Attempts: {attempts}</span>
          <span>Best streak: {bestStreak}</span>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-muted dark:text-brand-subtle">
              Digits in play
            </p>
            <div className="flex flex-wrap gap-2">
              {puzzle.digits.map((digit, digitIndex) => (
                <button
                  key={`${digit}-${digitIndex}`}
                  type="button"
                  onClick={() => addDigit(digit, digitIndex)}
                  disabled={usedDigits[digitIndex]}
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
                  <Button key={operator.value} type="button" variant="ghost" onClick={() => addOperator(operator.value)}>
                    {operator.value}
                  </Button>
                ))}
                <Button type="button" variant="ghost" onClick={() => addParen("(")}>
                  (
                </Button>
                <Button type="button" variant="ghost" onClick={() => addParen(")")}>
                  )
                </Button>
              </div>
            </div>

            <p className="text-sm text-brand-muted dark:text-brand-subtle">{puzzle.hint}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-brand-md border border-border-light/70 bg-surface px-4 py-4 text-lg font-semibold text-brand-strong shadow-inner dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground">
              {expression || "Build your equation"}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={evaluateExpression}>
                Check 24
              </Button>
              <Button type="button" variant="secondary" onClick={handleUndo}>
                Undo
              </Button>
              <Button type="button" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <Button type="button" variant="ghost" onClick={handleRevealSolution}>
                Show solution
              </Button>
            </div>

            {result ? <ResultBanner result={result} /> : null}

            {showSolution ? (
              <div className="rounded-brand-md border border-border-light/70 bg-white/80 px-4 py-3 text-sm text-brand-strong shadow-sm dark:border-border-dark dark:bg-surface-muted/80 dark:text-brand-foreground">
                Example: {puzzle.solutions[0]}
              </div>
            ) : null}

            {history.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-subtle">
                  Recent attempts
                </p>
                <ul className="space-y-2 text-sm text-brand-muted dark:text-brand-subtle">
                  {history.map((entry, attemptIndex) => (
                    <li key={`${entry.expression}-${attemptIndex}`} className="flex items-center justify-between gap-3">
                      <span className="truncate">{entry.expression}</span>
                      <span className={entry.success ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}>
                        {entry.success ? "✓" : "×"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button type="button" variant="secondary" onClick={goToNextPuzzle}>
              Next puzzle
            </Button>
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
