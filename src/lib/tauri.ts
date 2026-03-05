import { invoke } from "@tauri-apps/api/core";
import { TauriCommand } from "./commands";

export { TauriCommand } from "./commands";

export type {
  Project,
  WorkItem,
  WorkItemFields,
  PipelineDefinition,
  PipelineRun,
  SprintAttributes,
  SprintIteration,
} from "@/types/azure";

import type {
  Project,
  WorkItem,
  PipelineRun,
  SprintIteration,
} from "@/types/azure";

// ─── Credentials ──────────────────────────────────────────────────────────────

export const credentials = {
  save: (orgUrl: string, pat: string) =>
    invoke<void>(TauriCommand.SaveCredentials, { orgUrl, pat }),

  load: async (): Promise<{ orgUrl: string; pat: string } | null> => {
    try {
      const raw = await invoke<{ org_url: string; pat: string } | null>(
        TauriCommand.LoadCredentials
      );
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

// ─── Session ──────────────────────────────────────────────────────────────────

export const session = {
  validate: (orgUrl: string, pat: string) =>
    invoke<void>(TauriCommand.ValidateCredentials, { orgUrl, pat }),

  init: (orgUrl: string, pat: string) =>
    invoke<void>(TauriCommand.InitSession, { orgUrl, pat }),

  exists: () =>
    invoke<boolean>(TauriCommand.HasSession),

  clear: () =>
    invoke<void>(TauriCommand.ClearSession),
};

// ─── Azure DevOps ─────────────────────────────────────────────────────────────

export const azure = {
  getProjects: () =>
    invoke<Project[]>(TauriCommand.GetProjects),

  getMyWorkItems: (project: string) =>
    invoke<WorkItem[]>(TauriCommand.GetMyWorkItems, { project }),

  getRecentPipelines: (project: string) =>
    invoke<PipelineRun[]>(TauriCommand.GetRecentPipelines, { project }),

  getCurrentSprint: (project: string) =>
    invoke<SprintIteration | null>(TauriCommand.GetCurrentSprint, { project }),
};
