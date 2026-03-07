import { cn } from '@/lib/utils';
import { useLoadingState } from './use-loading-state';
import type { LoadingStateProps } from './types';

export function LoadingState(props: LoadingStateProps) {
  const { icon, title, phrases, compact } = props;
  const { currentIndex, isVisible } = useLoadingState(phrases.length);

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        compact ? 'py-8' : 'flex-1',
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="animate-pulse text-fg-muted">{icon}</div>
        <span className="text-[13px] text-fg-secondary">{title}</span>
        <span
          className={cn(
            'text-[11px] italic text-fg-disabled transition-opacity duration-300',
            isVisible ? 'opacity-100' : 'opacity-0',
          )}
        >
          {phrases[currentIndex]}
        </span>
      </div>
    </div>
  );
}
