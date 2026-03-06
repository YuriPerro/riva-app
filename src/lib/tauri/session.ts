import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';

export const session = {
  validate: (orgUrl: string, pat: string) => invoke<void>(TauriCommand.ValidateCredentials, { orgUrl, pat }),

  init: (orgUrl: string, pat: string) => invoke<void>(TauriCommand.InitSession, { orgUrl, pat }),

  exists: () => invoke<boolean>(TauriCommand.HasSession),

  clear: () => invoke<void>(TauriCommand.ClearSession),
};
