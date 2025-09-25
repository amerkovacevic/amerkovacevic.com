import { useState } from "react";

import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { cn } from "../../shared/lib/classnames";

type Question = {
  word: string;
  choices: string[];
  answer: string;
  clue: string;
};

const QUESTIONS: Question[] = [
  {
    word: "rapid",
    choices: ["timid", "quick", "sturdy", "distant"],
    answer: "quick",
    clue: "Think of speed, not emotion.",
  },
  {
    word: "vital",
    choices: ["optional", "energetic", "essential", "fragile"],
    answer: "essential",
    clue: "Without it, things fall apart.",
  },
  {
    word: "tranquil",
    choices: ["peaceful", "noisy", "awkward", "brisk"],
    answer: "peaceful",
    clue: "Picture a glassy lake at dawn.",
  },
  {
    word: "elated",
    choices: ["thrilled", "anxious", "sleepy", "careful"],
    answer: "thrilled",
    clue: "An emotion after big news.",
  },
  {
    word: "diminish",
    choices: ["reduce", "arrive", "polish", "admire"],
    answer: "reduce",
    clue: "The opposite of expand.",
  },
  {
    word: "robust",
    choices: ["weak", "sturdy", "silent", "fragrant"],
    answer: "sturdy",
    clue: "Built to last.",
  },
  {
    word: "adjacent",
    choices: ["next", "beneath", "behind", "aside"],
    answer: "next",
    clue: "Right beside it.",
  },
  {
    word: "succinct",
    choices: ["lengthy", "concise", "quiet", "flexible"],
    answer: "concise",
    clue: "Short and to the point.",
  },
  {
    word: "audacious",
    choices: ["careful", "bold", "shy", "mellow"],
    answer: "bold",
    clue: "Fearless and daring.",
  },
  {
    word: "serene",
    choices: ["stormy", "calm", "loud", "reckless"],
    answer: "calm",
    clue: "Same vibe as tranquil.",
  },
  {
    word: "meticulous",
    choices: ["reckless", "careful", "swift", "cheerful"],
    answer: "careful",
    clue: "Attention to the tiniest detail.",
  },
  {
    word: "immerse",
    choices: ["dip", "hover", "inspect", "delay"],
    answer: "dip",
    clue: "Submerge yourself fully.",
  },
];

type Status = "idle" | "correct" | "incorrect";

export function SynonymMatchGame() {
  const [order, setOrder] = useState(() => shuffle(QUESTIONS));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const question = order[index] ?? order[0];

  if (!question) {
    return null;
  }

  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;
  const progressLabel = `${index + 1} of ${order.length}`;

  const handleChoice = (choice: string) => {
    if (selected) {
      return;
    }

    setSelected(choice);
    setAttempted((value) => value + 1);
    if (choice === question.answer) {
      setStatus("correct");
      setScore((value) => value + 1);
      setRevealed(false);
    } else {
      setStatus("incorrect");
      setRevealed(false);
    }
  };

  const handleNext = () => {
    const nextIndex = index + 1;
    if (nextIndex >= order.length) {
      setOrder(shuffle(QUESTIONS));
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }

    setSelected(null);
    setStatus("idle");
    setShowHint(false);
    setRevealed(false);
  };

  const handleReveal = () => {
    setSelected(question.answer);
    setStatus("correct");
    setRevealed(true);
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted dark:text-brand-subtle">
          <span>{progressLabel}</span>
          <span>Score: {score}</span>
          <span>Accuracy: {accuracy}%</span>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-brand-strong dark:text-brand-foreground">{question.word}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHint((value) => !value)}>
                {showHint ? "Hide hint" : "Hint"}
              </Button>
            </div>
            <p className="text-sm text-brand-muted dark:text-brand-subtle">
              Choose the synonym that best matches the focus word.
            </p>
            {showHint ? (
              <p className="text-sm font-medium text-brand-strong dark:text-brand-foreground">Hint: {question.clue}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            {question.choices.map((choice) => {
              const isCorrectChoice = choice === question.answer;
              const isSelected = selected === choice;

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleChoice(choice)}
                  disabled={Boolean(selected)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-brand-md border px-4 py-3 text-left text-base font-medium transition",
                    "border-border-light bg-white/90 text-brand-strong hover:border-brand hover:bg-white dark:border-border-dark dark:bg-surface-muted dark:text-brand-foreground",
                    selected
                      ? isCorrectChoice
                        ? "border-emerald-300/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-700/70 dark:bg-emerald-500/20 dark:text-emerald-200"
                        : isSelected
                        ? "border-rose-300/80 bg-rose-50/80 text-rose-700 dark:border-rose-900/70 dark:bg-rose-500/20 dark:text-rose-200"
                        : "opacity-70"
                      : ""
                  )}
                >
                  {choice}
                  {selected && isCorrectChoice ? <span className="text-sm">✔️</span> : null}
                  {selected && isSelected && !isCorrectChoice ? <span className="text-sm">❌</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Feedback status={status} question={question} selected={selected} revealed={revealed} />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleNext}>
            Next word
          </Button>
          <Button type="button" variant="ghost" onClick={handleReveal} disabled={selected === question.answer}>
            Reveal synonym
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Feedback({
  status,
  question,
  selected,
  revealed,
}: {
  status: Status;
  question: Question;
  selected: string | null;
  revealed: boolean;
}) {
  if (!selected) {
    return null;
  }

  if (status === "correct") {
    return (
      <p className="rounded-brand-md border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/20 dark:text-emerald-200">
        {revealed ? "Revealed" : "Correct"}! {question.word} ≈ {question.answer}.
      </p>
    );
  }

  if (status === "incorrect") {
    return (
      <p className="rounded-brand-md border border-rose-200/60 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/15 dark:text-rose-200">
        Not quite. The synonym was {question.answer}.
      </p>
    );
  }

  return null;
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
