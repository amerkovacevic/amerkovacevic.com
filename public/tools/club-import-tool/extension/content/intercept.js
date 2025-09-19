(() => {
  const METHOD_STORE = new WeakMap();
  const LISTENERS = new WeakSet();

  const nativeOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
  const nativeSend = window.XMLHttpRequest && window.XMLHttpRequest.prototype.send;

  if (!nativeOpen || !nativeSend) {
    return;
  }

  function rememberMetadata(xhr, method, url) {
    try {
      METHOD_STORE.set(xhr, {
        method: typeof method === "string" ? method.toUpperCase() : "",
        url: typeof url === "string" ? url : "",
      });
    } catch (error) {
      console.debug("FC26 failed to remember XHR metadata", error);
    }
  }

  function handleReadyStateChange(event) {
    try {
      const xhr = event?.target ?? this;
      if (!xhr || typeof xhr !== "object") {
        return;
      }
      if (xhr.readyState !== 4) {
        return;
      }

      const meta = METHOD_STORE.get(xhr) || { method: "", url: "" };
      const method = meta.method || "";
      if (method && method !== "GET") {
        return;
      }

      const responseURL = typeof xhr.responseURL === "string" && xhr.responseURL
        ? xhr.responseURL
        : meta.url;
      if (!responseURL || typeof responseURL !== "string") {
        return;
      }

      if (!responseURL.endsWith("/club")) {
        return;
      }

      const responseText = typeof xhr.responseText === "string" ? xhr.responseText : "";
      if (!responseText) {
        return;
      }

      let payload;
      try {
        payload = JSON.parse(responseText);
      } catch (error) {
        return;
      }

      if (payload?.code === 401) {
        return;
      }

      window.postMessage(
        {
          src: "club",
          data: payload,
          url: responseURL,
        },
        "*"
      );
    } catch (error) {
      console.debug("FC26 intercept failed to process response", error);
    }
  }

  window.XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    rememberMetadata(this, method, url);
    if (!LISTENERS.has(this)) {
      this.addEventListener("readystatechange", handleReadyStateChange, false);
      LISTENERS.add(this);
    }
    return nativeOpen.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.send = function patchedSend(body) {
    if (!LISTENERS.has(this)) {
      this.addEventListener("readystatechange", handleReadyStateChange, false);
      LISTENERS.add(this);
    }
    return nativeSend.apply(this, arguments);
  };
})();
