import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import { demoInvoke } from './demo-invoke';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const safeInvoke = isDemo ? demoInvoke : invoke;

export const openai = {
  saveKey: (key: string) => safeInvoke<void>(TauriCommand.SaveOpenAiKey, { key }),

  loadKey: async (): Promise<string | null> => {
    try {
      return await safeInvoke<string | null>(TauriCommand.LoadOpenAiKey);
    } catch {
      return null;
    }
  },

  clearKey: async (): Promise<void> => {
    try {
      await safeInvoke<void>(TauriCommand.ClearOpenAiKey);
    } catch {
      // file may not exist yet
    }
  },

  generateStandup: (prompt: string) => safeInvoke<string>(TauriCommand.GenerateStandupSummary, { prompt }),
};
