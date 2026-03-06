import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip';
import { SidebarLabel } from '../sidebar-label';
import type { NavItemProps } from '../types';

const STAGGER_MS = 60;

export function NavItem(props: NavItemProps) {
  const { to, label, end, collapsed, index, iconRef, icon } = props;

  const link = (
    <NavLink
      to={to}
      end={end}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className={({ isActive }) =>
        cn(
          'flex cursor-pointer items-center rounded-md py-2 transition-colors',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-3 text-[13px]',
          isActive ? 'bg-elevated text-fg' : 'text-fg-secondary hover:bg-elevated hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('shrink-0', isActive ? 'text-fg' : 'text-fg-muted')}>{icon}</span>
          <SidebarLabel collapsed={collapsed} delay={index * STAGGER_MS}>
            {label}
          </SidebarLabel>
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip side="right">
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
