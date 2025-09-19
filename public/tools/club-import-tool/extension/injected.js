(function () {
  "use strict";

  if (window.fc26ClubExporter?.__initialized) {
    return;
  }

  const overlayId = "fc26-sbc-export-overlay";
  const roster = new Map();
  let latestExport = "";
  const MESSAGE_SOURCE = "fc26-club-exporter";
  const EXTENSION_SOURCE = "fc26-club-exporter-extension";

  const originalFetch = window.fetch;
  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch.apply(this, arguments);
    try {
      const clone = response.clone();
      processResponse(clone, resolveRequestUrl(input));
    } catch (error) {
      console.debug("FC26 importer fetch interception failed", error);
    }
    return response;
  };

  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function patchedSend() {
    this.addEventListener("load", function () {
      try {
        const contentType = this.getResponseHeader("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const url = this.responseURL || "";
        const text = this.responseText;
        if (!text) return;
        processPotentialJson(text, url);
      } catch (error) {
        console.debug("FC26 importer XHR interception failed", error);
      }
    });
    return originalXhrSend.apply(this, arguments);
  };

  function resolveRequestUrl(input) {
    try {
      if (typeof input === "string") {
        return new URL(input, location.href).href;
      }
      if (input instanceof Request) {
        return input.url;
      }
    } catch (error) {
      console.debug("FC26 importer failed to resolve URL", error);
    }
    return "";
  }

  async function processResponse(response, url) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return;
    const text = await response.text();
    processPotentialJson(text, url || response.url || "");
  }

  function processPotentialJson(text, url) {
    if (!shouldParseUrl(url)) return;
    try {
      const data = JSON.parse(sanitizeJson(text));
      scanForPlayers(data);
    } catch (error) {
      console.debug("FC26 importer failed to parse JSON", error);
    }
  }

  function shouldParseUrl(url) {
    if (!url) return false;
    let target = url;
    try {
      target = new URL(url, location.href).href;
    } catch (error) {
      console.debug("FC26 importer failed to normalize URL", error);
    }

    if (/\/ut\/game\//i.test(target) && /club|squad|pile|item|player/i.test(target)) {
      return true;
    }

    if (/fc/i.test(target) && /club|squad|pile|item|player/i.test(target)) {
      return true;
    }

    if (/fifa/i.test(target) && /club|squad|pile|item|player/i.test(target)) {
      return true;
    }

    return false;
  }

  function sanitizeJson(text) {
    if (typeof text !== "string") return "";
    const trimmed = text.trimStart();
    const guards = [")]}',", ")]}'", "while(1);", "for(;;);"];
    for (const guard of guards) {
      if (trimmed.startsWith(guard)) {
        return trimmed.slice(guard.length);
      }
    }
    return trimmed;
  }

  function scanForPlayers(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      if (node.length && looksLikePlayer(node[0])) {
        for (const item of node) {
          ingestPlayer(item);
        }
        return;
      }
      for (const item of node) scanForPlayers(item);
      return;
    }
    if (typeof node === "object") {
      const values = Object.values(node);
      if (values.some((value) => looksLikePlayer(value))) {
        for (const value of values) {
          if (Array.isArray(value)) {
            for (const item of value) ingestPlayer(item);
          } else if (typeof value === "object" && value) {
            ingestPlayer(value);
          }
        }
      } else {
        for (const value of values) scanForPlayers(value);
      }
    }
  }

  function looksLikePlayer(candidate) {
    if (!candidate) return false;
    if (Array.isArray(candidate)) return candidate.some(looksLikePlayer);
    if (typeof candidate !== "object") return false;

    const rating = pickNumber(candidate, [
      "rating",
      "overallRating",
      "ovr",
      "totalRating",
      "statsRating",
    ]);

    const name =
      pickString(candidate, [
        "name",
        "commonName",
        "preferredName",
        "firstName",
        "lastName",
        "playerName",
      ]) || buildNameFromParts(candidate);

    if (!rating || !name) return false;

    if (
      pickString(candidate, [
        "club",
        "team",
        "teamName",
        "clubName",
        "clubAbbr",
        "teamAbbr",
      ])
    ) {
      return true;
    }

    if (
      pickString(candidate, ["league", "leagueName", "leagueFullName", "leagueAbbr"]) ||
      pickNumber(candidate, ["leagueId", "league", "leagueIdNumeric"])
    ) {
      return true;
    }

    if (pickNumber(candidate, ["definitionId", "id", "itemId", "resourceId", "assetId"])) {
      return true;
    }

    if (pickString(candidate, ["preferredPosition", "bestPosition", "position", "role"])) {
      return true;
    }

    return false;
  }

  function buildNameFromParts(source) {
    const first = pickString(source, ["commonName", "preferredName", "firstName", "name"]);
    const last = pickString(source, ["lastName", "surname", "playerName"]);
    if (first && last) return `${first} ${last}`;
    return first || last || "";
  }

  function ingestPlayer(raw) {
    if (!raw || typeof raw !== "object") return;
    const id =
      pickString(raw, ["definitionId", "id", "itemId", "resourceId"]) ||
      String(pickNumber(raw, ["definitionId", "id", "itemId", "resourceId"])) ||
      undefined;
    const rating = pickNumber(raw, ["rating", "overallRating", "ovr", "totalRating", "statsRating"]);
    if (!rating) return;

    const nameParts = [];
    const first = pickString(raw, ["commonName", "firstName", "name"]);
    const last = pickString(raw, ["lastName", "surname", "playerName"]);
    if (first) nameParts.push(first);
    if (last && !first?.includes(last)) nameParts.push(last);
    let name = nameParts.join(" ").trim();
    if (!name) {
      name = pickString(raw, ["commonName", "name", "playerName", "fullName"]) || "";
    }
    if (!name) return;

    const nation = pickString(raw, ["nationName", "nation", "country", "nationality", "nationAbbr"]) || "";
    const league = pickString(raw, ["leagueName", "league", "leagueFullName", "leagueAbbr"]) || "";
    const club = pickString(raw, ["teamName", "clubName", "club", "team", "clubAbbr", "teamAbbr"]) || "";

    const positions = extractPositions(raw);

    const normalized = normalizeRecord({
      name,
      rating,
      nation,
      league,
      club,
      positions,
    });

    if (!normalized) return;
    const key = id || `${normalized.name}|${normalized.rating}|${normalized.club}`;
    roster.set(key, normalized);
    refreshExportBuffer();
  }

  function extractPositions(raw) {
    const collected = new Set();
    const direct = pickString(raw, ["preferredPosition", "bestPosition", "position", "role"]);
    if (direct) collected.add(direct);

    const arrays = [
      raw.positions,
      raw.positionInfo?.positions,
      raw.playerPosition?.positions,
      raw.secondaryPositions,
    ].filter(Boolean);

    for (const group of arrays) {
      if (!Array.isArray(group)) continue;
      for (const value of group) {
        if (!value) continue;
        if (typeof value === "string") {
          collected.add(value);
        } else if (typeof value === "object") {
          const label = pickString(value, ["position", "abbr", "shortName"]);
          if (label) collected.add(label);
        }
      }
    }

    return Array.from(collected);
  }

  function normalizeRecord(record) {
    const rating = Number(record.rating);
    if (!Number.isFinite(rating)) return null;
    const name = titleCase(record.name);
    if (!name) return null;
    const league = record.league ? record.league.trim() : "";
    const club = titleCase(record.club || "");
    const nation = titleCase(record.nation || "");
    const positions = (record.positions || [])
      .map((pos) => String(pos).trim().toUpperCase())
      .filter(Boolean);
    return { name, rating: Math.round(rating), nation, league, club, positions };
  }

  function refreshExportBuffer(requestId) {
    const lines = Array.from(roster.values()).map((player) => {
      const parts = [player.name, player.rating, player.nation, player.league, player.club];
      if (player.positions.length) {
        parts.push(player.positions.join(" / "));
      }
      return parts.join(", ");
    });
    const payload = lines.join("\n");
    latestExport = payload;
    broadcastState(requestId);
  }

  function broadcastState(requestId) {
    try {
      window.postMessage(
        {
          source: MESSAGE_SOURCE,
          type: "state",
          requestId,
          payload: {
            roster: latestExport,
            players: Array.from(roster.values()),
            count: roster.size,
          },
        },
        "*"
      );
    } catch (error) {
      console.debug("FC26 importer failed to broadcast state", error);
    }
  }

  function pickNumber(source, keys) {
    for (const key of keys) {
      const value = source?.[key];
      const extracted = extractNumber(value);
      if (typeof extracted === "number") {
        return extracted;
      }
    }
    return undefined;
  }

  function extractNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const extracted = extractNumber(item);
        if (typeof extracted === "number") {
          return extracted;
        }
      }
    }
    if (value && typeof value === "object") {
      for (const key of ["value", "val", "defaultValue", "amount"]) {
        const extracted = extractNumber(value[key]);
        if (typeof extracted === "number") {
          return extracted;
        }
      }
    }
    return undefined;
  }

  function pickString(source, keys) {
    for (const key of keys) {
      const value = source?.[key];
      const extracted = extractString(value);
      if (typeof extracted === "string" && extracted.trim()) {
        return extracted.trim();
      }
    }
    return undefined;
  }

  function extractString(value) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const extracted = extractString(item);
        if (typeof extracted === "string" && extracted.trim()) {
          return extracted.trim();
        }
      }
      return undefined;
    }
    if (value && typeof value === "object") {
      for (const key of [
        "value",
        "val",
        "name",
        "fullName",
        "default",
        "defaultValue",
        "longName",
        "shortName",
        "abbr",
        "label",
        "localized",
        "localizedValue",
        "text",
      ]) {
        const extracted = extractString(value[key]);
        if (typeof extracted === "string" && extracted.trim()) {
          return extracted.trim();
        }
      }
    }
    return undefined;
  }

  function titleCase(value) {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function injectOverlay() {
    if (document.getElementById(overlayId)) return;
    const container = document.createElement("div");
    container.id = overlayId;
    container.style.position = "fixed";
    container.style.bottom = "16px";
    container.style.right = "16px";
    container.style.zIndex = "999999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.fontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

    const button = document.createElement("button");
    button.textContent = "Copy club export";
    button.style.padding = "10px 14px";
    button.style.borderRadius = "9999px";
    button.style.border = "none";
    button.style.background = "#2563eb";
    button.style.color = "white";
    button.style.fontSize = "13px";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 10px 30px rgba(37, 99, 235, 0.35)";

    const status = document.createElement("span");
    status.style.background = "rgba(15, 23, 42, 0.85)";
    status.style.color = "white";
    status.style.padding = "6px 10px";
    status.style.borderRadius = "9999px";
    status.style.fontSize = "12px";
    status.style.display = "none";

    button.addEventListener("click", async () => {
      if (!latestExport) {
        showStatus("No club data captured yet. Browse your club first.", status);
        return;
      }
      if (!navigator.clipboard?.writeText) {
        showStatus("Clipboard API unavailable in this browser", status);
        return;
      }
      try {
        await navigator.clipboard.writeText(latestExport);
        showStatus("Copied club export to clipboard", status);
      } catch (error) {
        console.warn("FC26 importer failed to copy", error);
        showStatus("Copy failed – check console", status);
      }
    });

    container.appendChild(button);
    container.appendChild(status);
    document.body.appendChild(container);
  }

  function showStatus(message, node) {
    node.textContent = message;
    node.style.display = "inline-flex";
    clearTimeout(node._hideTimeout);
    node._hideTimeout = setTimeout(() => {
      node.style.display = "none";
    }, 2500);
  }

  function exposeApi() {
    window.fc26ClubExporter = {
      __initialized: true,
      getRoster() {
        return latestExport;
      },
      getPlayers() {
        return Array.from(roster.values());
      },
      copyToClipboard() {
        if (!latestExport) return Promise.resolve();
        if (!navigator.clipboard?.writeText) {
          return Promise.reject(new Error("Clipboard API unavailable"));
        }
        return navigator.clipboard.writeText(latestExport);
      },
      clear() {
        roster.clear();
        refreshExportBuffer();
      },
    };
  }

  const observer = new MutationObserver(() => injectOverlay());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectOverlay();
  exposeApi();
  broadcastState();

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== EXTENSION_SOURCE) {
      return;
    }

    if (message.type === "requestState") {
      broadcastState(message.requestId);
      return;
    }

    if (message.type === "clearRoster") {
      roster.clear();
      refreshExportBuffer(message.requestId);
      return;
    }
  });
})();
