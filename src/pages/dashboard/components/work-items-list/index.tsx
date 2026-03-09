import { useMemo } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Route } from '@/types/routes';
import { getWorkItemTheme } from '@/utils/work-item-theme';
import type { WorkItemStatus } from '@/types/work-item';
import type { WorkItemsListProps } from './types';

export function WorkItemsList(props: WorkItemsListProps) {
  const { items, onSelect } = props;
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'common']);

  const statusConfig: Record<WorkItemStatus, { label: string; className: string }> = useMemo(() => ({
    todo: { label: t('common:status.todo'), className: 'text-fg-disabled' },
    'in-progress': { label: t('common:status.inProgress'), className: 'text-info' },
    'in-review': { label: t('common:status.inReview'), className: 'text-warning' },
    done: { label: t('common:status.done'), className: 'text-success' },
  }), [t]);

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">{t('dashboard:workItems.title')}</span>
        <button
          onClick={() => navigate(Route.Tasks)}
          className="flex cursor-pointer items-center gap-1 text-[11px] text-fg-disabled transition-colors hover:text-fg-secondary"
        >
          {t('common:actions.viewAll')} <ArrowRight size={10} />
        </button>
      </div>

      <div className="flex flex-col max-h-[300px] overflow-y-auto">
        {items.map((item) => {
          const itemTheme = getWorkItemTheme(item.type);
          const Icon = itemTheme.icon;
          const status = statusConfig[item.status];

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors',
                'hover:bg-elevated cursor-pointer',
              )}
            >
              <Icon size={13} className={cn('shrink-0 mt-0.5 self-start', itemTheme.className)} />

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-fg-secondary group-hover:text-fg">{item.title}</span>
                {item.parentTitle && item.parentType && (
                  <span className="flex items-center gap-1 truncate text-[10px] text-fg-disabled">
                    {(() => {
                      const parentTheme = getWorkItemTheme(item.parentType!);
                      const ParentIcon = parentTheme.icon;
                      return <ParentIcon size={9} className={parentTheme.className} />;
                    })()}
                    {item.parentTitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[11px]', status.className)}>{status.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[9px] font-medium text-fg-muted">
                  {item.assigneeInitials}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openUrl(item.url);
                  }}
                  className="cursor-pointer opacity-0 group-hover:opacity-100 text-fg-disabled hover:text-fg-secondary transition-all"
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
}
