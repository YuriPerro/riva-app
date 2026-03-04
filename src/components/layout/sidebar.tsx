import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  GitPullRequest,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/my-work", icon: CheckSquare, label: "My Work" },
  { to: "/pipelines", icon: Zap, label: "Pipelines" },
  { to: "/pull-requests", icon: GitPullRequest, label: "Pull Requests" },
];

export function Sidebar() {
  return (
    <aside className="flex w-[200px] flex-shrink-0 flex-col rounded-lg bg-surface py-3">
      <div data-tauri-drag-region className="mb-2 px-4">
        <div data-tauri-drag-region className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-fg">Forge</span>
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-fg-disabled">
            beta
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                isActive
                  ? "bg-elevated text-fg"
                  : "text-fg-secondary hover:bg-elevated hover:text-fg"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={15}
                  className={isActive ? "text-fg" : "text-fg-muted"}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pt-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
              isActive
                ? "bg-elevated text-fg"
                : "text-fg-secondary hover:bg-elevated hover:text-fg"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                size={15}
                className={isActive ? "text-fg" : "text-fg-muted"}
              />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
