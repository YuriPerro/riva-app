import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "./routes";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={300}>
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
