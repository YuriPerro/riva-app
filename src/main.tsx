import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./routes";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
