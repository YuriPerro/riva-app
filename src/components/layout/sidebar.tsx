import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { HomeIcon, type HomeIconHandle } from "@/components/ui/home";
import { LayersIcon, type LayersIconHandle } from "@/components/ui/layers";
import { ZapIcon, type ZapHandle } from "@/components/ui/zap";
import { GitPullRequestIcon, type GitPullRequestIconHandle } from "@/components/ui/git-pull-request";
import { SettingsIcon, type SettingsIconHandle } from "@/components/ui/settings";
import { BellIcon, type BellIconHandle } from "@/components/ui/bell";

type AnimatedHandle = { startAnimation: () => void; stopAnimation: () => void };

interface NavItemProps {
  to: string;
  label: string;
  end?: boolean;
  iconRef: React.RefObject<AnimatedHandle | null>;
  icon: React.ReactNode;
}

function NavItem({ to, label, end, iconRef, icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
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
          <span className={isActive ? "text-fg" : "text-fg-muted"}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const homeRef = useRef<HomeIconHandle>(null);
  const layersRef = useRef<LayersIconHandle>(null);
  const zapRef = useRef<ZapHandle>(null);
  const prRef = useRef<GitPullRequestIconHandle>(null);
  const settingsRef = useRef<SettingsIconHandle>(null);
  const bellRef = useRef<BellIconHandle>(null);

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
        <NavItem
          to="/" end
          label="Dashboard"
          iconRef={homeRef}
          icon={<HomeIcon ref={homeRef} size={15} />}
        />
        <NavItem
          to="/my-work"
          label="My Work"
          iconRef={layersRef}
          icon={<LayersIcon ref={layersRef} size={15} />}
        />
        <NavItem
          to="/pipelines"
          label="Pipelines"
          iconRef={zapRef}
          icon={<ZapIcon ref={zapRef} size={15} />}
        />
        <NavItem
          to="/pull-requests"
          label="Pull Requests"
          iconRef={prRef}
          icon={<GitPullRequestIcon ref={prRef} size={15} />}
        />
      </nav>

      <div className="flex flex-col gap-0.5 px-2 pt-2">
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
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
        >
          <span className="text-fg-muted">
            <BellIcon ref={bellRef} size={15} />
          </span>
          Test Toast
        </button>

        <NavLink
          to="/settings"
          onMouseEnter={() => settingsRef.current?.startAnimation()}
          onMouseLeave={() => settingsRef.current?.stopAnimation()}
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
              <span className={isActive ? "text-fg" : "text-fg-muted"}>
                <SettingsIcon ref={settingsRef} size={15} />
              </span>
              Settings
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
