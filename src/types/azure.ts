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
  "System.Title": string;
  "System.WorkItemType": string;
  "System.State": string;
  "System.AssignedTo"?: { displayName: string; uniqueName: string } | null;
  "System.IterationPath"?: string;
}

export interface WorkItem {
  id: number;
  fields: WorkItemFields;
  webUrl: string;
}

export interface WorkItemDetailFields extends WorkItemFields {
  "System.Description"?: string;
  "System.CreatedDate"?: string;
  "System.ChangedDate"?: string;
  "System.CreatedBy"?: { displayName: string; uniqueName: string } | null;
  "System.Tags"?: string;
  "Microsoft.VSTS.Common.Priority"?: number;
}

export interface WorkItemDetail {
  id: number;
  fields: WorkItemDetailFields;
  webUrl: string;
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
  finishTime?: string;
  queueTime?: string;
  definition: PipelineDefinition;
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
