import type { WorkItemType, WorkItemStatus } from '@/types/work-item';
import type { PipelineStatus } from '@/types/pipeline';
import type { StandupData } from '@/types/azure';


export type WorkItem = {
  id: number;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  assigneeInitials: string;
  iterationPath?: string;
  url: string;
  parentId?: number | null;
  parentTitle?: string;
  parentType?: WorkItemType;
};

export type Pipeline = {
  id: number;
  name: string;
  branch: string;
  target: string;
  status: PipelineStatus;
  duration: string;
  agoDate: string;
  url: string;
};

export type SprintInfo = {
  name: string;
  daysRemaining: number;
  totalDays: number;
  startDate: string;
  status: 'on-track' | 'at-risk' | 'off-track';
};

export type DashboardPR = {
  id: number;
  title: string;
  repo: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  authorInitials: string;
  createdAgoDate: string;
  status: 'active' | 'draft';
  reviewerCount: number;
  approvedCount: number;
  url: string;
};

export type DashboardStats = {
  myTasks: number;
  inReview: number;
  pipelinesRunning: number;
  openPRs: number;
};

export interface DashboardData {
  sprint: SprintInfo | null;
  stats: DashboardStats;
  workItems: WorkItem[];
  pipelines: Pipeline[];
  pullRequests: DashboardPR[];
  isLoading: boolean;
  error: string | null;
  project: string | null;
  selectedWorkItemId: number | null;
  selectWorkItem: (id: number | null) => void;
  closeWorkItemDetail: () => void;
  standup: StandupData | null;
  standupLoading: boolean;
  standupPeriod: number;
  setStandupPeriod: (days: number) => void;
  standupOpen: boolean;
  setStandupOpen: (open: boolean) => void;
}
