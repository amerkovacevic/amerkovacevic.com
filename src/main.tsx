import React from "react";
import ReactDOM from "react-dom/client";
import "./shared/styles/globals.css";

import { AppRouter, ThemeProvider } from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>
);
