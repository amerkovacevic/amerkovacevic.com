import { type RouteObject } from "react-router-dom";

import { RootLayout } from "../layouts";
import {
  BracketPage,
  CreateGamePage,
  FmTeamDrawPage,
  HomePage,
  LinksPage,
  ProfessionalLandingPage,
  PortfolioPage,
  StartAProjectPage,
  PickupGamePage,
  PickupPage,
  SecretSantaPage,
  UltimateTeamPage,
  AppsLandingPage,
} from "../../pages";

// Application routes wire feature pages into the shared RootLayout shell.
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "tools",
        children: [
          { index: true, element: <AppsLandingPage /> },
          { path: "pickup", element: <PickupPage /> },
          { path: "pickup/:gameId", element: <PickupGamePage /> },
          { path: "new", element: <CreateGamePage /> },
          { path: "santa", element: <SecretSantaPage /> },
          { path: "fm", element: <FmTeamDrawPage /> },
          { path: "ultimate-team", element: <UltimateTeamPage /> },
          { path: "bracket", element: <BracketPage /> },
        ],
      },
      {
        path: "professional",
        children: [
          { index: true, element: <ProfessionalLandingPage /> },
          { path: "portfolio", element: <PortfolioPage /> },
          { path: "start-a-project", element: <StartAProjectPage /> },
          { path: "links", element: <LinksPage /> },
        ],
      },
    ],
  },
];
