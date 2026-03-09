import { CheckCircle2, Loader2, MinusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeAgo } from '@/components/ui/time-ago';
import type { RunRowProps, StatusConfigMap } from './types';

const STATUS_CONFIG: StatusConfigMap = {
  running: { icon: Loader2, className: 'text-info', spin: true, dot: 'bg-info' },
  succeeded: { icon: CheckCircle2, className: 'text-success', dot: 'bg-success' },
  failed: { icon: XCircle, className: 'text-error', dot: 'bg-error' },
  cancelled: { icon: MinusCircle, className: 'text-fg-muted', dot: 'bg-fg-muted' },
};

export function RunRow(props: RunRowProps) {
  const { run, onClick } = props;
  const { icon: Icon, className, spin, dot } = STATUS_CONFIG[run.status];

  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
    >
      <Icon size={13} className={cn('shrink-0', className, spin && 'animate-spin')} />

      <span className="w-24 shrink-0 font-mono text-[11px] text-fg-disabled">#{run.buildNumber}</span>

      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-mono text-[12px] text-fg-secondary group-hover:text-fg">{run.branch}</span>
        {run.title && <span className="truncate text-[11px] text-fg-disabled">{run.title}</span>}
      </div>

      <div className="flex w-24 shrink-0 items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
        <span className={cn('text-[11px]', className)}>{run.status.charAt(0).toUpperCase() + run.status.slice(1)}</span>
      </div>

      <span className="w-14 shrink-0 text-right text-[11px] text-fg-disabled">{run.duration}</span>

      <TimeAgo date={run.agoDate} className="w-16 shrink-0 text-right text-[11px] text-fg-disabled" />
    </button>
  );
}
