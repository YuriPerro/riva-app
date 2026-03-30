import { TauriCommand } from '@/types/commands';
import * as demo from './demo-data';

export async function demoInvoke<T>(command: string, _args?: Record<string, unknown>): Promise<T> {
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

  switch (command) {
    case TauriCommand.GetProjects:
      return demo.projects as T;
    case TauriCommand.GetTeams:
      return demo.teams as T;
    case TauriCommand.GetTasks:
      return demo.workItems as T;
    case TauriCommand.GetCurrentSprint:
      return demo.currentSprint as T;
    case TauriCommand.GetSprints:
      return demo.sprints as T;
    case TauriCommand.GetRecentPipelines:
      return demo.pipelineRuns as T;
    case TauriCommand.GetPipelineDefinitions:
      return demo.pipelineDefinitions as T;
    case TauriCommand.GetPullRequests:
      return demo.pullRequests as T;
    case TauriCommand.GetStandupData:
      return demo.standupData as T;
    case TauriCommand.GetMyUniqueName:
      return demo.myUniqueName as T;
    case TauriCommand.GetUserActivityDates:
      return demo.userActivity as T;
    case TauriCommand.GetWorkItemRecentComments:
      return demo.comments as T;
    case TauriCommand.GetWorkItemSummaries:
      return demo.relatedWorkItems as T;
    case TauriCommand.GetPbiIdsWithChildren:
      return [] as T;
    case TauriCommand.GetReleaseDefinitions:
      return demo.releaseDefinitions as T;
    case TauriCommand.GetReleases:
      return demo.releases as T;
    case TauriCommand.HasSession:
      return true as T;
    case TauriCommand.LoadCredentials:
      return { org_url: 'https://dev.azure.com/acmecorp', pat: 'demo' } as T;
    case TauriCommand.LoadOpenAiKey:
      return 'demo-key' as T;
    case TauriCommand.UpdateWorkItemState:
    case TauriCommand.UpdateWorkItemTitle:
    case TauriCommand.UpdateWorkItemField:
    case TauriCommand.ReviewPullRequest:
    case TauriCommand.UpdateReleaseApproval:
    case TauriCommand.SaveCredentials:
    case TauriCommand.ClearCredentials:
    case TauriCommand.InitSession:
    case TauriCommand.ClearSession:
    case TauriCommand.ValidateCredentials:
    case TauriCommand.SaveOpenAiKey:
    case TauriCommand.ClearOpenAiKey:
    case TauriCommand.SaveImage:
      return undefined as T;
    case TauriCommand.GenerateStandupSummary:
      return demo.standupSummary as T;
    case TauriCommand.ProxyImage:
      return '' as T;
    default:
      console.warn(`[DEMO] Unhandled command: ${command}`);
      return undefined as T;
  }
}
