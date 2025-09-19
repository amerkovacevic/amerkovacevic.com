export type LocaleMaps = {
  players: Record<number, string>;
  clubs: Record<number, string>;
  nations: Record<number, string>;
  leagues: Record<number, string>;
};

const KEYWORD_BUCKETS: Record<keyof LocaleMaps, string[]> = {
  players: ["player", "players", "athlete", "athletes", "item", "items"],
  clubs: ["club", "clubs", "team", "teams", "squad"],
  nations: ["nation", "nations", "country", "countries", "nationality"],
  leagues: ["league", "leagues", "competition", "competitions", "division", "divisions", "tournament"],
};

type ExtractionResult = {
  map: Record<number, string>;
  sampleValue?: unknown;
};

type Bucket = keyof LocaleMaps;

export function indexLocale(input: unknown): LocaleMaps {
  const maps: LocaleMaps = {
    players: {},
    clubs: {},
    nations: {},
    leagues: {},
  };

  if (!input || typeof input !== "object") {
    return maps;
  }

  const visited = new Set<unknown>();

  const traverse = (value: unknown, path: string[]) => {
    if (!value || typeof value !== "object" || visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((entry, index) => traverse(entry, [...path, String(index)]));
      return;
    }

    const record = value as Record<string, unknown>;

    for (const [key, child] of Object.entries(record)) {
      const currentPath = [...path, key];
      if (assignIfLocaleBucket(child, currentPath, maps)) {
        continue;
      }
      traverse(child, currentPath);
    }
  };

  const root = input as Record<string, unknown>;
  for (const [key, child] of Object.entries(root)) {
    if (assignIfLocaleBucket(child, [key], maps)) {
      continue;
    }
    traverse(child, [key]);
  }

  return maps;
}

export const getPlayerName = (maps: LocaleMaps, id?: number) => lookupName(maps.players, id);
export const getClubName = (maps: LocaleMaps, id?: number) => lookupName(maps.clubs, id);
export const getNationName = (maps: LocaleMaps, id?: number) => lookupName(maps.nations, id);
export const getLeagueName = (maps: LocaleMaps, id?: number) => lookupName(maps.leagues, id);

function assignIfLocaleBucket(value: unknown, path: string[], maps: LocaleMaps): boolean {
  const extraction = extractNameMap(value);
  if (!extraction) {
    return false;
  }

  const bucket = determineBucket(path, extraction.sampleValue) ?? inferFromSample(extraction.sampleValue);
  if (!bucket) {
    return false;
  }

  Object.assign(maps[bucket], extraction.map);
  return true;
}

function extractNameMap(value: unknown): ExtractionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const map: Record<number, string> = {};
  let sampleValue: unknown;
  let count = 0;

  for (const [key, entry] of Object.entries(record)) {
    const numericKey = toNumericKey(key);
    if (numericKey === null) {
      continue;
    }
    const name = extractName(entry);
    if (!name) {
      continue;
    }
    if (sampleValue === undefined) {
      sampleValue = entry;
    }
    map[numericKey] = name;
    count += 1;
  }

  if (!count) {
    return null;
  }

  return { map, sampleValue };
}

function determineBucket(path: string[], sampleValue: unknown): Bucket | undefined {
  const normalizedParts = path.map((part) => part.toLowerCase());

  for (const bucket of Object.keys(KEYWORD_BUCKETS) as Bucket[]) {
    const keywords = KEYWORD_BUCKETS[bucket];
    if (normalizedParts.some((part) => keywords.some((keyword) => part.includes(keyword)))) {
      return bucket;
    }
  }

  return inferFromSample(sampleValue);
}

function inferFromSample(sampleValue: unknown): Bucket | undefined {
  if (sampleValue && typeof sampleValue === "object") {
    const record = sampleValue as Record<string, unknown>;
    const keys = Object.keys(record).map((key) => key.toLowerCase());
    if (keys.some((key) => key.includes("firstname") || key.includes("lastname") || key.includes("commonname"))) {
      return "players";
    }
    if (keys.some((key) => key.includes("team") || key.includes("club"))) {
      return "clubs";
    }
    if (keys.some((key) => key.includes("nation") || key.includes("country"))) {
      return "nations";
    }
    if (keys.some((key) => key.includes("league") || key.includes("division") || key.includes("competition"))) {
      return "leagues";
    }
  }
  if (typeof sampleValue === "string") {
    const value = sampleValue.toLowerCase();
    if (value.includes("league")) {
      return "leagues";
    }
    if (value.includes("nation") || value.includes("country")) {
      return "nations";
    }
  }
  return undefined;
}

function extractName(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = record.name ?? record.commonName ?? record.fullName ?? record.displayName;
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }
    const first = record.firstName ?? record.firstname;
    const last = record.lastName ?? record.lastname;
    if (typeof first === "string" && typeof last === "string") {
      const combined = `${first} ${last}`.trim();
      return combined || null;
    }
    if (typeof record.shortName === "string" && record.shortName.trim()) {
      return record.shortName.trim();
    }
    if (typeof record.abbreviation === "string" && record.abbreviation.trim()) {
      return record.abbreviation.trim();
    }
  }
  return null;
}

function lookupName(map: Record<number, string>, id?: number): string | undefined {
  if (id === undefined || id === null) {
    return undefined;
  }
  const numericId = typeof id === "string" ? Number(id) : id;
  if (!Number.isFinite(numericId)) {
    return undefined;
  }
  return map[numericId];
}

function toNumericKey(key: string): number | null {
  const numeric = Number(key);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}
