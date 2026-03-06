import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mapWorkItemType, mapWorkItemStatus } from '@/utils/mappers';
import { getWorkItemTheme } from '@/utils/work-item-theme';
import type { RelatedItemsProps, DisplayRelatedItem } from '../types';

function RelatedRow(props: { item: DisplayRelatedItem; onSelect: (id: number) => void }) {
  const { item, onSelect } = props;
  const theme = getWorkItemTheme(mapWorkItemType(item.workItemType));
  const Icon = theme.icon;
  const status = mapWorkItemStatus(item.state);

  const statusColors: Record<string, string> = {
    todo: 'text-fg-disabled',
    'in-progress': 'text-info',
    'in-review': 'text-warning',
    done: 'text-success',
  };

  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
        'hover:bg-elevated',
      )}
    >
      <Icon size={12} className={cn('shrink-0', theme.className)} />
      <span className="shrink-0 font-mono text-[11px] text-fg-disabled">#{item.id}</span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-fg-secondary group-hover:text-fg">
        {item.title}
      </span>
      <span className={cn('shrink-0 text-[10px]', statusColors[status] ?? 'text-fg-disabled')}>
        {item.state}
      </span>
      <ChevronRight size={10} className="shrink-0 text-fg-disabled opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function RelatedItems(props: RelatedItemsProps) {
  const { parent, children, onSelect } = props;

  const hasParent = parent !== null;
  const hasChildren = children.length > 0;

  if (!hasParent && !hasChildren) return null;

  return (
    <div className="space-y-3">
      {hasParent && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <ArrowUpRight size={11} />
            Parent
          </div>
          <RelatedRow item={parent} onSelect={onSelect} />
        </div>
      )}

      {hasChildren && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <ChevronRight size={11} />
            Children
            <span className="font-normal normal-case tracking-normal text-fg-disabled">({children.length})</span>
          </div>
          <div className="flex flex-col">
            {children.map((child) => (
              <RelatedRow key={child.id} item={child} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
