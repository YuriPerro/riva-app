import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import { formatDate, extractDisplayName, sanitizeHtml, parseTags } from "@/utils/formatters";
import type { WorkItemDetail } from "@/types/azure";
import type { DisplayDetail, PriorityLabel } from "./types";

const PRIORITY_LABELS: Record<number, PriorityLabel> = {
  1: "Critical",
  2: "High",
  3: "Medium",
  4: "Low",
};

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
