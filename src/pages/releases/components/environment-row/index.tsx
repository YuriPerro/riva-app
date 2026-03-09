import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeAgo } from '@/components/ui/time-ago';
import { ENV_STATUS_STYLES, STATUS_LABELS } from '../../constants';
import { ApprovalActions } from '../approval-actions';
import type { EnvironmentRowProps } from './types';

export function EnvironmentRow(props: EnvironmentRowProps) {
  const { name, status, lastDeployedOn, isLast, approvals, currentUserUniqueName } = props;
  const styles = ENV_STATUS_STYLES[status];
  const isRunning = status === 'inProgress';
  const isActive = status !== 'notStarted';

  return (
    <div className="relative flex items-stretch gap-3 pl-1">
      <div className="flex w-4 flex-col items-center">
        <div className="flex h-7 items-center justify-center">
          {isRunning ? (
            <div className="relative flex items-center justify-center">
              <span className="absolute h-2 w-2 animate-ripple rounded-full bg-running" />
              <Loader2 size={10} className={cn('relative animate-spin', styles.text)} />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {isActive && (
                <span className={cn('absolute h-2 w-2 animate-ripple rounded-full', styles.dot)} />
              )}
              <span className={cn('relative h-2 w-2 rounded-full', styles.dot)} />
            </div>
          )}
        </div>

        {!isLast && (
          <div className={cn('w-px flex-1 min-h-2', isActive ? styles.line : 'bg-border')} />
        )}
      </div>

      <div className="flex flex-col gap-0.5 pb-2.5">
        <span className={cn('text-[12px] font-medium', isActive ? 'text-fg' : 'text-fg-disabled')}>
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-[11px]', styles.text)}>{STATUS_LABELS[status]}</span>
          {lastDeployedOn && (
            <>
              <span className="text-[10px] text-fg-disabled">·</span>
              <TimeAgo date={lastDeployedOn} className="text-[10px] text-fg-disabled" />
            </>
          )}
        </div>
        {approvals.length > 0 && (
          <ApprovalActions
            approvals={approvals}
            currentUserUniqueName={currentUserUniqueName}
          />
        )}
      </div>
    </div>
  );
}
