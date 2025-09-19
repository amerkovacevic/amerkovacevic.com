(function () {
  "use strict";

  const MESSAGE_SOURCE = "fc26-club-exporter";
  const EXTENSION_SOURCE = "fc26-club-exporter-extension";
  const pending = new Map();
  let latestExport = "";
  let players = [];
  let count = 0;
  let ready = false;

  injectPageScript();
  window.addEventListener("message", handlePageMessage);

  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener(handleExtensionMessage);
  }

  requestState().catch(() => {
    /* ignore initial failure */
  });

  function injectPageScript() {
    try {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("injected.js");
      script.type = "text/javascript";
      script.async = false;
      script.addEventListener(
        "load",
        () => {
          script.remove();
        },
        { once: true }
      );
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.debug("FC26 importer failed to inject script", error);
    }
  }

  function handlePageMessage(event) {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== MESSAGE_SOURCE) return;

    if (message.type === "state") {
      ready = true;
      latestExport = message.payload?.roster || "";
      players = Array.isArray(message.payload?.players)
        ? message.payload.players
        : [];
      count =
        typeof message.payload?.count === "number"
          ? message.payload.count
          : players.length;

      if (message.requestId && pending.has(message.requestId)) {
        resolvePending(message.requestId, {
          success: true,
          roster: latestExport,
          players,
          count,
        });
      }
    }
  }

  function handleExtensionMessage(message, sender, sendResponse) {
    if (!message || typeof message.type !== "string") {
      return;
    }

    if (message.type === "fc26:getSummary") {
      requestState()
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          sendResponse({
            success: false,
            error: error?.message || String(error),
          });
        });
      return true;
    }

    if (message.type === "fc26:copyRoster") {
      if (!latestExport) {
        sendResponse({
          success: false,
          error: "No club data captured yet",
        });
        return;
      }
      if (!navigator.clipboard?.writeText) {
        sendResponse({
          success: false,
          error: "Clipboard API unavailable",
        });
        return;
      }
      navigator.clipboard
        .writeText(latestExport)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({
            success: false,
            error: error?.message || "Copy failed",
          })
        );
      return true;
    }

    if (message.type === "fc26:clearRoster") {
      clearRoster()
        .then((response) => sendResponse(response))
        .catch((error) =>
          sendResponse({
            success: false,
            error: error?.message || String(error),
          })
        );
      return true;
    }
  }

  function requestState() {
    if (ready) {
      return Promise.resolve({
        success: true,
        roster: latestExport,
        players,
        count,
      });
    }
    const requestId = generateRequestId();
    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "requestState",
        requestId,
      },
      "*"
    );
    return waitForResponse(requestId);
  }

  function clearRoster() {
    const requestId = generateRequestId();
    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "clearRoster",
        requestId,
      },
      "*"
    );
    return waitForResponse(requestId);
  }

  function waitForResponse(requestId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (pending.has(requestId)) {
          pending.delete(requestId);
          reject(new Error("Timed out waiting for club data"));
        }
      }, 2000);
      pending.set(requestId, { resolve, reject, timeout });
    });
  }

  function resolvePending(requestId, payload) {
    const pendingRequest = pending.get(requestId);
    if (!pendingRequest) return;
    pending.delete(requestId);
    clearTimeout(pendingRequest.timeout);
    pendingRequest.resolve(payload);
  }

  function generateRequestId() {
    return `fc26-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
})();
