export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface WorkItemFields {
  "System.Title": string;
  "System.WorkItemType": string;
  "System.State": string;
  "System.AssignedTo"?: { displayName: string; uniqueName: string } | null;
}

export interface WorkItem {
  id: number;
  fields: WorkItemFields;
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
