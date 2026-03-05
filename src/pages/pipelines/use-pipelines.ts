import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure, type PipelineRun } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";

export type PipelineStatus = "succeeded" | "failed" | "running" | "cancelled";
export type StatusFilter = "all" | PipelineStatus;

export interface PipelineRunItem {
  id: number;
  buildNumber: string;
  definitionId: number;
  definitionName: string;
  branch: string;
  status: PipelineStatus;
  duration: string;
  ago: string;
  url: string;
}

function mapStatus(run: PipelineRun): PipelineStatus {
  if (run.status === "inProgress") return "running";
  if (run.status === "cancelling" || run.result === "canceled") return "cancelled";
  if (run.result === "failed") return "failed";
  if (run.result === "succeeded") return "succeeded";
  return "cancelled";
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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

function mapRun(raw: PipelineRun): PipelineRunItem {
  return {
    id: raw.id,
    buildNumber: raw.buildNumber,
    definitionId: raw.definition.id,
    definitionName: raw.definition.name,
    branch: raw.sourceBranch.replace("refs/heads/", ""),
    status: mapStatus(raw),
    duration: formatDuration(raw.queueTime, raw.finishTime),
    ago: formatAgo(raw.finishTime ?? raw.queueTime),
    url: raw.webUrl,
  };
}

export interface PipelinesData {
  runs: PipelineRunItem[];
  filtered: PipelineRunItem[];
  isLoading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  definitions: string[];
  definitionFilters: string[];
  addDefinitionFilter: (d: string) => void;
  removeDefinitionFilter: (d: string) => void;
  openRun: (url: string) => void;
}

export function usePipelines(): PipelinesData {
  const project = useSessionStore((s) => s.project);
  const teamId = useSessionStore((s) => s.teamId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [definitionFilters, setDefinitionFilters] = useState<string[]>([]);

  const { data: runs = [], isLoading, error } = useQuery({
    queryKey: ["pipelines", project, teamId],
    queryFn: () => azure.getRecentPipelines(project!, teamId ?? undefined).then((raw) => raw.map(mapRun)),
    enabled: !!project,
  });

  const definitions = useMemo(() => {
    const names = [...new Set(runs.map((r) => r.definitionName))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [runs]);

  const filtered = useMemo(() => {
    let result = statusFilter === "all" ? runs : runs.filter((r) => r.status === statusFilter);
    if (definitionFilters.length > 0) result = result.filter((r) => definitionFilters.includes(r.definitionName));
    return result;
  }, [runs, statusFilter, definitionFilters]);

  return {
    runs,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === "string" ? error : "Failed to load pipelines") : null,
    statusFilter,
    setStatusFilter,
    definitions,
    definitionFilters,
    addDefinitionFilter: (d) => setDefinitionFilters((prev) => [...prev, d]),
    removeDefinitionFilter: (d) => setDefinitionFilters((prev) => prev.filter((x) => x !== d)),
    openRun: openUrl,
  };
}
