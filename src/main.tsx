import React from "react";
import ReactDOM from "react-dom/client";
import "./shared/styles/globals.css";

import { AppRouter, ThemeProvider } from "./app";

// Hydrate the single-page app, wrapping every route in the theme context so
// dark/light mode stays in sync across navigation.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>
);
