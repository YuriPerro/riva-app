import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationSettingsStore } from '@/store/notifications';
import type { PollingInterval } from '@/types/notifications';
import type { PollingIntervalOption } from './types';

export function useNotificationsSettings() {
  const { t } = useTranslation('common');

  const pollingIntervalOptions: PollingIntervalOption[] = useMemo(() => [
    { value: 'off', label: t('polling.disabled') },
    { value: 1, label: t('polling.min', { count: 1 }) },
    { value: 2, label: t('polling.min', { count: 2 }) },
    { value: 5, label: t('polling.min', { count: 5 }) },
    { value: 10, label: t('polling.min', { count: 10 }) },
    { value: 30, label: t('polling.min', { count: 30 }) },
  ], [t]);
  const pollingInterval = useNotificationSettingsStore((s) => s.pollingInterval);
  const prReviewEnabled = useNotificationSettingsStore((s) => s.prReviewEnabled);
  const pipelineFailedEnabled = useNotificationSettingsStore((s) => s.pipelineFailedEnabled);
  const workItemMentionEnabled = useNotificationSettingsStore((s) => s.workItemMentionEnabled);
  const setPollingInterval = useNotificationSettingsStore((s) => s.setPollingInterval);
  const setPrReviewEnabled = useNotificationSettingsStore((s) => s.setPrReviewEnabled);
  const setPipelineFailedEnabled = useNotificationSettingsStore((s) => s.setPipelineFailedEnabled);
  const setWorkItemMentionEnabled = useNotificationSettingsStore((s) => s.setWorkItemMentionEnabled);

  const handleIntervalChange = (value: string) => {
    const parsed: PollingInterval = value === 'off' ? 'off' : (Number(value) as Exclude<PollingInterval, 'off'>);
    setPollingInterval(parsed);
  };

  const isPollingActive = pollingInterval !== 'off';

  return {
    pollingInterval,
    prReviewEnabled,
    pipelineFailedEnabled,
    workItemMentionEnabled,
    isPollingActive,
    intervalOptions: pollingIntervalOptions,
    handleIntervalChange,
    setPrReviewEnabled,
    setPipelineFailedEnabled,
    setWorkItemMentionEnabled,
  };
}
