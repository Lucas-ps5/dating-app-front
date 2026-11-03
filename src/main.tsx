import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@/plugins/clients"; // register axios interceptors (baseURL + auth token) immediately
import { RouterProvider } from "react-router";
import router from "./router";
import { AuthProvider } from "@/context/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data fresh for a short while so remounting a component
      // (or navigating back and forth) reuses the cache instead of refetching.
      staleTime: 30_000,
      // Keep unused queries in memory for 5 minutes before garbage collection.
      gcTime: 5 * 60_000,
      // Do not refetch every query when the tab regains focus.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
