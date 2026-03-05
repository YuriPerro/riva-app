import { memo, useRef } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { HomeIcon, type HomeIconHandle } from "@/components/ui/home";
import { LayersIcon, type LayersIconHandle } from "@/components/ui/layers";
import { ZapIcon, type ZapHandle } from "@/components/ui/zap";
import { GitPullRequestIcon, type GitPullRequestIconHandle } from "@/components/ui/git-pull-request";
import { SettingsIcon, type SettingsIconHandle } from "@/components/ui/settings";
import { ShineBorder } from "@/components/ui/shine-border";
import type { NavItemProps } from "./types";

const STAGGER_MS = 60;

function SidebarLabel(props: { collapsed: boolean; delay: number; children: React.ReactNode }) {
  if (props.collapsed) return null;

  return (
    <span
      className="whitespace-nowrap opacity-0"
      style={{
        animation: `sidebar-label-in 250ms ease-out ${props.delay}ms forwards`,
      }}
    >
      {props.children}
    </span>
  );
}

function NavItem(props: NavItemProps) {
  const { to, label, end, collapsed, index, iconRef, icon } = props;

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
          <SidebarLabel collapsed={collapsed} delay={index * STAGGER_MS}>{label}</SidebarLabel>
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip side="right">
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export const Sidebar = memo(function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  const homeRef = useRef<HomeIconHandle>(null);
  const layersRef = useRef<LayersIconHandle>(null);
  const zapRef = useRef<ZapHandle>(null);
  const prRef = useRef<GitPullRequestIconHandle>(null);
  const settingsRef = useRef<SettingsIconHandle>(null);

  return (
    <aside
      data-tauri-drag-region
      className={cn(
        "flex shrink-0 flex-col rounded-lg bg-surface noise-bg py-3 transition-[width] duration-200",
        collapsed ? "w-[52px]" : "w-[200px]"
      )}
    >
      <div data-tauri-drag-region className={cn("mb-2 overflow-hidden", collapsed ? "px-2" : "px-4")}>
        <div data-tauri-drag-region className="flex items-center gap-2">
          <SidebarLabel collapsed={collapsed} delay={0}>
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg">Forge</span>
              <span className="relative overflow-hidden rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-white/50">
                <ShineBorder shineColor={["var(--color-accent)", "var(--color-accent-muted)", "var(--color-accent)"]} className="opacity-50" borderWidth={0.6} duration={5} />
                beta
              </span>
            </span>
          </SidebarLabel>
        </div>
      </div>

      <nav className={cn("flex flex-1 flex-col px-2 mt-3", collapsed ? "gap-5" : "gap-1")}>
        <NavItem to="/" end label="Dashboard" collapsed={collapsed} index={0} iconRef={homeRef} icon={<HomeIcon ref={homeRef} size={18} />} />
        <NavItem to="/my-work" label="My Work" collapsed={collapsed} index={1} iconRef={layersRef} icon={<LayersIcon ref={layersRef} size={18} />} />
        <NavItem to="/pipelines" label="Pipelines" collapsed={collapsed} index={2} iconRef={zapRef} icon={<ZapIcon ref={zapRef} size={18} />} />
        <NavItem to="/pull-requests" label="Pull Requests" collapsed={collapsed} index={3} iconRef={prRef} icon={<GitPullRequestIcon ref={prRef} size={18} />} />
      </nav>

      <div className={cn("flex flex-col px-2 pt-2", collapsed ? "gap-5" : "gap-1")}>
        <NavItem to="/settings" label="Settings" collapsed={collapsed} index={4} iconRef={settingsRef} icon={<SettingsIcon ref={settingsRef} size={18} />} />

        <button
          onClick={toggle}
          className={cn(
            "flex cursor-pointer items-center rounded-md py-2 text-fg-muted transition-colors hover:bg-elevated hover:text-fg-secondary",
            collapsed ? "justify-center px-2" : "gap-2.5 px-3 text-[13px]"
          )}
        >
          <span className="shrink-0">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </span>
          <SidebarLabel collapsed={collapsed} delay={5 * STAGGER_MS}>Collapse</SidebarLabel>
        </button>
      </div>
    </aside>
  );
});
