import type { WorkItem, Pipeline, SprintInfo, DashboardStats } from "./types";

const mockSprint: SprintInfo = {
  name: "Sprint 12",
  daysRemaining: 6,
  status: "on-track",
};

const mockStats: DashboardStats = {
  myTasks: 5,
  inReview: 3,
  pipelinesRunning: 2,
};

const mockWorkItems: WorkItem[] = [
  { id: 1241, title: "Implement onboarding PAT validation", type: "task", status: "in-progress", assigneeInitials: "YB" },
  { id: 1238, title: "Design dashboard layout", type: "task", status: "in-review", assigneeInitials: "YB" },
  { id: 1235, title: "Fix crash on empty sprint response", type: "bug", status: "todo", assigneeInitials: "YB" },
  { id: 1230, title: "Azure DevOps REST API integration", type: "pbi", status: "in-progress", assigneeInitials: "YB" },
  { id: 1228, title: "App icon and branding", type: "task", status: "todo", assigneeInitials: "YB" },
];

const mockPipelines: Pipeline[] = [
  { id: 142, name: "CI", branch: "main", target: "production", status: "succeeded", duration: "3m 42s", ago: "23min ago" },
  { id: 143, name: "CI", branch: "feat/dashboard", target: "staging", status: "running", duration: "1m 12s", ago: "just now" },
  { id: 141, name: "CD", branch: "hotfix/crash", target: "production", status: "failed", duration: "0m 54s", ago: "1h ago" },
  { id: 140, name: "CI", branch: "develop", target: "staging", status: "succeeded", duration: "4m 01s", ago: "3h ago" },
  { id: 139, name: "CI", branch: "feat/auth", target: "staging", status: "cancelled", duration: "0m 12s", ago: "5h ago" },
];

export const useDashboard = () => {
  return {
    sprint: mockSprint,
    stats: mockStats,
    workItems: mockWorkItems,
    pipelines: mockPipelines,
  };
};
