import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { azure, type PipelineRun, type WorkItem as ApiWorkItem, type PullRequest as ApiPullRequest } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";
import type { WorkItem, Pipeline, DashboardPR, SprintInfo, DashboardData } from "./types";

function mapWorkItemType(type: string): WorkItem["type"] {
  const t = type.toLowerCase();
  if (t.includes("bug")) return "bug";
  if (t.includes("epic")) return "epic";
  if (t.includes("feature") || t.includes("pbi") || t.includes("product backlog")) return "pbi";
  return "task";
}

function mapWorkItemStatus(state: string): WorkItem["status"] {
  const s = state.toLowerCase();
  if (s.includes("progress") || s.includes("active") || s.includes("doing")) return "in-progress";
  if (s.includes("review") || s.includes("testing") || s.includes("qa")) return "in-review";
  if (s.includes("done") || s.includes("closed") || s.includes("resolved")) return "done";
  return "todo";
}

function mapPipelineStatus(run: PipelineRun): Pipeline["status"] {
  if (run.status === "inProgress") return "running";
  if (run.status === "cancelling" || run.result === "canceled") return "cancelled";
  if (run.result === "failed") return "failed";
  if (run.result === "succeeded") return "succeeded";
  return "cancelled";
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sprintDaysRemaining(finishDate?: string): number {
  if (!finishDate) return 0;
  const diff = new Date(finishDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function mapSprintStatus(days: number): SprintInfo["status"] {
  if (days <= 2) return "at-risk";
  return "on-track";
}

function getInitials(assignedTo?: ApiWorkItem["fields"]["System.AssignedTo"]): string {
  if (!assignedTo || typeof assignedTo !== "object") return "?";
  const name = (assignedTo as { displayName: string }).displayName ?? "";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function mapPullRequest(pr: ApiPullRequest): DashboardPR {
  const name = pr.createdBy.displayName ?? "";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  const approvedCount = pr.reviewers.filter((r) => r.vote === 10).length;

  return {
    id: pr.pullRequestId,
    title: pr.title,
    repo: pr.repository.name,
    sourceBranch: pr.sourceRefName.replace("refs/heads/", ""),
    targetBranch: pr.targetRefName.replace("refs/heads/", ""),
    author: name,
    authorInitials: initials,
    createdAgo: formatAgo(pr.creationDate),
    status: pr.isDraft ? "draft" : "active",
    reviewerCount: pr.reviewers.length,
    approvedCount,
    url: pr.webUrl,
  };
}

function sprintTotalDays(startDate?: string, finishDate?: string): number {
  if (!startDate || !finishDate) return 0;
  const diff = new Date(finishDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

async function fetchDashboardData(project: string, team: string, teamId: string) {
  const [sprintData, rawItems, rawPipelines, rawPRs] = await Promise.all([
    azure.getCurrentSprint(project, team),
    azure.getMyWorkItems(project, team),
    azure.getRecentPipelines(project, teamId),
    azure.getPullRequests(project),
  ]);

  const sprint: SprintInfo | null = sprintData
    ? (() => {
        const days = sprintDaysRemaining(sprintData.attributes.finishDate);
        const totalDays = sprintTotalDays(sprintData.attributes.startDate, sprintData.attributes.finishDate);
        return {
          name: sprintData.name,
          daysRemaining: days,
          totalDays,
          startDate: sprintData.attributes.startDate ?? "",
          status: mapSprintStatus(days),
        };
      })()
    : null;

  const workItems: WorkItem[] = rawItems.map((w) => ({
    id: w.id,
    title: w.fields["System.Title"],
    type: mapWorkItemType(w.fields["System.WorkItemType"]),
    status: mapWorkItemStatus(w.fields["System.State"]),
    assigneeInitials: getInitials(w.fields["System.AssignedTo"]),
    iterationPath: w.fields["System.IterationPath"],
    url: w.webUrl,
  }));

  const pipelines: Pipeline[] = rawPipelines.map((p) => ({
    id: p.id,
    name: p.definition.name,
    branch: p.sourceBranch.replace("refs/heads/", ""),
    target: p.sourceBranch.includes("main") || p.sourceBranch.includes("master")
      ? "production" : "staging",
    status: mapPipelineStatus(p),
    duration: formatDuration(p.queueTime, p.finishTime),
    ago: formatAgo(p.finishTime ?? p.queueTime),
    url: p.webUrl,
  }));

  const pullRequests: DashboardPR[] = rawPRs.map(mapPullRequest);

  return { sprint, workItems, pipelines, pullRequests };
}

export const useDashboard = (): DashboardData => {
  const navigate = useNavigate();
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const teamId = useSessionStore((s) => s.teamId);

  useEffect(() => {
    if (!project) {
      navigate("/project-select", { replace: true });
    } else if (!team) {
      navigate("/team-select", { replace: true });
    }
  }, [project, team, navigate]);

  const enabled = !!project && !!team;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", project, team, teamId],
    queryFn: () => fetchDashboardData(project!, team!, teamId ?? ""),
    enabled,
  });

  const stats = useMemo(() => ({
    myTasks: data?.workItems.length ?? 0,
    inReview: data?.workItems.filter((w) => w.status === "in-review").length ?? 0,
    pipelinesRunning: data?.pipelines.filter((p) => p.status === "running").length ?? 0,
    openPRs: data?.pullRequests.length ?? 0,
  }), [data?.workItems, data?.pipelines, data?.pullRequests]);

  return {
    project,
    sprint: data?.sprint ?? null,
    stats,
    workItems: data?.workItems ?? [],
    pipelines: data?.pipelines ?? [],
    pullRequests: data?.pullRequests ?? [],
    isLoading: enabled && isLoading,
    error: error ? (typeof error === "string" ? error : "Failed to load dashboard data") : null,
  };
};
