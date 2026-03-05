import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import { formatDate, extractDisplayName, sanitizeHtml, parseTags } from "@/utils/formatters";
import { mapWorkItemType } from "@/utils/mappers";
import { getWorkItemTheme } from "@/utils/work-item-theme";
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
    effort: fields["Microsoft.VSTS.Scheduling.Effort"] != null
      ? String(fields["Microsoft.VSTS.Scheduling.Effort"])
      : null,
    completedWork: fields["Microsoft.VSTS.Scheduling.CompletedWork"] != null
      ? String(fields["Microsoft.VSTS.Scheduling.CompletedWork"])
      : null,
    remainingWork: fields["Microsoft.VSTS.Scheduling.RemainingWork"] != null
      ? String(fields["Microsoft.VSTS.Scheduling.RemainingWork"])
      : null,
    dueDate: fields["Microsoft.VSTS.Scheduling.DueDate"]
      ? formatDate(fields["Microsoft.VSTS.Scheduling.DueDate"])
      : null,
    devStartDate: fields["Microsoft.VSTS.Scheduling.StartDate"]
      ? formatDate(fields["Microsoft.VSTS.Scheduling.StartDate"])
      : null,
    devEndDate: fields["Microsoft.VSTS.Scheduling.FinishDate"]
      ? formatDate(fields["Microsoft.VSTS.Scheduling.FinishDate"])
      : null,
    blocked: fields["Microsoft.VSTS.CMMI.Blocked"] === "Yes" ? "Yes" : "No",
  };
}

export function useWorkItemDetail(project: string, itemId: number | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["work-item-detail", project, itemId],
    queryFn: () => azure.getWorkItemDetail(project, itemId!),
    enabled: itemId !== null,
    staleTime: 60_000,
  });

  const detail = useMemo(() => (data ? mapToDisplay(data) : null), [data]);

  const mappedType = detail ? mapWorkItemType(detail.type) : "task";
  const theme = getWorkItemTheme(mappedType);

  const workItemType = data?.fields["System.WorkItemType"] ?? "";

  const { data: states } = useQuery({
    queryKey: ["work-item-states", project, workItemType],
    queryFn: () => azure.getWorkItemTypeStates(project, workItemType),
    enabled: itemId !== null && workItemType !== "",
    staleTime: 300_000,
  });

  const stateMutation = useMutation({
    mutationFn: (newState: string) =>
      azure.updateWorkItemState(project, itemId!, newState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-item-detail", project, itemId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["my-work"] });
    },
  });

  return {
    detail,
    theme,
    states: states ?? [],
    isLoading,
    isUpdating: stateMutation.isPending,
    updateState: (newState: string) => stateMutation.mutate(newState),
    error: error ? "Failed to load work item details" : null,
  };
}
