import { type RouteObject } from "react-router-dom";

import { RootLayout } from "../layouts";
import {
  BracketPage,
  CreateGamePage,
  FmTeamDrawPage,
  HomePage,
  LinksPage,
  PickupPage,
  ResumePage,
  SecretSantaPage,
} from "../../pages";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "pickup", element: <PickupPage /> },
      { path: "new", element: <CreateGamePage /> },
      { path: "links", element: <LinksPage /> },
      { path: "santa", element: <SecretSantaPage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "fm", element: <FmTeamDrawPage /> },
      { path: "bracket", element: <BracketPage /> },
    ],
  },
];
