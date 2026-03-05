import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure, type WorkItem as ApiWorkItem } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";

export type WorkItemType = "task" | "bug" | "pbi" | "epic" | "feature";
export type WorkItemStatus = "todo" | "in-progress" | "in-review" | "done";

export interface MyWorkItem {
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

function mapType(t: string): WorkItemType {
  const lower = t.toLowerCase();
  if (lower.includes("bug")) return "bug";
  if (lower.includes("epic")) return "epic";
  if (lower.includes("feature")) return "feature";
  if (lower.includes("pbi") || lower.includes("product backlog")) return "pbi";
  return "task";
}

function mapStatus(s: string): WorkItemStatus {
  const lower = s.toLowerCase();
  if (lower.includes("progress") || lower.includes("active") || lower.includes("doing")) return "in-progress";
  if (lower.includes("review") || lower.includes("testing") || lower.includes("qa")) return "in-review";
  if (lower.includes("done") || lower.includes("closed") || lower.includes("resolved")) return "done";
  return "todo";
}

function getInitials(assignedTo?: ApiWorkItem["fields"]["System.AssignedTo"]): string {
  if (!assignedTo || typeof assignedTo !== "object") return "?";
  const name = (assignedTo as { displayName: string }).displayName ?? "";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export type StatusFilter = "all" | WorkItemStatus;
export type TypeFilter = "all" | WorkItemType;

export interface MyWorkData {
  items: MyWorkItem[];
  filtered: MyWorkItem[];
  isLoading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  setStatusFilter: (f: StatusFilter) => void;
  setTypeFilter: (f: TypeFilter) => void;
  openItem: (url: string) => void;
}

export function useMyWork(): MyWorkData {
  const project = useSessionStore((s) => s.project);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["my-work", project],
    queryFn: () => azure.getMyWorkItems(project!).then((raw) =>
      raw.map((w): MyWorkItem => ({
        id: w.id,
        title: w.fields["System.Title"],
        type: mapType(w.fields["System.WorkItemType"]),
        status: mapStatus(w.fields["System.State"]),
        rawType: w.fields["System.WorkItemType"],
        rawState: w.fields["System.State"],
        iterationPath: w.fields["System.IterationPath"],
        assigneeInitials: getInitials(w.fields["System.AssignedTo"]),
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
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    openItem: openUrl,
  };
}
