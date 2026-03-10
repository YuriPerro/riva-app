export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface WorkItemFields {
  'System.Title': string;
  'System.WorkItemType': string;
  'System.State': string;
  'System.AssignedTo'?: { displayName: string; uniqueName: string } | null;
  'System.IterationPath'?: string;
  'System.Parent'?: number | null;
}

export interface WorkItem {
  id: number;
  fields: WorkItemFields;
  webUrl: string;
}

export interface WorkItemDetailFields extends WorkItemFields {
  'System.Description'?: string;
  'System.CreatedDate'?: string;
  'System.ChangedDate'?: string;
  'System.CreatedBy'?: { displayName: string; uniqueName: string } | null;
  'System.Tags'?: string;
  'Microsoft.VSTS.Common.Priority'?: number;
  'Microsoft.VSTS.Scheduling.RemainingWork'?: number;
  'Microsoft.VSTS.Scheduling.CompletedWork'?: number;
  'Microsoft.VSTS.Scheduling.Effort'?: number;
  'Microsoft.VSTS.Scheduling.DueDate'?: string;
  'Microsoft.VSTS.Scheduling.StartDate'?: string;
  'Microsoft.VSTS.Scheduling.FinishDate'?: string;
  'Microsoft.VSTS.CMMI.Blocked'?: string;
}

export interface RelatedWorkItem {
  id: number;
  title: string;
  workItemType: string;
  state: string;
  webUrl: string;
}

export interface WorkItemDetail {
  id: number;
  fields: WorkItemDetailFields;
  webUrl: string;
  parent?: RelatedWorkItem | null;
  children: RelatedWorkItem[];
}

export interface WorkItemTypeState {
  name: string;
  color: string;
  category: string;
}

export interface PipelineDefinition {
  id: number;
  name: string;
}

export interface PipelineRun {
  id: number;
  buildNumber: string;
  status: string;
  result?: string;
  sourceBranch: string;
  reason?: string;
  finishTime?: string;
  queueTime?: string;
  definition: PipelineDefinition;
  triggerInfo?: Record<string, string>;
  webUrl: string;
}

export interface SprintAttributes {
  startDate?: string;
  finishDate?: string;
  timeFrame?: string;
}

export interface SprintIteration {
  id: string;
  name: string;
  path: string;
  attributes: SprintAttributes;
}

// ============================================================
// Pull Requests
// ============================================================

export interface PullRequestIdentity {
  displayName: string;
  uniqueName: string;
}

export interface PullRequestReviewer {
  displayName: string;
  uniqueName: string;
  vote: number;
  isRequired: boolean;
}

export interface PullRequestRepository {
  id: string;
  name: string;
}

export interface PullRequest {
  pullRequestId: number;
  title: string;
  sourceRefName: string;
  targetRefName: string;
  createdBy: PullRequestIdentity;
  creationDate: string;
  status: string;
  repository: PullRequestRepository;
  isDraft: boolean;
  reviewers: PullRequestReviewer[];
  webUrl: string;
}

// ============================================================
// Releases
// ============================================================

export interface ReleaseDefinitionEnvironment {
  name: string;
  rank: number;
}

export interface ReleaseDefinition {
  id: number;
  name: string;
  environments: ReleaseDefinitionEnvironment[];
}

export interface ReleaseDefinitionRef {
  id: number;
  name: string;
}

export interface ReleaseIdentity {
  displayName: string;
  uniqueName: string;
}

export interface ReleaseEnvironmentDeployStep {
  lastModifiedOn?: string;
}

export interface ReleaseApprovalIdentity {
  displayName: string;
  uniqueName: string;
}

export interface ReleaseApproval {
  id: number;
  status: string;
  approvalType: string;
  approver: ReleaseApprovalIdentity | null;
  createdOn?: string;
  modifiedOn?: string;
}

export interface ReleaseEnvironment {
  name: string;
  rank: number;
  status: string;
  deploySteps: ReleaseEnvironmentDeployStep[];
  preDeployApprovals: ReleaseApproval[];
  postDeployApprovals: ReleaseApproval[];
}

export interface Release {
  id: number;
  name: string;
  releaseDefinition: ReleaseDefinitionRef;
  createdBy: ReleaseIdentity;
  createdOn: string;
  environments: ReleaseEnvironment[];
  webUrl: string;
}

// ============================================================
// Standup
// ============================================================

export interface StandupTransition {
  workItemId: number;
  title: string;
  workItemType: string;
  fromState: string;
  toState: string;
  changedDate: string;
  webUrl: string;
}

export interface StandupItem {
  id: number;
  title: string;
  workItemType: string;
  state: string;
  webUrl: string;
}

export interface StandupPR {
  id: number;
  title: string;
  repo: string;
  activityType: string;
  webUrl: string;
}

export type UserActivitySummary = {
  activeDates: string[];
  thisWeekCount: number;
  lastWeekCount: number;
};

export interface StandupData {
  transitions: StandupTransition[];
  today: StandupItem[];
  todayPrs: StandupPR[];
  blockers: StandupItem[];
}

export type WorkItemComment = {
  workItemId: number;
  workItemTitle: string;
  commentId: number;
  text: string;
  createdBy: string;
  createdDate: string;
};
