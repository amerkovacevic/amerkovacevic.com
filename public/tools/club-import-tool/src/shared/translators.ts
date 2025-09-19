export type UnknownRecord = Record<string, unknown>;

export interface EAItem extends UnknownRecord {
  id?: string | number;
  definitionId?: string | number;
  itemId?: string | number;
  resourceId?: string | number;
  rating?: number | string;
  overallRating?: number | string;
  ovr?: number | string;
  totalRating?: number | string;
  statsRating?: number | string;
  itemType?: string;
  commonName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  playerName?: string;
  preferredPosition?: string;
  bestPosition?: string;
  position?: string;
  playStyle?: string;
  chemistryStyle?: string;
  owners?: number;
  lastSalePrice?: number | string;
  timestamp?: number | string;
  dateAcquired?: number | string;
  acquiredDate?: number | string;
  untradeable?: boolean;
  untradeableStatus?: boolean;
  tradeState?: string;
  discardValue?: number;
  nationName?: string;
  leagueName?: string;
  teamName?: string;
  loans?: unknown;
  loansInfo?: unknown;
  cosmetics?: unknown;
  academyAttributes?: unknown;
}

export interface RawEvolutionAttributes {
  loans?: unknown;
  loansInfo?: unknown;
  cosmetics?: unknown;
  academyAttributes?: unknown;
}

export interface Player {
  id: string;
  rating: number;
  resourceId: number;
  untradeable: boolean;
  preferredPosition?: string;
  chemStyle: string;
  firstOwner: boolean;
  boughtFor: number | null;
  obtainedTimestamp: number | null;
  rawEvolutionAttributes: RawEvolutionAttributes | null;
  name?: string;
  nationName?: string;
  leagueName?: string;
  clubName?: string;
  discardValue?: number | null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function resolveId(item: EAItem): string | null {
  const candidates: Array<string | number | undefined> = [
    item.id,
    item.itemId,
    item.definitionId,
    item.resourceId,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const normalized = coerceString(candidate);
    if (normalized && normalized.trim()) {
      return normalized.trim();
    }
  }
  return null;
}

function resolveRating(item: EAItem): number | null {
  const candidates: Array<number | string | undefined> = [
    item.rating,
    item.overallRating,
    item.ovr,
    item.totalRating,
    item.statsRating,
  ];
  for (const candidate of candidates) {
    const rating = coerceNumber(candidate);
    if (rating !== null) {
      return rating;
    }
  }
  return null;
}

function resolveResourceId(item: EAItem, fallbackId: string | null): number | null {
  const candidates: Array<number | string | undefined> = [
    item.resourceId,
    item.definitionId,
    item.itemId,
    item.id,
  ];
  for (const candidate of candidates) {
    const parsed = coerceNumber(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }
  if (fallbackId) {
    const parsed = coerceNumber(fallbackId);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function resolvePreferredPosition(item: EAItem): string | undefined {
  const candidates = [
    item.preferredPosition,
    item.bestPosition,
    item.position,
  ];
  for (const candidate of candidates) {
    const value = coerceString(candidate);
    if (value && value.trim()) {
      return value.trim().toUpperCase();
    }
  }
  return undefined;
}

function resolveChemStyle(item: EAItem, preferredPosition?: string): string {
  const candidates = [item.playStyle, item.chemistryStyle];
  for (const candidate of candidates) {
    const value = coerceString(candidate);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  if (preferredPosition === "GK") {
    return "GK";
  }
  return "";
}

function resolveTimestamp(item: EAItem): number | null {
  const candidates = [item.timestamp, item.dateAcquired, item.acquiredDate];
  for (const candidate of candidates) {
    const value = coerceNumber(candidate);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function resolveBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
    if (normalized.includes("untrade")) {
      return true;
    }
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return false;
}

export function translateClubPlayer(item: EAItem): Player | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = resolveId(item);
  const rating = resolveRating(item);
  if (!id || rating === null) {
    return null;
  }

  const resourceId = resolveResourceId(item, id);
  if (resourceId === null) {
    return null;
  }

  const preferredPosition = resolvePreferredPosition(item);
  const chemStyle = resolveChemStyle(item, preferredPosition);
  const untradeable = Boolean(
    item.untradeable ??
      item.untradeableStatus ??
      resolveBooleanFlag(item.tradeState)
  );
  const firstOwner = item.owners === 1;
  const boughtFor = coerceNumber(item.lastSalePrice);
  const obtainedTimestamp = resolveTimestamp(item);
  const rawEvolutionAttributes: RawEvolutionAttributes | null = {
    loans: item.loans,
    loansInfo: item.loansInfo,
    cosmetics: item.cosmetics,
    academyAttributes: item.academyAttributes,
  };

  const hasEvolutionData = Object.values(rawEvolutionAttributes).some(
    (value) => value !== undefined && value !== null
  );

  return {
    id,
    rating,
    resourceId,
    untradeable,
    preferredPosition,
    chemStyle,
    firstOwner,
    boughtFor: boughtFor ?? null,
    obtainedTimestamp,
    rawEvolutionAttributes: hasEvolutionData ? rawEvolutionAttributes : null,
    name:
      coerceString(item.commonName) ||
      coerceString(item.firstName) ||
      coerceString(item.name) ||
      coerceString(item.playerName),
    nationName: coerceString(item.nationName),
    leagueName: coerceString(item.leagueName),
    clubName: coerceString(item.teamName),
    discardValue: coerceNumber(item.discardValue),
  };
}
