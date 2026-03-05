import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppLayout() {
  return (
    <div data-tauri-drag-region className="flex h-full flex-col bg-base">
      <div data-tauri-drag-region className="h-9 w-full flex-shrink-0" />
      <div data-tauri-drag-region className="flex flex-1 gap-2 overflow-hidden px-2 pb-2">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-surface">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
