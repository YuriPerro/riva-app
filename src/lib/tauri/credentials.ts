import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';

export const credentials = {
  save: (orgUrl: string, pat: string) => invoke<void>(TauriCommand.SaveCredentials, { orgUrl, pat }),

  load: async (): Promise<{ orgUrl: string; pat: string } | null> => {
    try {
      const raw = await invoke<{ org_url: string; pat: string } | null>(TauriCommand.LoadCredentials);
      if (!raw) return null;
      return { orgUrl: raw.org_url, pat: raw.pat };
    } catch {
      return null;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await invoke<void>(TauriCommand.ClearCredentials);
    } catch {
      // file may not exist yet
    }
  },
};
