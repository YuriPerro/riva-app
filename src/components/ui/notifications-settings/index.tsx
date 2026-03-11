import { useTranslation } from 'react-i18next';
import { Bell, GitPullRequest, CircleX, AtSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DefinitionPicker } from './pipeline-picker';
import { useNotificationsSettings } from './use-notifications-settings';

function ChannelRow(props: { icon: React.ElementType; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { icon: Icon, label, description, checked, onChange } = props;
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-elevated">
      <Icon className="size-3.5 shrink-0 text-fg-muted" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium text-fg">{label}</span>
        <span className="text-[11px] text-fg-disabled">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function NotificationsSettings() {
  const { t } = useTranslation('settings');
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
    pipelineDefinitions,
    monitoredPipelineIds,
    monitorAllPipelines,
    togglePipelineMonitored,
    toggleAllPipelines,
    releaseDefinitions,
    monitoredReleaseIds,
    monitorAllReleases,
    toggleReleaseMonitored,
    toggleAllReleases,
  } = useNotificationsSettings();

  const showPipelinePicker = pipelineFailedEnabled && pipelineDefinitions.length > 0;
  const showReleasePicker = pipelineFailedEnabled && releaseDefinitions.length > 0;

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
          <ChannelRow
            icon={GitPullRequest}
            label={t('notifications.prReviews')}
            description={t('notifications.prReviewsDescription')}
            checked={prReviewEnabled}
            onChange={setPrReviewEnabled}
          />

          <ChannelRow
            icon={CircleX}
            label={t('notifications.pipelineFailed')}
            description={t('notifications.pipelineFailedDescription')}
            checked={pipelineFailedEnabled}
            onChange={setPipelineFailedEnabled}
          />

          {showPipelinePicker && (
            <DefinitionPicker
              definitions={pipelineDefinitions}
              monitoredIds={monitoredPipelineIds}
              monitorAll={monitorAllPipelines}
              onToggle={togglePipelineMonitored}
              onToggleAll={toggleAllPipelines}
              allLabel={t('notifications.allPipelines')}
              selectedLabel={(count) => t('notifications.pipelinesSelected', { count })}
              searchPlaceholder={t('notifications.searchPipelines')}
              noMatchLabel={t('notifications.noMatchingPipelines')}
            />
          )}

          {showReleasePicker && (
            <DefinitionPicker
              definitions={releaseDefinitions}
              monitoredIds={monitoredReleaseIds}
              monitorAll={monitorAllReleases}
              onToggle={toggleReleaseMonitored}
              onToggleAll={toggleAllReleases}
              allLabel={t('notifications.allReleases')}
              selectedLabel={(count) => t('notifications.releasesSelected', { count })}
              searchPlaceholder={t('notifications.searchReleases')}
              noMatchLabel={t('notifications.noMatchingReleases')}
            />
          )}

          <ChannelRow
            icon={AtSign}
            label={t('notifications.mentions')}
            description={t('notifications.mentionsDescription')}
            checked={workItemMentionEnabled}
            onChange={setWorkItemMentionEnabled}
          />
        </div>
      )}
    </div>
  );
}
