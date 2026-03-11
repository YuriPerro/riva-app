import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { getWorkItemTheme } from '@/utils/work-item-theme';
import type { KanbanCardProps } from './types';

export function KanbanCard(props: KanbanCardProps) {
  const { item, onSelect, openItem, isDragOverlay } = props;
  const itemTheme = getWorkItemTheme(item.type);
  const Icon = itemTheme.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onSelect(item.id)}
      className={cn(
        'group flex cursor-grab flex-col gap-1.5 rounded-lg border border-border bg-surface p-2.5 transition-colors',
        'hover:border-border-subtle hover:bg-elevated',
        isDragging && !isDragOverlay && 'invisible',
        isDragOverlay && 'rotate-2 shadow-lg shadow-black/20',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={cn('shrink-0', itemTheme.className)} />
          <span className="text-[10px] tabular-nums text-fg-disabled">#{item.id}</span>
        </div>
        {!isDragOverlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openItem(item.url);
            }}
            className="cursor-pointer text-fg-disabled opacity-0 transition-all hover:text-fg-secondary group-hover:opacity-100"
          >
            <ExternalLink size={11} />
          </button>
        )}
      </div>

      <span className="line-clamp-2 text-[12px] leading-snug text-fg-secondary group-hover:text-fg">
        {item.title}
      </span>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-fg-disabled">{item.rawState}</span>
          {item.childTasks.total > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-fg-disabled">
              <CheckCircle2 size={10} className={item.childTasks.done === item.childTasks.total ? 'text-success' : ''} />
              {item.childTasks.done}/{item.childTasks.total}
            </span>
          )}
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
          {item.assigneeInitials}
        </span>
      </div>
    </div>
  );
}
