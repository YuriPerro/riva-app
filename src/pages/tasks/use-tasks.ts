import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";
import { getAssigneeInitials } from "@/utils/formatters";
import { mapWorkItemType, mapWorkItemStatus } from "@/utils/mappers";
import type { WorkItemType, WorkItemStatus } from "@/types/work-item";

export type { WorkItemType, WorkItemStatus };

export interface TaskItem {
  id: number;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  rawType: string;
  rawState: string;
  iterationPath?: string;
  assigneeInitials: string;
  url: string;
}

export type StatusFilter = "all" | WorkItemStatus;
export type TypeFilter = "all" | WorkItemType;

export interface TasksData {
  items: TaskItem[];
  filtered: TaskItem[];
  isLoading: boolean;
  error: string | null;
  project: string | null;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  setStatusFilter: (f: StatusFilter) => void;
  setTypeFilter: (f: TypeFilter) => void;
  openItem: (url: string) => void;
  selectedWorkItemId: number | null;
  selectWorkItem: (id: number) => void;
  closeWorkItemDetail: () => void;
}

export function useTasks(): TasksData {
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["tasks", project, team],
    queryFn: () => azure.getTasks(project!, team ?? undefined).then((raw) =>
      raw.map((w): TaskItem => ({
        id: w.id,
        title: w.fields["System.Title"],
        type: mapWorkItemType(w.fields["System.WorkItemType"]),
        status: mapWorkItemStatus(w.fields["System.State"]),
        rawType: w.fields["System.WorkItemType"],
        rawState: w.fields["System.State"],
        iterationPath: w.fields["System.IterationPath"],
        assigneeInitials: getAssigneeInitials(w.fields["System.AssignedTo"] as { displayName: string } | null),
        url: w.webUrl,
      }))
    ),
    enabled: !!project,
  });

  const filtered = useMemo(() =>
    items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return true;
    }),
    [items, statusFilter, typeFilter]
  );

  return {
    items,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === "string" ? error : "Failed to load work items") : null,
    project,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    openItem: openUrl,
    selectedWorkItemId,
    selectWorkItem: setSelectedWorkItemId,
    closeWorkItemDetail: () => setSelectedWorkItemId(null),
  };
}
