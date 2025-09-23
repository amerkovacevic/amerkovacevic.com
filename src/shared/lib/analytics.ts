const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inject the Google Analytics script into the document head and set up the gtag
// helper only in production builds when a measurement id is provided.
export const initializeAnalytics = () => {
  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.warn(
        "VITE_GA_MEASUREMENT_ID is not configured – skipping Google Analytics setup."
      );
    }

    return;
  }

  if (!import.meta.env.PROD) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const existingScript = document.querySelector(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer ?? [];

  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }

  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", measurementId);
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
