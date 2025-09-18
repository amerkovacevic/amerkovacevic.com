import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { routes } from "./routes";

const router = createBrowserRouter(routes);

// Hook the React Router provider into the component tree once.
export function AppRouter() {
  return <RouterProvider router={router} />;
}
