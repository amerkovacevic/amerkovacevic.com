import { handleClubImportMessage } from "../dist/background/handlers/club.js";

const CLUB_URL_PATTERNS = [
  "https://www.ea.com/*ea-sports-fc/ultimate-team/web-app/*",
];

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "fc26-copy-roster",
      title: "Copy FC 26 club export",
      contexts: ["page"],
      documentUrlPatterns: CLUB_URL_PATTERNS,
    });
  } catch (error) {
    console.debug("FC26 context menu creation failed", error);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "fc26-copy-roster" || !tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "fc26:copyRoster" }, (response) => {
    if (chrome.runtime.lastError) {
      console.debug("FC26 copy context menu failed", chrome.runtime.lastError);
      return;
    }
    if (!response?.success && response?.error) {
      console.debug("FC26 copy context menu responded with error", response.error);
    }
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message.type !== "string") {
    return;
  }

  if (message.type === "club") {
    try {
      handleClubImportMessage(Array.isArray(message.players) ? message.players : []);
    } catch (error) {
      console.debug("FC26 club handler failed", error);
    }
  }
});
