import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./sidebar";

export function AppLayout() {
  const location = useLocation();

  return (
    <div data-tauri-drag-region className="flex h-full flex-col bg-base">
      <div data-tauri-drag-region className="h-9 w-full shrink-0" />
      <div data-tauri-drag-region className="flex flex-1 gap-2 overflow-hidden px-2 pb-2">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-surface noise-bg">
          <main
            key={location.pathname}
            className="flex-1 overflow-auto p-6"
            style={{ animation: "page-enter 250ms ease-out" }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
