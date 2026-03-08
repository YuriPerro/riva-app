import { memo, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen, BellRing, Trash2 } from 'lucide-react';
import { notify } from '@/utils/notification-sound';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar';
import { HomeIcon, type HomeIconHandle } from '@/components/ui/home';
import { LayersIcon, type LayersIconHandle } from '@/components/ui/layers';
import { ZapIcon, type ZapHandle } from '@/components/ui/zap';
import { GitPullRequestIcon, type GitPullRequestIconHandle } from '@/components/ui/git-pull-request';
import { RocketIcon, type RocketHandle } from '@/components/ui/rocket';
import { SettingsIcon, type SettingsIconHandle } from '@/components/ui/settings';
import { ShineBorder } from '@/components/ui/shine-border';
import { SidebarGame } from '@/components/sidebar-game';
import { Route } from '@/types/routes';
import { SidebarLabel } from './sidebar-label';
import { NavItem } from './nav-item';

export const Sidebar = memo(function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  const homeRef = useRef<HomeIconHandle>(null);
  const layersRef = useRef<LayersIconHandle>(null);
  const zapRef = useRef<ZapHandle>(null);
  const prRef = useRef<GitPullRequestIconHandle>(null);
  const rocketRef = useRef<RocketHandle>(null);
  const settingsRef = useRef<SettingsIconHandle>(null);

  return (
    <aside
      data-tauri-drag-region
      className={cn(
        'flex shrink-0 flex-col rounded-lg bg-surface noise-bg py-3 transition-[width] duration-200',
        collapsed ? 'w-[52px]' : 'w-[200px]',
      )}
    >
      <div data-tauri-drag-region className={cn('mb-2 overflow-hidden', collapsed ? 'px-2' : 'px-4')}>
        <div data-tauri-drag-region className="flex items-center justify-between gap-2">
          <SidebarLabel collapsed={collapsed} delay={0}>
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg">Riva</span>
              <span className="relative overflow-hidden rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-fg-muted">
                <ShineBorder
                  shineColor={['var(--color-accent)', 'var(--color-accent-muted)', 'var(--color-accent)']}
                  className="opacity-50"
                  borderWidth={0.6}
                  duration={5}
                />
                beta
              </span>
            </span>
          </SidebarLabel>

          <button
            onClick={toggle}
            className={cn(
              'flex cursor-pointer items-center rounded-md py-2 text-fg-muted transition-colors hover:bg-elevated hover:text-fg-secondary',
              collapsed ? 'justify-center px-2' : 'gap-2.5 px-3 text-[13px]',
            )}
          >
            <span className="shrink-0">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</span>
          </button>
        </div>
      </div>

      <nav className={cn('flex flex-1 flex-col px-2 mt-3', collapsed ? 'gap-5' : 'gap-1')}>
        <NavItem
          to={Route.Dashboard}
          end
          label="Dashboard"
          collapsed={collapsed}
          index={0}
          iconRef={homeRef}
          icon={<HomeIcon ref={homeRef} size={18} />}
        />
        <NavItem
          to={Route.Tasks}
          label="Tasks"
          collapsed={collapsed}
          index={1}
          iconRef={layersRef}
          icon={<LayersIcon ref={layersRef} size={18} />}
        />
        <NavItem
          to={Route.Pipelines}
          label="Pipelines"
          collapsed={collapsed}
          index={2}
          iconRef={zapRef}
          icon={<ZapIcon ref={zapRef} size={18} />}
        />
        <NavItem
          to={Route.PullRequests}
          label="Pull Requests"
          collapsed={collapsed}
          index={3}
          iconRef={prRef}
          icon={<GitPullRequestIcon ref={prRef} size={18} />}
        />
        <NavItem
          to={Route.Releases}
          label="Releases"
          collapsed={collapsed}
          index={4}
          iconRef={rocketRef}
          icon={<RocketIcon ref={rocketRef} size={18} />}
        />

        <NavItem
          to={Route.Settings}
          label="Settings"
          collapsed={collapsed}
          index={5}
          iconRef={settingsRef}
          icon={<SettingsIcon ref={settingsRef} size={18} />}
        />
      </nav>

      {!collapsed && (
        <div className="mx-2 mb-2 flex gap-1.5">
          <button
            onClick={async () => {
              await notify({ title: 'PR approved', body: 'John Doe approved "Fix login bug"' });
              setTimeout(() => { notify({ title: 'Pipeline failed', body: 'Build #1234 failed' }); }, 1000);
              setTimeout(() => { notify({ title: 'Mentioned in work item', body: 'Jane mentioned you in "API refactor"' }); }, 2000);
            }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border-subtle px-2 py-1.5 text-[10px] text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            <BellRing size={12} />
            Notify
          </button>
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-error/30 px-2 py-1.5 text-[10px] text-error/70 transition-colors hover:bg-error/10 hover:text-error"
            >
              <Trash2 size={12} />
              Clear Cache
            </button>
          )}
        </div>
      )}

      {!collapsed && <SidebarGame />}
    </aside>
  );
});
