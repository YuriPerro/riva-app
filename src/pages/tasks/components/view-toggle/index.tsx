import { List, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewToggleProps } from './types';

export function ViewToggle(props: ViewToggleProps) {
  const { viewMode, onChange } = props;

  return (
    <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
      <button
        onClick={() => onChange('list')}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-sm p-1 transition-colors',
          viewMode === 'list' ? 'bg-elevated text-fg' : 'text-fg-disabled hover:text-fg-muted',
        )}
      >
        <List size={14} />
      </button>
      <button
        onClick={() => onChange('kanban')}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-sm p-1 transition-colors',
          viewMode === 'kanban' ? 'bg-elevated text-fg' : 'text-fg-disabled hover:text-fg-muted',
        )}
      >
        <Kanban size={14} />
      </button>
    </div>
  );
}
