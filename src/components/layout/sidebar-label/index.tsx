import type { SidebarLabelProps } from './types';

export function SidebarLabel(props: SidebarLabelProps) {
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
