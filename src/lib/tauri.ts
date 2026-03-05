import { invoke } from "@tauri-apps/api/core";
import { TauriCommand } from "@/types/commands";
import type {
  Project,
  Team,
  WorkItem,
  WorkItemDetail,
  WorkItemTypeState,
  PipelineRun,
  SprintIteration,
  PullRequest,
} from "@/types/azure";

// ============================================================
// Credentials
// ============================================================

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

// ============================================================
// Session
// ============================================================

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

// ============================================================
// Azure DevOps
// ============================================================

export const azure = {
  getProjects: () =>
    invoke<Project[]>(TauriCommand.GetProjects),

  getTeams: (project: string) =>
    invoke<Team[]>(TauriCommand.GetTeams, { project }),

  getMyWorkItems: (project: string, team?: string) =>
    invoke<WorkItem[]>(TauriCommand.GetMyWorkItems, { project, team: team ?? null }),

  getRecentPipelines: (project: string, teamId?: string) =>
    invoke<PipelineRun[]>(TauriCommand.GetRecentPipelines, { project, teamId: teamId ?? null }),

  getPullRequests: (project: string) =>
    invoke<PullRequest[]>(TauriCommand.GetPullRequests, { project }),

  getCurrentSprint: (project: string, team?: string) =>
    invoke<SprintIteration | null>(TauriCommand.GetCurrentSprint, { project, team: team ?? null }),

  getWorkItemDetail: (project: string, id: number) =>
    invoke<WorkItemDetail>(TauriCommand.GetWorkItemDetail, { project, id }),

  getWorkItemTypeStates: (project: string, workItemType: string) =>
    invoke<WorkItemTypeState[]>(TauriCommand.GetWorkItemTypeStates, { project, workItemType }),

  updateWorkItemState: (project: string, id: number, newState: string) =>
    invoke<WorkItemDetail>(TauriCommand.UpdateWorkItemState, { project, id, newState }),
};
