import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamSwitcher } from '@/components/layout/team-switcher';

function useSyncTimeLabel(timestamp: number): string {
  const { t } = useTranslation('common');
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return t('sync.justNow');
  if (seconds < 60) return t('sync.secondsAgo', { count: seconds });
  const minutes = Math.floor(seconds / 60);
  return t('sync.minutesAgo', { count: minutes });
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [lastSync, setLastSync] = useState(Date.now);
  const syncLabel = useSyncTimeLabel(lastSync);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const isUpdateEvent = event.type === 'updated';
      const isSuccessEventType = isUpdateEvent && event.action.type === 'success';
      const isDashboardQuery = event.query.queryKey[0] === 'dashboard';

      if (isUpdateEvent && isSuccessEventType && isDashboardQuery) setLastSync(Date.now());
    });
    return unsubscribe;
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setLastSync(Date.now());
    queryClient.invalidateQueries();
    setTimeout(() => setSpinning(false), 800);
  }, [spinning, queryClient]);

  return (
    <div className="flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        <TeamSwitcher />
        {actions}
        <button
          onClick={handleRefresh}
          className={cn(
            'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors',
            'text-fg-muted hover:bg-elevated hover:text-fg',
          )}
        >
          <RefreshCw size={13} className={cn(spinning && 'animate-spin')} />
        </button>
        <span className="text-[10px] text-fg-disabled">{syncLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <h2 className="text-4xl font-black text-fg">{title}</h2>
          {subtitle && <p className="text-[12px] text-fg-muted pr-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
