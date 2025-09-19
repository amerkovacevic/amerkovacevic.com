function coerceNumber(value) {
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
function coerceString(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    return undefined;
}
function resolveId(item) {
    const candidates = [
        item.id,
        item.itemId,
        item.definitionId,
        item.resourceId,
    ];
    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null)
            continue;
        const normalized = coerceString(candidate);
        if (normalized && normalized.trim()) {
            return normalized.trim();
        }
    }
    return null;
}
function resolveRating(item) {
    const candidates = [
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
function resolveResourceId(item, fallbackId) {
    const candidates = [
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
function resolvePreferredPosition(item) {
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
function resolveChemStyle(item, preferredPosition) {
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
function resolveTimestamp(item) {
    const candidates = [item.timestamp, item.dateAcquired, item.acquiredDate];
    for (const candidate of candidates) {
        const value = coerceNumber(candidate);
        if (value !== null) {
            return value;
        }
    }
    return null;
}
function resolveBooleanFlag(value) {
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
export function translateClubPlayer(item) {
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
    const untradeable = Boolean(item.untradeable ??
        item.untradeableStatus ??
        resolveBooleanFlag(item.tradeState));
    const firstOwner = item.owners === 1;
    const boughtFor = coerceNumber(item.lastSalePrice);
    const obtainedTimestamp = resolveTimestamp(item);
    const rawEvolutionAttributes = {
        loans: item.loans,
        loansInfo: item.loansInfo,
        cosmetics: item.cosmetics,
        academyAttributes: item.academyAttributes,
    };
    const hasEvolutionData = Object.values(rawEvolutionAttributes).some((value) => value !== undefined && value !== null);
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
        name: coerceString(item.commonName) ||
            coerceString(item.firstName) ||
            coerceString(item.name) ||
            coerceString(item.playerName),
        nationName: coerceString(item.nationName),
        leagueName: coerceString(item.leagueName),
        clubName: coerceString(item.teamName),
        discardValue: coerceNumber(item.discardValue),
    };
}
