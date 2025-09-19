(() => {
  const MESSAGE_SOURCE = "club";

  window.addEventListener(
    "message",
    (event) => {
      if (event.source !== window) {
        return;
      }
      const payload = event.data;
      if (!payload || payload.src !== MESSAGE_SOURCE) {
        return;
      }

      const players = Array.isArray(payload?.data?.itemData)
        ? payload.data.itemData
        : null;
      if (!players) {
        return;
      }

      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        return;
      }

      try {
        chrome.runtime.sendMessage({ type: "club", players });
      } catch (error) {
        console.debug("FC26 proxy failed to forward club payload", error);
      }
    },
    false
  );
})();
