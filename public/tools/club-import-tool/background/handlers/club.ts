import { translateClubPlayer, type EAItem, type Player } from "../../shared/translators";

export interface ClubPlayerRecord extends Player {
  location: "club";
  activeSquad: boolean;
}

const playerStore = new Map<string, ClubPlayerRecord>();
const isInActiveSquadByResourceId = new Map<number, boolean>();

function resolveKey(player: Player): string {
  if (player.id) {
    return player.id;
  }
  return `resource:${player.resourceId}`;
}

export function setActiveSquadMembership(map: Record<string, boolean> | Map<number, boolean>): void {
  isInActiveSquadByResourceId.clear();
  if (map instanceof Map) {
    for (const [key, value] of map.entries()) {
      const resourceId = typeof key === "string" ? Number(key) : key;
      if (Number.isFinite(resourceId)) {
        isInActiveSquadByResourceId.set(Number(resourceId), Boolean(value));
      }
    }
    return;
  }

  for (const [key, value] of Object.entries(map)) {
    const resourceId = Number(key);
    if (Number.isFinite(resourceId)) {
      isInActiveSquadByResourceId.set(resourceId, Boolean(value));
    }
  }
}

function normalizePlayer(item: EAItem): ClubPlayerRecord | null {
  const normalized = translateClubPlayer(item);
  if (!normalized) {
    return null;
  }

  const resourceId = normalized.resourceId;
  const activeSquad = Boolean(isInActiveSquadByResourceId.get(resourceId));

  return {
    ...normalized,
    location: "club",
    activeSquad,
  };
}

function isPlayerItem(item: unknown): item is EAItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as EAItem;
  const typeLabel = typeof candidate.itemType === "string" ? candidate.itemType.toLowerCase() : "";

  if (!typeLabel || typeLabel === "player") {
    return true;
  }

  return false;
}

export function handleClubImportMessage(rawPlayers: unknown[]): ClubPlayerRecord[] {
  if (!Array.isArray(rawPlayers)) {
    return [];
  }

  const collected: ClubPlayerRecord[] = [];

  for (const raw of rawPlayers) {
    if (!isPlayerItem(raw)) {
      continue;
    }

    try {
      const normalized = normalizePlayer(raw);
      if (!normalized) {
        continue;
      }
      const key = resolveKey(normalized);
      playerStore.set(key, normalized);
      collected.push(normalized);
    } catch (error) {
      console.debug("FC26 club normalization failed", error);
    }
  }

  return collected;
}

export function getPlayerStoreSnapshot(): ClubPlayerRecord[] {
  return Array.from(playerStore.values());
}

export function clearPlayerStore(): void {
  playerStore.clear();
}
