import { GitPullRequest, CircleX, AtSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationsSettings } from '@/components/ui/notifications-settings/use-notifications-settings';

const CHANNELS = [
  { key: 'prReview' as const, icon: GitPullRequest, label: 'PR reviews', description: 'When your PR is approved or rejected' },
  { key: 'pipelineFailed' as const, icon: CircleX, label: 'Pipeline failures', description: 'Build or release failures' },
  { key: 'workItemMention' as const, icon: AtSign, label: 'Mentions', description: 'When you\'re tagged in work items' },
];

export function SetupNotifications() {
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
        <span className="text-[12px] text-fg-secondary">Check for updates every</span>
        <select
          value={String(pollingInterval)}
          onChange={(e) => handleIntervalChange(e.target.value)}
          className="h-7 cursor-pointer rounded-md border border-border bg-base px-2 text-[12px] text-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {intervalOptions.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isPollingActive && (
        <div className="flex flex-col overflow-hidden rounded-md border border-border">
          {CHANNELS.map((channel, i) => {
            const { checked, onChange } = toggles[channel.key];
            const Icon = channel.icon;
            return (
              <label
                key={channel.key}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-elevated ${i > 0 ? 'border-t border-border-subtle' : ''}`}
              >
                <Icon size={14} className="shrink-0 text-fg-muted" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12px] font-medium text-fg-secondary">{channel.label}</span>
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
