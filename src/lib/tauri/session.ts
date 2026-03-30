import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import { demoInvoke } from './demo-invoke';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const safeInvoke = isDemo ? demoInvoke : invoke;

export const session = {
  validate: (orgUrl: string, pat: string) => safeInvoke<void>(TauriCommand.ValidateCredentials, { orgUrl, pat }),

  init: (orgUrl: string, pat: string) => safeInvoke<void>(TauriCommand.InitSession, { orgUrl, pat }),

  exists: () => safeInvoke<boolean>(TauriCommand.HasSession),

  clear: () => safeInvoke<void>(TauriCommand.ClearSession),
};
