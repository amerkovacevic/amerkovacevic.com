(() => {
  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("content/intercept.js");
    script.async = false;
    script.type = "text/javascript";
    const cleanup = () => {
      script.remove();
    };
    script.addEventListener("load", cleanup, { once: true });
    script.addEventListener("error", cleanup, { once: true });
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.debug("FC26 loader failed to inject intercept script", error);
  }
})();
