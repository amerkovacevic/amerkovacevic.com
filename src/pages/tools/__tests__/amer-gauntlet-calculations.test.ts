import { describe, expect, test } from "vitest";

import { calculateAmerGauntletTotals, computeGameScore } from "../amer-gauntlet-page";

describe("computeGameScore", () => {
  test("awards base points for wins and caps streak bonus", () => {
    expect(computeGameScore("win", 1)).toBe(120);
    expect(computeGameScore("win", 6)).toBe(160);
  });

  test("awards consolation points for losses", () => {
    expect(computeGameScore("loss", 0)).toBe(100);
  });
});

describe("calculateAmerGauntletTotals", () => {
  test("computes perfect run totals with tempo bonus", () => {
    const lineup = ["g1", "g2", "g3", "g4", "g5"];
    const results = {
      g1: "win",
      g2: "win",
      g3: "win",
      g4: "win",
      g5: "win",
    } as const;

    const totals = calculateAmerGauntletTotals(lineup, results, {
      baseElapsedSeconds: 450,
      penaltySeconds: 0,
    });

    expect(totals.finishedAll).toBe(true);
    expect(totals.perfectRun).toBe(true);
    expect(totals.completedCount).toBe(5);
    expect(totals.longestWinStreak).toBe(5);
    expect(totals.scoreByGame.g5).toBe(160);
    expect(totals.totalScore).toBe(858);
  });

  test("applies completion multiplier, tempo bonus, and penalties", () => {
    const lineup = ["g1", "g2", "g3"];
    const results = {
      g1: "win",
      g2: "loss",
      g3: "win",
    } as const;

    const totals = calculateAmerGauntletTotals(lineup, results, {
      baseElapsedSeconds: 390,
      penaltySeconds: 60,
    });

    expect(totals.finishedAll).toBe(true);
    expect(totals.perfectRun).toBe(false);
    expect(totals.completedCount).toBe(3);
    expect(totals.longestWinStreak).toBe(1);
    expect(totals.totalScore).toBe(264);
  });

  test("reports partial progress without completion bonuses", () => {
    const lineup = ["g1", "g2", "g3"];
    const results = { g1: "win" } as const;

    const totals = calculateAmerGauntletTotals(lineup, results, {
      baseElapsedSeconds: 120,
      penaltySeconds: 0,
    });

    expect(totals.finishedAll).toBe(false);
    expect(totals.perfectRun).toBe(false);
    expect(totals.completedCount).toBe(1);
    expect(totals.totalScore).toBe(120);
  });
});
