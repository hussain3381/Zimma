// import { RouterProvider, createRouter } from "@tanstack/react-router";
// import { routeTree } from "./routeTree.gen"; // Yeh file ab auto-generate hogi

// const router = createRouter({ routeTree });

// export default function App() {
//   return <RouterProvider router={router} />;
// }

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

// import { RouterProvider, createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
// import { Landing } from "./routes/index";
// import { ServicesPage } from "./routes/services"; // Naya page import kiya

// const rootRoute = createRootRoute();

// // Pehla route (Home page)
// const indexRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/",
//   component: Landing,
// });

// // Dusra route (Services page)
// const servicesRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/services",
//   component: ServicesPage,
// });

// // Dono routes ko root mein add kar diya
// const routeTree = rootRoute.addChildren([indexRoute, servicesRoute]);
// const router = createRouter({ routeTree });

// export default function App() {
//   return <RouterProvider router={router} />;
// }