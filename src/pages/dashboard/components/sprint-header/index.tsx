import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SprintHeaderProps } from './types';

export function SprintHeader(props: SprintHeaderProps) {
  const { sprint } = props;
  const { t } = useTranslation(['dashboard', 'common']);

  const statusConfig = useMemo(() => ({
    'on-track': { label: t('common:status.onTrack'), badgeClass: 'bg-success/15 text-success border-success/20' },
    'at-risk': { label: t('common:status.atRisk'), badgeClass: 'bg-warning/15 text-warning border-warning/20' },
    'off-track': { label: t('common:status.offTrack'), badgeClass: 'bg-error/15 text-error border-error/20' },
  }), [t]);

  if (!sprint) {
    return <div className="flex items-center text-[12px] text-fg-disabled">{t('dashboard:sprint.noActiveSprint')}</div>;
  }

  const status = statusConfig[sprint.status];
  const progressPercent =
    sprint.totalDays > 0
      ? Math.min(100, Math.max(0, ((sprint.totalDays - sprint.daysRemaining) / sprint.totalDays) * 100))
      : 0;

  const fillColor: Record<string, string> = {
    'on-track': 'bg-success',
    'at-risk': 'bg-warning',
    'off-track': 'bg-error',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[12px] text-fg-muted">
        <span className="text-fg-secondary">{sprint.name}</span>
        <span>·</span>
        <span>{sprint.daysRemaining} {t('dashboard:sprint.daysRemaining')}</span>
        <span>·</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
            status.badgeClass,
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border">
        <div
          className={cn('h-full origin-left rounded-full', fillColor[sprint.status])}
          style={{
            width: `${progressPercent}%`,
            animation: 'bar-fill 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}
        />
      </div>
    </div>
  );
}
