import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const ThemeContext = createContext<Ctx | null>(null);

function getSystemPref(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function load(): Theme | null {
  try {
    return (localStorage.getItem("theme") as Theme) ?? null;
  } catch {
    return null;
  }
}

function save(t: Theme) {
  try {
    localStorage.setItem("theme", t);
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to dark if no saved preference
  const [theme, setTheme] = useState<Theme>(() => load() ?? "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    save(theme);
  }, [theme]);

  // Only update if user hasn't chosen manually
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (!load()) setTheme("dark"); // always default back to dark
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      set: setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
