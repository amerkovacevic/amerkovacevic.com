import type { Player, Requirement, SquadConfig } from "./types";

export type SolveStats = {
  visited: number;
  prunedByRating: number;
  prunedByRequirement: number;
};

export type SolveSuccess = {
  kind: "success";
  squad: Player[];
  totalRating: number;
  averageRating: number;
  chemistry: number;
  chemistryDetails: PlayerChemistry[];
  ratingSurplus: number;
  stats: SolveStats;
};

export type SolveFailure = {
  kind: "no-solution" | "aborted";
  reason: string;
  stats: SolveStats;
};

export type SolveResult = SolveSuccess | SolveFailure;

type NormalizedRequirement = Requirement & { valueKey: string };

type SolverPlayer = Player & {
  nationKey: string;
  leagueKey: string;
  clubKey: string;
  qualityKey: string;
  positionKeys: string[];
};

type PlayerChemistry = {
  playerId: string;
  total: number;
  club: number;
  league: number;
  nation: number;
};

type InternalSolution = {
  indices: number[];
  ratingSum: number;
  chemistry: number;
  chemistryDetails: PlayerChemistry[];
};

const CLUB_THRESHOLDS = [2, 3, 4];
const LEAGUE_THRESHOLDS = [3, 5, 8];
const NATION_THRESHOLDS = [2, 5, 8];

const MAX_DEFAULT_LIMIT = 200_000;

export function solveSbc(
  players: Player[],
  requirements: Requirement[],
  config: SquadConfig
): SolveResult {
  const stats: SolveStats = { visited: 0, prunedByRating: 0, prunedByRequirement: 0 };

  const squadSize = clamp(Math.floor(config.squadSize || 0), 1, 11);
  const minTeamRating = Math.max(0, config.minTeamRating || 0);
  const minChemistry = Math.max(0, config.minChemistry || 0);
  const searchLimit = config.searchLimit ?? MAX_DEFAULT_LIMIT;

  if (!players.length) {
    return { kind: "no-solution", reason: "Add some players to your pool first.", stats };
  }

  if (players.length < squadSize) {
    return {
      kind: "no-solution",
      reason: `You only have ${players.length} players in the pool. Add more before solving.`,
      stats,
    };
  }

  const normalizedRequirements: NormalizedRequirement[] = requirements
    .filter((req) => req.value.trim() && req.minCount > 0)
    .map((req) => ({ ...req, valueKey: normalizeKey(req.value) }));

  const solverPlayers: SolverPlayer[] = players
    .map((p) => normalizePlayer(p))
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  const totalPlayers = solverPlayers.length;
  const requiredTotalRating = minTeamRating * squadSize;

  const prefixRatings = new Array(totalPlayers + 1).fill(0);
  for (let i = 0; i < totalPlayers; i++) {
    prefixRatings[i + 1] = prefixRatings[i] + solverPlayers[i]!.rating;
  }

  const remainingMatches = normalizedRequirements.map(() => new Array(totalPlayers + 1).fill(0));
  const requirementMatches: number[][] = solverPlayers.map(() => []);

  for (let r = 0; r < normalizedRequirements.length; r++) {
    for (let i = totalPlayers - 1; i >= 0; i--) {
      const matches = matchesRequirement(solverPlayers[i]!, normalizedRequirements[r]!);
      remainingMatches[r]![i] = remainingMatches[r]![i + 1] + (matches ? 1 : 0);
      if (matches) {
        requirementMatches[i]!.push(r);
      }
    }
  }

  const counts = new Array(normalizedRequirements.length).fill(0);
  const selectedIndices: number[] = [];

  let bestSolution: InternalSolution | null = null;

  let aborted = false;

  const dfs = (index: number, chosen: number, ratingSum: number) => {
    if (aborted) return;
    stats.visited++;
    if (stats.visited > searchLimit) {
      aborted = true;
      return;
    }

    const remainingSlots = squadSize - chosen;
    if (remainingSlots === 0) {
      if (ratingSum < requiredTotalRating) {
        return;
      }
      const squad = selectedIndices.map((idx) => solverPlayers[idx]!);
      const { total: chemistry, breakdown } = computeChemistry(squad);
      if (chemistry < minChemistry) {
        return;
      }
      if (!bestSolution || ratingSum < bestSolution.ratingSum) {
        bestSolution = {
          indices: [...selectedIndices],
          ratingSum,
          chemistry,
          chemistryDetails: breakdown,
        };
      } else if (
        bestSolution &&
        ratingSum === bestSolution.ratingSum &&
        chemistry > bestSolution.chemistry
      ) {
        bestSolution = {
          indices: [...selectedIndices],
          ratingSum,
          chemistry,
          chemistryDetails: breakdown,
        };
      }
      return;
    }

    if (index >= totalPlayers) return;

    const playersLeft = totalPlayers - index;
    if (playersLeft < remainingSlots) {
      stats.prunedByRequirement++;
      return;
    }

    if (normalizedRequirements.length) {
      for (let r = 0; r < normalizedRequirements.length; r++) {
        const needed = normalizedRequirements[r]!.minCount - counts[r]!;
        if (needed > 0 && remainingMatches[r]![index] < needed) {
          stats.prunedByRequirement++;
          return;
        }
      }
    }

    const maxPossible = ratingSum + maxRatingFrom(index, remainingSlots, prefixRatings, totalPlayers);
    if (maxPossible < requiredTotalRating) {
      stats.prunedByRating++;
      return;
    }

    const player = solverPlayers[index]!;

    // Include branch
    selectedIndices.push(index);
    for (const reqIndex of requirementMatches[index] ?? []) {
      counts[reqIndex]!++;
    }
    const newRating = ratingSum + player.rating;
    const includeRemainingSlots = squadSize - (chosen + 1);
    const includeMaxPossible =
      newRating + maxRatingFrom(index + 1, includeRemainingSlots, prefixRatings, totalPlayers);

    let includeBlocked = false;
    if (newRating >= (bestSolution?.ratingSum ?? Infinity)) {
      includeBlocked = true;
    } else if (includeMaxPossible < requiredTotalRating) {
      stats.prunedByRating++;
      includeBlocked = true;
    } else if (normalizedRequirements.length) {
      for (let r = 0; r < normalizedRequirements.length; r++) {
        const needed = normalizedRequirements[r]!.minCount - counts[r]!;
        if (needed > 0 && remainingMatches[r]![index + 1] < needed) {
          stats.prunedByRequirement++;
          includeBlocked = true;
          break;
        }
      }
    }

    if (!includeBlocked) {
      dfs(index + 1, chosen + 1, newRating);
    }

    for (const reqIndex of requirementMatches[index] ?? []) {
      counts[reqIndex]!--;
    }
    selectedIndices.pop();

    // Exclude branch
    const skipMaxPossible = ratingSum + maxRatingFrom(index + 1, remainingSlots, prefixRatings, totalPlayers);
    let skipBlocked = false;
    if (skipMaxPossible < requiredTotalRating) {
      stats.prunedByRating++;
      skipBlocked = true;
    } else if (normalizedRequirements.length) {
      for (let r = 0; r < normalizedRequirements.length; r++) {
        const needed = normalizedRequirements[r]!.minCount - counts[r]!;
        if (needed > 0 && remainingMatches[r]![index + 1] < needed) {
          stats.prunedByRequirement++;
          skipBlocked = true;
          break;
        }
      }
    }

    if (!skipBlocked) {
      dfs(index + 1, chosen, ratingSum);
    }
  };

  dfs(0, 0, 0);

  if (aborted) {
    return {
      kind: "aborted",
      reason: "Search limit reached before completing. Refine your pool or requirements.",
      stats,
    };
  }

  if (!bestSolution) {
    return {
      kind: "no-solution",
      reason: "No squad satisfies all requirements. Adjust inputs and try again.",
      stats,
    };
  }

  const finalSolution = bestSolution as InternalSolution;

  const squad = finalSolution.indices.map((idx: number) => solverPlayers[idx]!);
  const totalRating = finalSolution.ratingSum;
  const averageRating = squad.length ? totalRating / squad.length : 0;

  const detailedPlayers = squad.map((p: SolverPlayer) => toPlayer(p));

  const chemistry = finalSolution.chemistry;
  const chemistryDetails = finalSolution.chemistryDetails;

  return {
    kind: "success",
    squad: detailedPlayers,
    totalRating,
    averageRating,
    chemistry,
    chemistryDetails,
    ratingSurplus: totalRating - requiredTotalRating,
    stats,
  };
}

function maxRatingFrom(
  start: number,
  take: number,
  prefix: number[],
  totalPlayers: number
): number {
  if (take <= 0) return 0;
  if (start >= totalPlayers) return -Infinity;
  const end = Math.min(totalPlayers, start + take);
  if (end - start < take) return -Infinity;
  return prefix[end]! - prefix[start]!;
}

function computeChemistry(players: SolverPlayer[]): {
  total: number;
  breakdown: PlayerChemistry[];
} {
  const clubCounts = new Map<string, number>();
  const leagueCounts = new Map<string, number>();
  const nationCounts = new Map<string, number>();

  for (const player of players) {
    clubCounts.set(player.clubKey, (clubCounts.get(player.clubKey) ?? 0) + 1);
    leagueCounts.set(player.leagueKey, (leagueCounts.get(player.leagueKey) ?? 0) + 1);
    nationCounts.set(player.nationKey, (nationCounts.get(player.nationKey) ?? 0) + 1);
  }

  let total = 0;
  const breakdown: PlayerChemistry[] = [];
  for (const player of players) {
    const club = chemContribution(clubCounts.get(player.clubKey) ?? 0, CLUB_THRESHOLDS);
    const league = chemContribution(leagueCounts.get(player.leagueKey) ?? 0, LEAGUE_THRESHOLDS);
    const nation = chemContribution(nationCounts.get(player.nationKey) ?? 0, NATION_THRESHOLDS);
    const chem = Math.min(3, club + league + nation);
    total += chem;
    breakdown.push({
      playerId: player.id,
      total: chem,
      club,
      league,
      nation,
    });
  }

  return { total, breakdown };
}

function chemContribution(count: number, thresholds: number[]): number {
  let chem = 0;
  for (const threshold of thresholds) {
    if (count >= threshold) chem++;
  }
  return chem;
}

function matchesRequirement(player: SolverPlayer, req: NormalizedRequirement | Requirement): boolean {
  const valueKey = "valueKey" in req ? req.valueKey : normalizeKey(req.value);
  switch (req.attribute) {
    case "nation":
      return player.nationKey === valueKey;
    case "league":
      return player.leagueKey === valueKey;
    case "club":
      return player.clubKey === valueKey;
    case "quality":
      return player.qualityKey === valueKey;
    case "position":
      return player.positionKeys.includes(valueKey);
    default:
      return false;
  }
}

function normalizePlayer(player: Player): SolverPlayer {
  const nationKey = normalizeKey(player.nation);
  const leagueKey = normalizeKey(player.league);
  const clubKey = normalizeKey(player.club);
  const qualityKey = normalizeKey(player.quality ?? inferQuality(player.rating));
  const positionKeys = (player.positions ?? [])
    .map((pos) => normalizeKey(pos, true))
    .filter(Boolean);

  return {
    ...player,
    nationKey,
    leagueKey,
    clubKey,
    qualityKey,
    positionKeys,
  };
}

function inferQuality(rating: number): string {
  if (rating >= 75) return "Gold";
  if (rating >= 65) return "Silver";
  return "Bronze";
}

function normalizeKey(value: string, preserveCase = false): string {
  const trimmed = value.trim();
  return preserveCase ? trimmed.toUpperCase() : trimmed.toLowerCase();
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toPlayer(player: SolverPlayer): Player {
  const { nationKey: _nk, leagueKey: _lg, clubKey: _ck, qualityKey: _qk, positionKeys: _pk, ...rest } = player;
  return rest;
}

export type { PlayerChemistry };
