import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import { demoInvoke } from './demo-invoke';
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
  WorkItemComment,
} from '@/types/azure';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const safeInvoke = isDemo ? demoInvoke : invoke;

export const azure = {
  getProjects: () => safeInvoke<Project[]>(TauriCommand.GetProjects),

  getTeams: (project: string) => safeInvoke<Team[]>(TauriCommand.GetTeams, { project }),

  getTasks: (project: string, team?: string, onlyMine?: boolean, iterationPath?: string) =>
    safeInvoke<WorkItem[]>(TauriCommand.GetTasks, { project, team: team ?? null, onlyMine: onlyMine ?? true, iterationPath: iterationPath ?? null }),

  getRecentPipelines: (project: string, teamId?: string) =>
    safeInvoke<PipelineRun[]>(TauriCommand.GetRecentPipelines, { project, teamId: teamId ?? null }),

  getPipelineDefinitions: (project: string) =>
    safeInvoke<PipelineDefinition[]>(TauriCommand.GetPipelineDefinitions, { project }),

  getPullRequests: (project: string) => safeInvoke<PullRequest[]>(TauriCommand.GetPullRequests, { project }),

  getCurrentSprint: (project: string, team?: string) =>
    safeInvoke<SprintIteration | null>(TauriCommand.GetCurrentSprint, { project, team: team ?? null }),

  getSprints: (project: string, team?: string) =>
    safeInvoke<SprintIteration[]>(TauriCommand.GetSprints, { project, team: team ?? null }),

  getWorkItemDetail: (project: string, id: number) =>
    safeInvoke<WorkItemDetail>(TauriCommand.GetWorkItemDetail, { project, id }),

  getWorkItemTypeStates: (project: string, workItemType: string) =>
    safeInvoke<WorkItemTypeState[]>(TauriCommand.GetWorkItemTypeStates, { project, workItemType }),

  updateWorkItemState: (project: string, id: number, newState: string) =>
    safeInvoke<WorkItemDetail>(TauriCommand.UpdateWorkItemState, { project, id, newState }),

  updateWorkItemTitle: (project: string, id: number, title: string) =>
    safeInvoke<WorkItemDetail>(TauriCommand.UpdateWorkItemTitle, { project, id, title }),

  updateWorkItemField: (project: string, id: number, fieldPath: string, value: string | number | null) =>
    safeInvoke<WorkItemDetail>(TauriCommand.UpdateWorkItemField, { project, id, fieldPath, value }),

  reviewPullRequest: (project: string, repoId: string, prId: number, vote: number) =>
    safeInvoke<void>(TauriCommand.ReviewPullRequest, { project, repoId, prId, vote }),

  getStandupData: (project: string, team?: string, lookbackDays?: number) =>
    safeInvoke<StandupData>(TauriCommand.GetStandupData, {
      project,
      team: team ?? null,
      lookbackDays: lookbackDays ?? 1,
    }),

  getWorkItemSummaries: (project: string, ids: number[]) =>
    safeInvoke<RelatedWorkItem[]>(TauriCommand.GetWorkItemSummaries, { project, ids }),

  getPbiIdsWithChildren: (project: string, pbiIds: number[]) =>
    safeInvoke<number[]>(TauriCommand.GetPbiIdsWithChildren, { project, pbiIds }),

  getMyUniqueName: () => safeInvoke<string>(TauriCommand.GetMyUniqueName),

  getReleaseDefinitions: (project: string) =>
    safeInvoke<ReleaseDefinition[]>(TauriCommand.GetReleaseDefinitions, { project }),

  getReleases: (project: string, definitionIds: number[]) =>
    safeInvoke<Release[]>(TauriCommand.GetReleases, { project, definitionIds }),

  updateReleaseApproval: (project: string, approvalId: number, status: string, comments?: string) =>
    safeInvoke<void>(TauriCommand.UpdateReleaseApproval, {
      project,
      approvalId,
      status,
      comments: comments ?? '',
    }),

  getUserActivityDates: (project: string, team?: string, lookbackDays?: number) =>
    safeInvoke<UserActivitySummary>(TauriCommand.GetUserActivityDates, {
      project,
      team: team ?? null,
      lookbackDays: lookbackDays ?? null,
    }),

  getWorkItemRecentComments: (project: string, sinceTimestamp: string) =>
    safeInvoke<WorkItemComment[]>(TauriCommand.GetWorkItemRecentComments, { project, sinceTimestamp }),

  proxyImage: (url: string) => safeInvoke<string>(TauriCommand.ProxyImage, { url }),

  saveImage: (dataUri: string) => safeInvoke<void>(TauriCommand.SaveImage, { dataUri }),
};
