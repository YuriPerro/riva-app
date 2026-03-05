import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import type { PipelineRun } from "@/types/azure";
import { useSessionStore } from "@/store/session";
import { formatAgo, formatDuration, stripRefs } from "@/utils/formatters";
import { mapPipelineStatus } from "@/utils/mappers";
import type { PipelineStatus } from "@/types/pipeline";

export type { PipelineStatus };
export type StatusFilter = "all" | PipelineStatus;

export interface PipelineRunItem {
  id: number;
  buildNumber: string;
  definitionId: number;
  definitionName: string;
  branch: string;
  title: string | null;
  status: PipelineStatus;
  duration: string;
  ago: string;
  url: string;
}

function mapRun(raw: PipelineRun): PipelineRunItem {
  return {
    id: raw.id,
    buildNumber: raw.buildNumber,
    definitionId: raw.definition.id,
    definitionName: raw.definition.name,
    branch: stripRefs(raw.sourceBranch),
    title: raw.triggerInfo?.["ci.message"] ?? null,
    status: mapPipelineStatus(raw),
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
