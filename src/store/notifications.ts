import { create } from 'zustand';
import type { PollingInterval } from '@/types/notifications';

type NotificationSettingsState = {
  pollingInterval: PollingInterval;
  prReviewEnabled: boolean;
  pipelineFailedEnabled: boolean;
  workItemMentionEnabled: boolean;
  setPollingInterval: (interval: PollingInterval) => void;
  setPrReviewEnabled: (enabled: boolean) => void;
  setPipelineFailedEnabled: (enabled: boolean) => void;
  setWorkItemMentionEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = 'forge_notification_settings';

function loadSettings(): Pick<NotificationSettingsState, 'pollingInterval' | 'prReviewEnabled' | 'pipelineFailedEnabled' | 'workItemMentionEnabled'> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        pollingInterval: parsed.pollingInterval ?? 5,
        prReviewEnabled: parsed.prReviewEnabled ?? true,
        pipelineFailedEnabled: parsed.pipelineFailedEnabled ?? true,
        workItemMentionEnabled: parsed.workItemMentionEnabled ?? true,
      };
    } catch (e) {
      console.error(e);
    }
  }
  return {
    pollingInterval: 5,
    prReviewEnabled: true,
    pipelineFailedEnabled: true,
    workItemMentionEnabled: true,
  };
}

function persistSettings(state: Pick<NotificationSettingsState, 'pollingInterval' | 'prReviewEnabled' | 'pipelineFailedEnabled' | 'workItemMentionEnabled'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useNotificationSettingsStore = create<NotificationSettingsState>((set, get) => ({
  ...loadSettings(),

  setPollingInterval: (interval) => {
    set({ pollingInterval: interval });
    persistSettings({ ...get(), pollingInterval: interval });
  },

  setPrReviewEnabled: (enabled) => {
    set({ prReviewEnabled: enabled });
    persistSettings({ ...get(), prReviewEnabled: enabled });
  },

  setPipelineFailedEnabled: (enabled) => {
    set({ pipelineFailedEnabled: enabled });
    persistSettings({ ...get(), pipelineFailedEnabled: enabled });
  },

  setWorkItemMentionEnabled: (enabled) => {
    set({ workItemMentionEnabled: enabled });
    persistSettings({ ...get(), workItemMentionEnabled: enabled });
  },
}));
