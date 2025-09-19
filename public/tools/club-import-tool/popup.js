const statusDot = document.getElementById("status-dot");
const statusMessage = document.getElementById("status-message");
const copyButton = document.getElementById("copy-roster");
const clearButton = document.getElementById("clear-roster");
const playerCount = document.getElementById("player-count");
const playerList = document.getElementById("player-list");
const emptyState = document.getElementById("empty-state");

let activeTabId = null;

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("No active tab found. Open the EA FC web app and try again.");
    toggleReady(false);
    return;
  }

  activeTabId = tab.id;
  copyButton.addEventListener("click", handleCopy);
  clearButton.addEventListener("click", handleClear);

  await refreshSummary();
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshSummary() {
  if (!activeTabId) return;

  const response = await sendMessage(activeTabId, { type: "fc26:getSummary" });

  if (!response?.success) {
    toggleReady(false);
    if (response?.error === "NO_CONTEXT") {
      setStatus("Open the EA FC 26 web app and browse your club to start capturing.");
    } else {
      setStatus("Unable to connect to the EA FC page. Make sure it's open and refreshed.");
    }
    renderPlayers([]);
    return;
  }

  toggleReady(true);

  if (response.count > 0) {
    setStatus(`Capturing players from this tab. ${response.count} tracked so far.`);
  } else {
    setStatus("Connected. Browse your club to capture player data.");
  }

  renderPlayers(response.players || []);
}

async function handleCopy() {
  if (!activeTabId) return;
  setBusy(copyButton, true);
  const response = await sendMessage(activeTabId, { type: "fc26:copyRoster" });
  setBusy(copyButton, false);

  if (response?.success) {
    setStatus("Copied club export to clipboard.", true);
  } else {
    setStatus(response?.error || "Copy failed. Check the EA FC tab and try again.");
  }
}

async function handleClear() {
  if (!activeTabId) return;
  setBusy(clearButton, true);
  await sendMessage(activeTabId, { type: "fc26:clearRoster" });
  setBusy(clearButton, false);
  setStatus("Cleared captured players.");
  await refreshSummary();
}

async function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: "NO_CONTEXT" });
        return;
      }
      resolve(response);
    });
  });
}

function renderPlayers(players) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, 12);

  playerList.innerHTML = "";

  if (!top.length) {
    emptyState.style.display = "block";
    playerList.appendChild(emptyState);
    playerCount.textContent = "0";
    copyButton.disabled = true;
    clearButton.disabled = true;
    return;
  }

  emptyState.style.display = "none";
  playerCount.textContent = String(players.length);
  copyButton.disabled = false;
  clearButton.disabled = false;

  for (const player of top) {
    const row = document.createElement("div");
    row.className = "player-row";

    const name = document.createElement("div");
    name.className = "player-name";
    name.textContent = `${player.name} (${player.rating})`;

    const meta = document.createElement("div");
    meta.className = "player-meta";
    meta.textContent = [player.club, player.league, player.nation]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" • ");

    const positions = document.createElement("div");
    positions.className = "player-positions";
    positions.textContent = player.positions?.length
      ? `Positions: ${player.positions.join(", ")}`
      : "";

    row.appendChild(name);
    if (meta.textContent) {
      row.appendChild(meta);
    }
    if (positions.textContent) {
      row.appendChild(positions);
    }

    playerList.appendChild(row);
  }

  if (players.length > top.length) {
    const more = document.createElement("div");
    more.className = "player-meta";
    more.style.textAlign = "center";
    more.textContent = `…and ${players.length - top.length} more players captured.`;
    playerList.appendChild(more);
  }
}

function setStatus(message, highlight = false) {
  statusMessage.textContent = message;
  if (highlight) {
    statusMessage.style.color = "#a5f3fc";
  } else {
    statusMessage.style.color = "inherit";
  }
}

function toggleReady(ready) {
  if (ready) {
    statusDot.classList.add("ready");
  } else {
    statusDot.classList.remove("ready");
  }
}

function setBusy(button, busy) {
  if (busy) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "Working…";
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("Failed to initialise popup", error);
    setStatus("Unexpected error while initialising extension.");
    toggleReady(false);
  });
});
