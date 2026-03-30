import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import { demoInvoke } from './demo-invoke';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const safeInvoke = isDemo ? demoInvoke : invoke;

export const credentials = {
  save: (orgUrl: string, pat: string) => safeInvoke<void>(TauriCommand.SaveCredentials, { orgUrl, pat }),

  load: async (): Promise<{ orgUrl: string; pat: string } | null> => {
    try {
      const raw = await safeInvoke<{ org_url: string; pat: string } | null>(TauriCommand.LoadCredentials);
      if (!raw) return null;
      return { orgUrl: raw.org_url, pat: raw.pat };
    } catch {
      return null;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await safeInvoke<void>(TauriCommand.ClearCredentials);
    } catch {
      // file may not exist yet
    }
  },
};
