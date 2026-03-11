import { create } from 'zustand';
import type { PollingInterval } from '@/types/notifications';

type NotificationSettingsState = {
  pollingInterval: PollingInterval;
  prReviewEnabled: boolean;
  pipelineFailedEnabled: boolean;
  workItemMentionEnabled: boolean;
  monitorAllPipelines: boolean;
  monitoredPipelineIds: number[];
  monitorAllReleases: boolean;
  monitoredReleaseIds: number[];
  setPollingInterval: (interval: PollingInterval) => void;
  setPrReviewEnabled: (enabled: boolean) => void;
  setPipelineFailedEnabled: (enabled: boolean) => void;
  setWorkItemMentionEnabled: (enabled: boolean) => void;
  setMonitorAllPipelines: (all: boolean) => void;
  setMonitoredPipelineIds: (ids: number[]) => void;
  setMonitorAllReleases: (all: boolean) => void;
  setMonitoredReleaseIds: (ids: number[]) => void;
};

const STORAGE_KEY = 'riva_notification_settings';

type PersistedSettings = Pick<NotificationSettingsState, 'pollingInterval' | 'prReviewEnabled' | 'pipelineFailedEnabled' | 'workItemMentionEnabled' | 'monitorAllPipelines' | 'monitoredPipelineIds' | 'monitorAllReleases' | 'monitoredReleaseIds'>;

function loadSettings(): PersistedSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        pollingInterval: parsed.pollingInterval ?? 5,
        prReviewEnabled: parsed.prReviewEnabled ?? true,
        pipelineFailedEnabled: parsed.pipelineFailedEnabled ?? true,
        workItemMentionEnabled: parsed.workItemMentionEnabled ?? true,
        monitorAllPipelines: parsed.monitorAllPipelines ?? true,
        monitoredPipelineIds: Array.isArray(parsed.monitoredPipelineIds) ? parsed.monitoredPipelineIds : [],
        monitorAllReleases: parsed.monitorAllReleases ?? true,
        monitoredReleaseIds: Array.isArray(parsed.monitoredReleaseIds) ? parsed.monitoredReleaseIds : [],
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
    monitorAllPipelines: true,
    monitoredPipelineIds: [],
    monitorAllReleases: true,
    monitoredReleaseIds: [],
  };
}

function persistSettings(state: PersistedSettings) {
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

  setMonitorAllPipelines: (all) => {
    set({ monitorAllPipelines: all });
    persistSettings({ ...get(), monitorAllPipelines: all });
  },

  setMonitoredPipelineIds: (ids) => {
    set({ monitoredPipelineIds: ids });
    persistSettings({ ...get(), monitoredPipelineIds: ids });
  },

  setMonitorAllReleases: (all) => {
    set({ monitorAllReleases: all });
    persistSettings({ ...get(), monitorAllReleases: all });
  },

  setMonitoredReleaseIds: (ids) => {
    set({ monitoredReleaseIds: ids });
    persistSettings({ ...get(), monitoredReleaseIds: ids });
  },
}));
