import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, GitPullRequest, CircleX, AtSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationsSettings } from './use-notifications-settings';

export function NotificationsSettings() {
  const { t } = useTranslation('settings');

  const notificationChannels = useMemo(
    () => [
      {
        key: 'prReview' as const,
        icon: GitPullRequest,
        label: t('notifications.prReviews'),
        description: t('notifications.prReviewsDescription'),
      },
      {
        key: 'pipelineFailed' as const,
        icon: CircleX,
        label: t('notifications.pipelineFailed'),
        description: t('notifications.pipelineFailedDescription'),
      },
      {
        key: 'workItemMention' as const,
        icon: AtSign,
        label: t('notifications.mentions'),
        description: t('notifications.mentionsDescription'),
      },
    ],
    [t],
  );
  const {
    pollingInterval,
    prReviewEnabled,
    pipelineFailedEnabled,
    workItemMentionEnabled,
    isPollingActive,
    intervalOptions,
    handleIntervalChange,
    setPrReviewEnabled,
    setPipelineFailedEnabled,
    setWorkItemMentionEnabled,
  } = useNotificationsSettings();

  const toggles: Record<string, { checked: boolean; onChange: (v: boolean) => void }> = {
    prReview: { checked: prReviewEnabled, onChange: setPrReviewEnabled },
    pipelineFailed: { checked: pipelineFailedEnabled, onChange: setPipelineFailedEnabled },
    workItemMention: { checked: workItemMentionEnabled, onChange: setWorkItemMentionEnabled },
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-4 col-span-3">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-accent" />
        <span className="text-sm font-medium text-fg">{t('notifications.title')}</span>
      </div>
      <span className="mt-0.5 text-xs text-fg-muted">{t('notifications.description')}</span>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-fg-secondary">{t('notifications.pollingInterval')}</span>
        <select
          value={String(pollingInterval)}
          onChange={(e) => handleIntervalChange(e.target.value)}
          className="h-7 cursor-pointer rounded-md border border-border bg-base px-2 text-xs text-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {intervalOptions.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isPollingActive && (
        <div className="mt-3 flex flex-col gap-0.5">
          {notificationChannels.map((channel) => {
            const { checked, onChange } = toggles[channel.key];
            const Icon = channel.icon;
            return (
              <label
                key={channel.key}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-elevated"
              >
                <Icon className="size-3.5 shrink-0 text-fg-muted" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs font-medium text-fg">{channel.label}</span>
                  <span className="text-[11px] text-fg-disabled">{channel.description}</span>
                </div>
                <Switch checked={checked} onCheckedChange={onChange} />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
