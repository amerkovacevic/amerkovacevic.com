import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import App from "./views/App";
import Home from "./views/Home";
import Pickup from "./views/Pickup";
import CreateGame from "./views/CreateGame";
import Links from "./views/Links";
import SecretSanta from "./views/SecretSanta";
import Resume from "./views/Resume";
import FMTeamDraw from "./views/FMTeamDraw";
import Bracket from "./views/Bracket";
import { ThemeProvider } from "./theme";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "pickup", element: <Pickup /> },
      { path: "new", element: <CreateGame /> },
      { path: "links", element: <Links /> },
      { path: "santa", element: <SecretSanta /> },   // ← new
      { path: "resume", element: <Resume /> },       // ← new
      { path: "/fm", element: <FMTeamDraw /> },
          { path: "/bracket", element: <Bracket /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
