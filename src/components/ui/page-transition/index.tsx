import { cn } from '@/lib/utils';
import { usePageTransition } from './use-page-transition';
import type { PageTransitionProps } from './types';

export function PageTransition(props: PageTransitionProps) {
  const { isLoading, loadingContent, children } = props;
  const { phase } = usePageTransition(isLoading);

  const showLoading = phase === 'loading' || phase === 'fading-out';

  if (showLoading) {
    return (
      <div
        className={cn(
          'flex flex-1 transition-opacity duration-300 ease-out',
          phase === 'fading-out' ? 'opacity-0' : 'opacity-100',
        )}
      >
        {loadingContent}
      </div>
    );
  }

  return (
    <div className="flex flex-1 animate-in fade-in duration-200">
      {children}
    </div>
  );
}
