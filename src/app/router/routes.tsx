import { type RouteObject } from "react-router-dom";

import { RootLayout } from "../layouts";
import {
  BracketPage,
  CreateGamePage,
  FmTeamDrawPage,
  AmerGauntletPage,
  HomePage,
  GameDetailPage,
  GamesLandingPage,
  LinksPage,
  ProfessionalLandingPage,
  PortfolioPage,
  StartAProjectPage,
  PickupGamePage,
  PickupPage,
  SecretSantaPage,
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
          { path: "amer-gauntlet", element: <AmerGauntletPage /> },
          { path: "pickup", element: <PickupPage /> },
          { path: "pickup/:gameId", element: <PickupGamePage /> },
          { path: "new", element: <CreateGamePage /> },
          { path: "santa", element: <SecretSantaPage /> },
          { path: "fm", element: <FmTeamDrawPage /> },
          { path: "bracket", element: <BracketPage /> },
          {
            path: "games",
            children: [
              { index: true, element: <GamesLandingPage /> },
              { path: ":gameId", element: <GameDetailPage /> },
            ],
          },
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
