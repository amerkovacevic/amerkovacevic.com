import { type RouteObject } from "react-router-dom";

import { RootLayout } from "../layouts";
import {
  BracketPage,
  CreateGamePage,
  FmTeamDrawPage,
  HomePage,
  LinksPage,
  PickupGamePage,
  PickupPage,
  SecretSantaPage,
} from "../../pages";

// Application routes wire feature pages into the shared RootLayout shell.
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "pickup", element: <PickupPage /> },
      { path: "pickup/:gameId", element: <PickupGamePage /> },
      { path: "new", element: <CreateGamePage /> },
      { path: "links", element: <LinksPage /> },
      { path: "santa", element: <SecretSantaPage /> },
      { path: "fm", element: <FmTeamDrawPage /> },
      { path: "bracket", element: <BracketPage /> },
    ],
  },
];
