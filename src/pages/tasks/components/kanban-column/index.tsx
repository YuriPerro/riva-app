import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanCard } from '../kanban-card';
import type { KanbanColumnProps } from './types';

export function KanbanColumn(props: KanbanColumnProps) {
  const { rawState, color, items, onSelect, openItem, disabled } = props;

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${rawState}`,
    data: { rawState },
  });

  const showDropHighlight = isOver && !disabled;

  return (
    <div className="flex min-w-[250px] flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn('h-2 w-2 rounded-full', color)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{rawState}</span>
        <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-disabled">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-lg p-1.5 transition-colors',
          showDropHighlight ? 'bg-accent/5 shadow-[inset_0_0_16px_0_var(--color-accent-muted)] ring-1 ring-accent/30' : 'bg-base',
        )}
      >
        {items.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <span className="text-[11px] text-fg-disabled">—</span>
          </div>
        )}
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} onSelect={onSelect} openItem={openItem} />
        ))}
      </div>
    </div>
  );
}
