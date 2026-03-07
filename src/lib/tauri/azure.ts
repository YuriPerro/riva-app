import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import type {
  Project,
  Team,
  WorkItem,
  WorkItemDetail,
  WorkItemTypeState,
  PipelineDefinition,
  PipelineRun,
  SprintIteration,
  PullRequest,
  StandupData,
  RelatedWorkItem,
  ReleaseDefinition,
  Release,
  UserActivitySummary,
} from '@/types/azure';

export const azure = {
  getProjects: () => invoke<Project[]>(TauriCommand.GetProjects),

  getTeams: (project: string) => invoke<Team[]>(TauriCommand.GetTeams, { project }),

  getTasks: (project: string, team?: string) =>
    invoke<WorkItem[]>(TauriCommand.GetTasks, { project, team: team ?? null }),

  getRecentPipelines: (project: string, teamId?: string) =>
    invoke<PipelineRun[]>(TauriCommand.GetRecentPipelines, { project, teamId: teamId ?? null }),

  getPipelineDefinitions: (project: string) =>
    invoke<PipelineDefinition[]>(TauriCommand.GetPipelineDefinitions, { project }),

  getPullRequests: (project: string) => invoke<PullRequest[]>(TauriCommand.GetPullRequests, { project }),

  getCurrentSprint: (project: string, team?: string) =>
    invoke<SprintIteration | null>(TauriCommand.GetCurrentSprint, { project, team: team ?? null }),

  getWorkItemDetail: (project: string, id: number) =>
    invoke<WorkItemDetail>(TauriCommand.GetWorkItemDetail, { project, id }),

  getWorkItemTypeStates: (project: string, workItemType: string) =>
    invoke<WorkItemTypeState[]>(TauriCommand.GetWorkItemTypeStates, { project, workItemType }),

  updateWorkItemState: (project: string, id: number, newState: string) =>
    invoke<WorkItemDetail>(TauriCommand.UpdateWorkItemState, { project, id, newState }),

  reviewPullRequest: (project: string, repoId: string, prId: number, vote: number) =>
    invoke<void>(TauriCommand.ReviewPullRequest, { project, repoId, prId, vote }),

  getStandupData: (project: string, team?: string, lookbackDays?: number) =>
    invoke<StandupData>(TauriCommand.GetStandupData, {
      project,
      team: team ?? null,
      lookbackDays: lookbackDays ?? 1,
    }),

  getWorkItemSummaries: (project: string, ids: number[]) =>
    invoke<RelatedWorkItem[]>(TauriCommand.GetWorkItemSummaries, { project, ids }),

  getMyUniqueName: () => invoke<string>(TauriCommand.GetMyUniqueName),

  getReleaseDefinitions: (project: string) =>
    invoke<ReleaseDefinition[]>(TauriCommand.GetReleaseDefinitions, { project }),

  getReleases: (project: string, definitionIds: number[]) =>
    invoke<Release[]>(TauriCommand.GetReleases, { project, definitionIds }),

  updateReleaseApproval: (project: string, approvalId: number, status: string, comments?: string) =>
    invoke<void>(TauriCommand.UpdateReleaseApproval, {
      project,
      approvalId,
      status,
      comments: comments ?? '',
    }),

  getUserActivityDates: (project: string, team?: string, lookbackDays?: number) =>
    invoke<UserActivitySummary>(TauriCommand.GetUserActivityDates, {
      project,
      team: team ?? null,
      lookbackDays: lookbackDays ?? null,
    }),
};
