import { useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/my-work": "My Work",
  "/pipelines": "Pipelines",
  "/pull-requests": "Pull Requests",
  "/settings": "Settings",
};

export function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Forge";

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 flex-shrink-0 items-center justify-between px-5"
    >
      <span data-tauri-drag-region className="text-[13px] font-medium text-fg">
        {title}
      </span>

      <button
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "text-fg-muted hover:bg-elevated hover:text-fg"
        )}
      >
        <RefreshCw size={13} />
      </button>
    </header>
  );
}
