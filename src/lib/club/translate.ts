import { getClubName, getLeagueName, getNationName, getPlayerName, type LocaleMaps } from "../locale/indexLocale";

export type ReadablePlayer = {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPositions?: string[];
  nation?: string;
  league?: string;
  club?: string;
  _ids?: { resourceId?: number; teamid?: number; nation?: number; leagueId?: number };
};

export function translateClubJsonToReadable(input: unknown, maps?: LocaleMaps): ReadablePlayer[] {
  const entries = collectEntries(input);
  if (!entries.length) {
    return [];
  }

  const readable: ReadablePlayer[] = [];

  entries.forEach((entry) => {
    const item = extractItem(entry);
    if (!item) {
      return;
    }

    const itemType = getString(item.itemType ?? (entry as Record<string, unknown> | undefined)?.itemType);
    if (itemType && itemType.toLowerCase() !== "player") {
      return;
    }

    const rating = Number(item.rating ?? item.ratingValue ?? item.baseRating ?? item.overall ?? item.ovr);
    if (!Number.isFinite(rating)) {
      return;
    }

    const preferredPosition = getString(item.preferredPosition ?? item.position ?? item.bestPosition ?? "");
    const position = preferredPosition.toUpperCase();
    if (!position) {
      return;
    }

    const resourceId = toNumeric(item.resourceId ?? item.assetId ?? item.definitionId ?? item.id);
    const teamId = toNumeric(item.teamid ?? item.teamId);
    const nationId = toNumeric(item.nation ?? item.nationId);
    const leagueId = toNumeric(item.leagueId ?? item.leagueid);

    const idCandidate = item.id ?? item.resourceId ?? item.assetId ?? "";
    const id = String(idCandidate ?? "");

    const name =
      (maps && getPlayerName(maps, resourceId)) ?? `#${resourceId ?? item.id ?? ""}`;

    const nationName =
      (maps && getNationName(maps, nationId)) ??
      getOptionalText(item.nationName ?? item.nationname ?? item.countryName ?? item.countryname) ??
      formatId(nationId);
    const leagueName =
      (maps && getLeagueName(maps, leagueId)) ??
      getOptionalText(item.leagueName ?? item.leaguename ?? item.competitionName ?? item.competitionname) ??
      formatId(leagueId);
    const clubName =
      (maps && getClubName(maps, teamId)) ??
      getOptionalText(item.teamName ?? item.teamname ?? item.clubName ?? item.clubname) ??
      formatId(teamId);

    const possiblePositions = Array.isArray(item.possiblePositions)
      ? item.possiblePositions
          .map((value) => String(value).toUpperCase())
          .filter((value) => Boolean(value))
      : undefined;

    const readablePlayer: ReadablePlayer = {
      id,
      name,
      rating,
      position,
      altPositions: possiblePositions && possiblePositions.length ? possiblePositions : undefined,
      nation: nationName ?? undefined,
      league: leagueName ?? undefined,
      club: clubName ?? undefined,
      _ids: {
        resourceId: resourceId ?? undefined,
        teamid: teamId ?? undefined,
        nation: nationId ?? undefined,
        leagueId: leagueId ?? undefined,
      },
    };

    readable.push(readablePlayer);
  });

  return readable;
}

type RawItem = Record<string, unknown> & {
  itemType?: unknown;
  rating?: unknown;
  preferredPosition?: unknown;
  position?: unknown;
  bestPosition?: unknown;
  possiblePositions?: unknown;
  resourceId?: unknown;
  assetId?: unknown;
  definitionId?: unknown;
  id?: unknown;
  teamid?: unknown;
  teamId?: unknown;
  nation?: unknown;
  nationId?: unknown;
  leagueId?: unknown;
  leagueid?: unknown;
  nationName?: unknown;
  nationname?: unknown;
  countryName?: unknown;
  countryname?: unknown;
  leagueName?: unknown;
  leaguename?: unknown;
  competitionName?: unknown;
  competitionname?: unknown;
  teamName?: unknown;
  teamname?: unknown;
  clubName?: unknown;
  clubname?: unknown;
};

function collectEntries(input: unknown): unknown[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;

    if (Array.isArray(record.itemData)) {
      return record.itemData;
    }
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.players)) {
      return record.players;
    }

    const nested: unknown[] = [];
    for (const value of Object.values(record)) {
      if (Array.isArray(value) && value.some((entry) => entry && typeof entry === "object")) {
        nested.push(...value);
      }
    }
    if (nested.length) {
      return nested;
    }

    return [record];
  }

  return [];
}

function extractItem(entry: unknown): RawItem | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const maybeItem = record.itemData;
  if (maybeItem && typeof maybeItem === "object" && !Array.isArray(maybeItem)) {
    return maybeItem as RawItem;
  }

  return record as RawItem;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : value !== undefined && value !== null ? String(value) : "";
}

function toNumeric(value: unknown): number | undefined {
  const numeric = typeof value === "string" ? Number(value) : (value as number | undefined);
  if (numeric === undefined || numeric === null) {
    return undefined;
  }
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function getOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatId(id?: number): string | undefined {
  if (id === undefined) {
    return undefined;
  }
  return `#${id}`;
}
