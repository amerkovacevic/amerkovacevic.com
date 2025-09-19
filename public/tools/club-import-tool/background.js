chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fc26-copy-roster",
    title: "Copy FC 26 club export",
    contexts: ["page"],
    documentUrlPatterns: ["https://ea.com/*", "https://*.ea.com/*"],
  });
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
