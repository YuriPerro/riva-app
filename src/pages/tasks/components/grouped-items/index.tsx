import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWorkItemTheme } from '@/utils/work-item-theme';
import type { TaskItem, WorkItemStatus } from '../../use-tasks';
import type { GroupedItemsProps } from './types';

const STATUS_COLOR: Record<WorkItemStatus, string> = {
  todo: 'text-fg-disabled',
  'in-progress': 'text-info',
  'in-review': 'text-warning',
  done: 'text-success',
};

const STATUS_DOT: Record<WorkItemStatus, string> = {
  todo: 'bg-fg-disabled',
  'in-progress': 'bg-info',
  'in-review': 'bg-warning',
  done: 'bg-success',
};

const STATUS_LABEL: Record<WorkItemStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
};

export function GroupedItems(props: GroupedItemsProps) {
  const { items, onSelect, openItem } = props;

  const groups = new Map<string, TaskItem[]>();
  for (const item of items) {
    const key = item.iterationPath ?? 'No Sprint';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => {
    if (a === 'No Sprint') return 1;
    if (b === 'No Sprint') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-4 pb-2">
      {sorted.map(([group, groupItems]) => {
        const displayGroup = group.split('\\').pop() ?? group;

        return (
          <div key={group}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
                {displayGroup}
              </span>
              <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
                {groupItems.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {groupItems.map((item, idx) => {
                const itemTheme = getWorkItemTheme(item.type);
                const Icon = itemTheme.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      'group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated',
                      idx !== groupItems.length - 1 && 'border-b border-border',
                    )}
                  >
                    <Icon size={13} className={cn('shrink-0', itemTheme.className)} />

                    <span className="shrink-0 text-[11px] tabular-nums text-fg-disabled">
                      #{item.id}
                    </span>

                    <span className="flex-1 truncate text-[13px] text-fg-secondary group-hover:text-fg">
                      {item.title}
                    </span>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[item.status])} />
                        <span className={cn('text-[11px]', STATUS_COLOR[item.status])}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>

                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-disabled">
                        {item.rawType}
                      </span>

                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
                        {item.assigneeInitials}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openItem(item.url);
                        }}
                        className="cursor-pointer opacity-0 transition-all text-fg-disabled hover:text-fg-secondary group-hover:opacity-100"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
