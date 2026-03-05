import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HomeIcon, type HomeIconHandle } from "@/components/ui/home";
import { LayersIcon, type LayersIconHandle } from "@/components/ui/layers";
import { ZapIcon, type ZapHandle } from "@/components/ui/zap";
import { GitPullRequestIcon, type GitPullRequestIconHandle } from "@/components/ui/git-pull-request";
import { SettingsIcon, type SettingsIconHandle } from "@/components/ui/settings";
import { BellIcon, type BellIconHandle } from "@/components/ui/bell";
import type { NavItemProps } from "./types";

function SidebarLabel(props: { collapsed: boolean; children: React.ReactNode }) {
  if (props.collapsed) return null;

  return (
    <span className="animate-in fade-in slide-in-from-left-1 duration-200 whitespace-nowrap">
      {props.children}
    </span>
  );
}

function NavItem(props: NavItemProps) {
  const { to, label, end, collapsed, iconRef, icon } = props;

  const link = (
    <NavLink
      to={to}
      end={end}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className={({ isActive }) =>
        cn(
          "flex cursor-pointer items-center rounded-md py-2 transition-colors",
          collapsed ? "justify-center px-2" : "gap-2.5 px-3 text-[13px]",
          isActive
            ? "bg-elevated text-fg"
            : "text-fg-secondary hover:bg-elevated hover:text-fg"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("shrink-0", isActive ? "text-fg" : "text-fg-muted")}>{icon}</span>
          <SidebarLabel collapsed={collapsed}>{label}</SidebarLabel>
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="border-border bg-elevated text-[12px] text-fg">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  const homeRef = useRef<HomeIconHandle>(null);
  const layersRef = useRef<LayersIconHandle>(null);
  const zapRef = useRef<ZapHandle>(null);
  const prRef = useRef<GitPullRequestIconHandle>(null);
  const settingsRef = useRef<SettingsIconHandle>(null);
  const bellRef = useRef<BellIconHandle>(null);

  const toastButton = (
    <button
      onMouseEnter={() => bellRef.current?.startAnimation()}
      onMouseLeave={() => bellRef.current?.stopAnimation()}
      onClick={() => {
        const toasts = [
          () => toast.success("Pipeline CI · main succeeded"),
          () => toast.error("Pipeline CD · hotfix/crash failed"),
          () => toast.warning("Sprint deadline approaching in 2 days"),
          () => toast.loading("Syncing work items..."),
          () => toast("New PR ready for review"),
        ];
        toasts[Math.floor(Math.random() * toasts.length)]();
      }}
      className={cn(
        "flex cursor-pointer items-center rounded-md py-2 text-fg-secondary transition-colors hover:bg-elevated hover:text-fg",
        collapsed ? "justify-center px-2" : "gap-2.5 px-3 text-[13px]"
      )}
    >
      <span className="shrink-0 text-fg-muted">
        <BellIcon ref={bellRef} size={15} />
      </span>
      <SidebarLabel collapsed={collapsed}>Test Toast</SidebarLabel>
    </button>
  );

  const settingsLink = (
    <NavLink
      to="/settings"
      onMouseEnter={() => settingsRef.current?.startAnimation()}
      onMouseLeave={() => settingsRef.current?.stopAnimation()}
      className={({ isActive }) =>
        cn(
          "flex cursor-pointer items-center rounded-md py-2 transition-colors",
          collapsed ? "justify-center px-2" : "gap-2.5 px-3 text-[13px]",
          isActive
            ? "bg-elevated text-fg"
            : "text-fg-secondary hover:bg-elevated hover:text-fg"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("shrink-0", isActive ? "text-fg" : "text-fg-muted")}>
            <SettingsIcon ref={settingsRef} size={15} />
          </span>
          <SidebarLabel collapsed={collapsed}>Settings</SidebarLabel>
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      data-tauri-drag-region
      className={cn(
        "flex shrink-0 flex-col rounded-lg bg-surface py-3 transition-[width] duration-200",
        collapsed ? "w-[52px]" : "w-[200px]"
      )}
    >
      <div data-tauri-drag-region className={cn("mb-2 overflow-hidden", collapsed ? "px-2" : "px-4")}>
        <div data-tauri-drag-region className="flex items-center gap-2">
          <SidebarLabel collapsed={collapsed}>
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg">Forge</span>
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-fg-disabled">
                beta
              </span>
            </span>
          </SidebarLabel>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        <NavItem to="/" end label="Dashboard" collapsed={collapsed} iconRef={homeRef} icon={<HomeIcon ref={homeRef} size={15} />} />
        <NavItem to="/my-work" label="My Work" collapsed={collapsed} iconRef={layersRef} icon={<LayersIcon ref={layersRef} size={15} />} />
        <NavItem to="/pipelines" label="Pipelines" collapsed={collapsed} iconRef={zapRef} icon={<ZapIcon ref={zapRef} size={15} />} />
        <NavItem to="/pull-requests" label="Pull Requests" collapsed={collapsed} iconRef={prRef} icon={<GitPullRequestIcon ref={prRef} size={15} />} />
      </nav>

      <div className="flex flex-col gap-0.5 px-2 pt-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{toastButton}</TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-elevated text-[12px] text-fg">
              Test Toast
            </TooltipContent>
          </Tooltip>
        ) : (
          toastButton
        )}

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-elevated text-[12px] text-fg">
              Settings
            </TooltipContent>
          </Tooltip>
        ) : (
          settingsLink
        )}

        <button
          onClick={toggle}
          className={cn(
            "flex cursor-pointer items-center rounded-md py-2 text-fg-muted transition-colors hover:bg-elevated hover:text-fg-secondary",
            collapsed ? "justify-center px-2" : "gap-2.5 px-3 text-[13px]"
          )}
        >
          <span className="shrink-0">
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </span>
          <SidebarLabel collapsed={collapsed}>Collapse</SidebarLabel>
        </button>
      </div>
    </aside>
  );
}
