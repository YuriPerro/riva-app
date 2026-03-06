import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TypeIcon } from '../type-icon';
import type { TransitionGroupViewProps } from '../types';

export function TransitionGroupView(props: TransitionGroupViewProps) {
  const { group } = props;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
        {group.isDone ? (
          <CheckCircle2 size={10} className="text-success" />
        ) : (
          <ArrowRight size={9} className="text-fg-disabled" />
        )}
        <span className={cn('font-medium', group.isDone && 'text-success')}>{group.toState}</span>
        <span className="text-fg-disabled">({group.items.length})</span>
      </div>
      <div className="flex flex-col gap-1 pl-4">
        {group.items.map((t) => (
          <div key={t.workItemId} className="flex items-center gap-1.5 text-[12px]">
            <TypeIcon type={t.workItemType} />
            <span className="shrink-0 font-mono text-[11px] text-fg-disabled">#{t.workItemId}</span>
            <span className="min-w-0 text-fg-secondary">{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
