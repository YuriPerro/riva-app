import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENV_STATUS_STYLES } from '../../constants';
import type { EnvironmentDotProps } from './types';

export function EnvironmentDot(props: EnvironmentDotProps) {
  const { name, status } = props;
  const styles = ENV_STATUS_STYLES[status];
  const isRunning = status === 'inProgress';

  return (
    <div className="flex items-center gap-1.5">
      {isRunning ? (
        <Loader2 size={8} className={cn('animate-spin', styles.text)} />
      ) : (
        <span className={cn('h-2 w-2 shrink-0 rounded-full', styles.dot)} />
      )}
      <span className={cn('text-[11px]', styles.text)}>{name}</span>
    </div>
  );
}
