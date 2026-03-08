import { useNotificationSettingsStore } from '@/store/notifications';
import type { PollingInterval } from '@/types/notifications';
import type { PollingIntervalOption } from './types';

const POLLING_INTERVAL_OPTIONS: PollingIntervalOption[] = [
  { value: 'off', label: 'Disabled' },
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 30, label: '30 min' },
];

export function useNotificationsSettings() {
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
    intervalOptions: POLLING_INTERVAL_OPTIONS,
    handleIntervalChange,
    setPrReviewEnabled,
    setPipelineFailedEnabled,
    setWorkItemMentionEnabled,
  };
}
