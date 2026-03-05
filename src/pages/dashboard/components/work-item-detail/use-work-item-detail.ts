import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import type { WorkItemDetail } from "@/types/azure";
import type { DisplayDetail, PriorityLabel } from "./types";

const PRIORITY_LABELS: Record<number, PriorityLabel> = {
  1: "Critical",
  2: "High",
  3: "Medium",
  4: "Low",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractDisplayName(
  identity?: { displayName: string } | null,
  fallback = "Unassigned",
): string {
  if (!identity || typeof identity !== "object") return fallback;
  return identity.displayName ?? fallback;
}

function sanitizeHtml(html?: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed").forEach((el) => el.remove());
  return doc.body.innerHTML.trim();
}

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags.split(";").map((t) => t.trim()).filter(Boolean);
}

function mapToDisplay(detail: WorkItemDetail): DisplayDetail {
  const fields = detail.fields;
  return {
    title: fields["System.Title"],
    type: fields["System.WorkItemType"],
    state: fields["System.State"],
    assignee: extractDisplayName(
      fields["System.AssignedTo"] as { displayName: string } | null,
    ),
    iterationPath: fields["System.IterationPath"] ?? "—",
    description: sanitizeHtml(fields["System.Description"]),
    createdDate: formatDate(fields["System.CreatedDate"]),
    changedDate: formatDate(fields["System.ChangedDate"]),
    createdBy: extractDisplayName(
      fields["System.CreatedBy"] as { displayName: string } | null,
      "Unknown",
    ),
    tags: parseTags(fields["System.Tags"]),
    priority: PRIORITY_LABELS[fields["Microsoft.VSTS.Common.Priority"] ?? 0] ?? "None",
    webUrl: detail.webUrl,
  };
}

export function useWorkItemDetail(project: string, itemId: number | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["work-item-detail", project, itemId],
    queryFn: () => azure.getWorkItemDetail(project, itemId!),
    enabled: itemId !== null,
    staleTime: 60_000,
  });

  const detail = useMemo(() => (data ? mapToDisplay(data) : null), [data]);

  return {
    detail,
    isLoading,
    error: error ? "Failed to load work item details" : null,
  };
}
