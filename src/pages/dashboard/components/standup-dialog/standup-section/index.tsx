import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StandupSectionProps } from '../types';

export function StandupSection(props: StandupSectionProps) {
  const { label, color, children, empty } = props;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Circle size={6} className={cn('fill-current', color)} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      {empty ? (
        <span className="pl-4 text-[12px] text-fg-disabled">No activity</span>
      ) : (
        <div className="flex flex-col gap-3 pl-4">{children}</div>
      )}
    </div>
  );
}
