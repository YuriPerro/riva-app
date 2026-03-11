import { memo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
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
  const { t } = useTranslation('common');
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

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
                {t('labels.beta')}
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
          label={t('nav.dashboard')}
          collapsed={collapsed}
          index={0}
          iconRef={homeRef}
          icon={<HomeIcon ref={homeRef} size={18} />}
        />
        <NavItem
          to={Route.Tasks}
          label={t('nav.tasks')}
          collapsed={collapsed}
          index={1}
          iconRef={layersRef}
          icon={<LayersIcon ref={layersRef} size={18} />}
        />
        <NavItem
          to={Route.Pipelines}
          label={t('nav.pipelines')}
          collapsed={collapsed}
          index={2}
          iconRef={zapRef}
          icon={<ZapIcon ref={zapRef} size={18} />}
        />
        <NavItem
          to={Route.PullRequests}
          label={t('nav.pullRequests')}
          collapsed={collapsed}
          index={3}
          iconRef={prRef}
          icon={<GitPullRequestIcon ref={prRef} size={18} />}
        />
        <NavItem
          to={Route.Releases}
          label={t('nav.releases')}
          collapsed={collapsed}
          index={4}
          iconRef={rocketRef}
          icon={<RocketIcon ref={rocketRef} size={18} />}
        />

        <NavItem
          to={Route.Settings}
          label={t('nav.settings')}
          collapsed={collapsed}
          index={5}
          iconRef={settingsRef}
          icon={<SettingsIcon ref={settingsRef} size={18} />}
        />
      </nav>

      {!collapsed && <SidebarGame />}

      {version && (
        <div className="flex w-full items-center justify-center pt-2">
          <span className={cn('text-[11px] text-fg-disabled/50', collapsed && 'px-0 text-center')}>
            {collapsed ? `v${version}` : `Riva v${version}`}
          </span>
        </div>
      )}
    </aside>
  );
});
