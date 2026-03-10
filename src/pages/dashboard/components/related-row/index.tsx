import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { mapWorkItemType, mapWorkItemStatus, getStateI18nKey } from '@/utils/mappers';
import { getWorkItemTheme } from '@/utils/work-item-theme';
import type { RelatedRowProps } from './types';

const statusColors: Record<string, string> = {
  todo: 'text-fg-disabled',
  'in-progress': 'text-info',
  'in-review': 'text-warning',
  done: 'text-success',
};

export function RelatedRow(props: RelatedRowProps) {
  const { item, onSelect } = props;
  const { t } = useTranslation('common');
  const theme = getWorkItemTheme(mapWorkItemType(item.workItemType));
  const Icon = theme.icon;
  const status = mapWorkItemStatus(item.state);

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
        {t(getStateI18nKey(item.state))}
      </span>
      <ChevronRight size={10} className="shrink-0 text-fg-disabled opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
