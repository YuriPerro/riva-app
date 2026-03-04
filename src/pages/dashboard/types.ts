export type WorkItemType = "task" | "bug" | "pbi" | "epic";
export type WorkItemStatus = "todo" | "in-progress" | "in-review" | "done";
export type PipelineStatus = "succeeded" | "failed" | "running" | "cancelled";

export type WorkItem = {
  id: number;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  assigneeInitials: string;
};

export type Pipeline = {
  id: number;
  name: string;
  branch: string;
  target: string;
  status: PipelineStatus;
  duration: string;
  ago: string;
};

export type SprintInfo = {
  name: string;
  daysRemaining: number;
  status: "on-track" | "at-risk" | "off-track";
};

export type DashboardStats = {
  myTasks: number;
  inReview: number;
  pipelinesRunning: number;
};
