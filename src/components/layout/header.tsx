import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamSwitcher } from "./team-switcher";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/my-work": "My Work",
  "/pipelines": "Pipelines",
  "/pull-requests": "Pull Requests",
  "/settings": "Settings",
};

export function Header() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const title = pageTitles[location.pathname] ?? "Forge";
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    if (spinning) return;
    setSpinning(true);
    queryClient.invalidateQueries();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 flex-shrink-0 items-center justify-between px-5"
    >
      <span data-tauri-drag-region className="text-[13px] font-medium text-fg">
        {title}
      </span>

      <div className="flex items-center gap-2">
        <TeamSwitcher />

        <button
          onClick={handleRefresh}
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors",
            "text-fg-muted hover:bg-elevated hover:text-fg"
          )}
        >
          <RefreshCw size={13} className={cn(spinning && "animate-spin")} />
        </button>
      </div>
    </header>
  );
}
