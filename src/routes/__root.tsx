import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { AuthProvider } from "../components/zimma/auth-context";
import { AdminProvider } from "../components/zimma/admin-context";
import { Toaster } from "@/components/ui/sonner";
import { FavoritesProvider } from "../components/zimma/favorites";

// QueryClient ko yahan initialize karein
const queryClient = new QueryClient();

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <AdminProvider>
              <Outlet />
              <Toaster richColors position="top-right" />
            </AdminProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    ),
  },
);
