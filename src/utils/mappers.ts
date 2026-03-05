import type { PipelineRun } from "@/types/azure";
import type { WorkItemType } from "@/types/work-item";
import type { WorkItemStatus } from "@/types/work-item";
import type { PipelineStatus } from "@/types/pipeline";

export function mapWorkItemType(type: string): WorkItemType {
  const t = type.toLowerCase();
  if (t.includes("bug")) return "bug";
  if (t.includes("epic")) return "epic";
  if (t.includes("feature")) return "feature";
  if (t.includes("pbi") || t.includes("product backlog")) return "pbi";
  return "task";
}

export function mapWorkItemStatus(state: string): WorkItemStatus {
  const s = state.toLowerCase();
  if (s.includes("progress") || s.includes("active") || s.includes("doing")) return "in-progress";
  if (s.includes("review") || s.includes("testing") || s.includes("qa")) return "in-review";
  if (s.includes("done") || s.includes("closed") || s.includes("resolved")) return "done";
  return "todo";
}

export function mapPipelineStatus(run: PipelineRun): PipelineStatus {
  if (run.status === "inProgress") return "running";
  if (run.status === "cancelling" || run.result === "canceled") return "cancelled";
  if (run.result === "failed") return "failed";
  if (run.result === "succeeded") return "succeeded";
  return "cancelled";
}
