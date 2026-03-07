import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';

export const openai = {
  saveKey: (key: string) => invoke<void>(TauriCommand.SaveOpenAiKey, { key }),

  loadKey: async (): Promise<string | null> => {
    try {
      return await invoke<string | null>(TauriCommand.LoadOpenAiKey);
    } catch {
      return null;
    }
  },

  clearKey: async (): Promise<void> => {
    try {
      await invoke<void>(TauriCommand.ClearOpenAiKey);
    } catch {
      // file may not exist yet
    }
  },

  generateStandup: (prompt: string) => invoke<string>(TauriCommand.GenerateStandupSummary, { prompt }),
};
