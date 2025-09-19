import { translateClubPlayer } from "../../shared/translators";
const playerStore = new Map();
const isInActiveSquadByResourceId = new Map();
function resolveKey(player) {
    if (player.id) {
        return player.id;
    }
    return `resource:${player.resourceId}`;
}
export function setActiveSquadMembership(map) {
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
function normalizePlayer(item) {
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
function isPlayerItem(item) {
    if (!item || typeof item !== "object") {
        return false;
    }
    const candidate = item;
    const typeLabel = typeof candidate.itemType === "string" ? candidate.itemType.toLowerCase() : "";
    if (!typeLabel || typeLabel === "player") {
        return true;
    }
    return false;
}
export function handleClubImportMessage(rawPlayers) {
    if (!Array.isArray(rawPlayers)) {
        return [];
    }
    const collected = [];
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
        }
        catch (error) {
            console.debug("FC26 club normalization failed", error);
        }
    }
    return collected;
}
export function getPlayerStoreSnapshot() {
    return Array.from(playerStore.values());
}
export function clearPlayerStore() {
    playerStore.clear();
}
