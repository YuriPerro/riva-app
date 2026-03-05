import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { router } from "./routes";
import { themeManager } from "@/lib/theme-manager";
import "./styles/globals.css";

themeManager.init();

function handleGlobalError(err: unknown) {
  toast.error(typeof err === "string" ? err : "Something went wrong");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: handleGlobalError,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider openDelay={300}>
      <RouterProvider router={router} />
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "var(--color-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-fg)",
          fontSize: "13px",
          borderRadius: "8px",
        },
      }}
    />
    </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
