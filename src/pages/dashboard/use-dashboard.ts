import { useEffect, useState } from "react";
import { azure, type PipelineRun, type WorkItem as ApiWorkItem } from "@/lib/tauri";
import type { WorkItem, Pipeline, SprintInfo, DashboardData } from "./types";

// ─── Data mappers ────────────────────────────────────────────────────────────

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

// ─── Hook ────────────────────────────────────────────────────────────────────

const FALLBACK_SPRINT: SprintInfo = { name: "No active sprint", daysRemaining: 0, status: "on-track" };

export const useDashboard = (): DashboardData => {
  const [project, setProject] = useState<string | null>(
    localStorage.getItem("forge_project")
  );
  const [sprint, setSprint] = useState<SprintInfo>(FALLBACK_SPRINT);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If no project selected, redirect to project selection
  useEffect(() => {
    if (!project) {
      window.location.href = "/project-select";
    }
  }, [project]);

  // Fetch dashboard data once project is known
  useEffect(() => {
    if (!project) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      azure.getCurrentSprint(project),
      azure.getMyWorkItems(project),
      azure.getRecentPipelines(project),
    ])
      .then(([sprintData, rawItems, rawPipelines]) => {
        // Sprint
        if (sprintData) {
          const days = sprintDaysRemaining(sprintData.attributes.finishDate);
          setSprint({
            name: sprintData.name,
            daysRemaining: days,
            status: mapSprintStatus(days),
          });
        }

        // Work items
        const mapped: WorkItem[] = rawItems.map((w) => ({
          id: w.id,
          title: w.fields["System.Title"],
          type: mapWorkItemType(w.fields["System.WorkItemType"]),
          status: mapWorkItemStatus(w.fields["System.State"]),
          assigneeInitials: getInitials(w.fields["System.AssignedTo"]),
        }));
        setWorkItems(mapped);

        // Pipelines
        const mappedPipelines: Pipeline[] = rawPipelines.map((p) => ({
          id: p.id,
          name: p.definition.name,
          branch: p.sourceBranch.replace("refs/heads/", ""),
          target: p.sourceBranch.includes("main") || p.sourceBranch.includes("master")
            ? "production" : "staging",
          status: mapPipelineStatus(p),
          duration: formatDuration(p.queueTime, p.finishTime),
          ago: formatAgo(p.finishTime ?? p.queueTime),
        }));
        setPipelines(mappedPipelines);
      })
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load dashboard data"))
      .finally(() => setIsLoading(false));
  }, [project]);

  const inReview = workItems.filter((w) => w.status === "in-review").length;
  const pipelinesRunning = pipelines.filter((p) => p.status === "running").length;

  return {
    project,
    sprint,
    stats: { myTasks: workItems.length, inReview, pipelinesRunning },
    workItems,
    pipelines,
    isLoading,
    error,
  };
};
