import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useQuery } from '@tanstack/react-query';
import { azure } from '@/lib/tauri';
import type { PipelineRun, PipelineDefinition } from '@/types/azure';
import { useSessionStore } from '@/store/session';
import { formatAgo, formatDuration, stripRefs } from '@/utils/formatters';
import { mapPipelineStatus } from '@/utils/mappers';
import type { PipelineStatus } from '@/types/pipeline';

export type { PipelineStatus };
export type StatusFilter = 'all' | PipelineStatus;

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

export interface PipelineGroup {
  definitionId: number;
  definitionName: string;
  runs: PipelineRunItem[];
  isFavorite: boolean;
}

function mapRun(raw: PipelineRun): PipelineRunItem {
  return {
    id: raw.id,
    buildNumber: raw.buildNumber,
    definitionId: raw.definition.id,
    definitionName: raw.definition.name,
    branch: stripRefs(raw.sourceBranch),
    title: raw.triggerInfo?.['ci.message'] ?? null,
    status: mapPipelineStatus(raw),
    duration: formatDuration(raw.queueTime, raw.finishTime),
    ago: formatAgo(raw.finishTime ?? raw.queueTime),
    url: raw.webUrl,
  };
}

export interface PipelinesData {
  runs: PipelineRunItem[];
  groups: PipelineGroup[];
  isLoading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  definitions: string[];
  definitionFilters: string[];
  addDefinitionFilter: (d: string) => void;
  removeDefinitionFilter: (d: string) => void;
  openRun: (url: string) => void;
  favorites: Set<number>;
  toggleFavorite: (definitionId: number) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (v: boolean) => void;
}

function readFavorites(project: string | null): Set<number> {
  if (!project) return new Set();
  try {
    const raw = localStorage.getItem(`forge_favorite_pipelines_${project}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function writeFavorites(project: string, favorites: Set<number>) {
  localStorage.setItem(`forge_favorite_pipelines_${project}`, JSON.stringify([...favorites]));
}

const MAX_RUNS_PER_DEFINITION = 3;

export function usePipelines(): PipelinesData {
  const project = useSessionStore((s) => s.project);
  const teamId = useSessionStore((s) => s.teamId);
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? 'all') as StatusFilter;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [definitionFilters, setDefinitionFilters] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(() => readFavorites(project));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites(project));
    setShowFavoritesOnly(false);
  }, [project]);

  const toggleFavorite = useCallback(
    (definitionId: number) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(definitionId)) {
          next.delete(definitionId);
        } else {
          next.add(definitionId);
        }
        if (project) writeFavorites(project, next);
        return next;
      });
    },
    [project],
  );

  const { data: allDefinitions = [], isLoading: isLoadingDefs } = useQuery({
    queryKey: ['pipeline-definitions', project],
    queryFn: () => azure.getPipelineDefinitions(project!),
    enabled: !!project,
    refetchInterval: 60_000,
  });

  const {
    data: runs = [],
    isLoading: isLoadingRuns,
    error,
  } = useQuery({
    queryKey: ['pipelines', project, teamId],
    queryFn: () => azure.getRecentPipelines(project!, teamId ?? undefined).then((raw) => raw.map(mapRun)),
    enabled: !!project,
    refetchInterval: 30_000,
  });

  const definitions = useMemo(() => {
    const names = allDefinitions.map((d) => d.name);
    return names.sort((a, b) => a.localeCompare(b));
  }, [allDefinitions]);

  const groups = useMemo(() => {
    const runsByDefId = new Map<number, PipelineRunItem[]>();
    for (const run of runs) {
      if (!runsByDefId.has(run.definitionId)) runsByDefId.set(run.definitionId, []);
      runsByDefId.get(run.definitionId)!.push(run);
    }

    return allDefinitions
      .map((def: PipelineDefinition) => {
        const defRuns = (runsByDefId.get(def.id) ?? []).slice(0, MAX_RUNS_PER_DEFINITION);

        const filtered = statusFilter === 'all' ? defRuns : defRuns.filter((r) => r.status === statusFilter);
        if (definitionFilters.length > 0 && !definitionFilters.includes(def.name)) {
          return null;
        }

        const isFavorite = favorites.has(def.id);
        if (showFavoritesOnly && !isFavorite) return null;

        return {
          definitionId: def.id,
          definitionName: def.name,
          runs: filtered,
          isFavorite,
        };
      })
      .filter((g): g is PipelineGroup => g !== null)
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        const aHasRuns = a.runs.length > 0;
        const bHasRuns = b.runs.length > 0;
        if (aHasRuns !== bHasRuns) return aHasRuns ? -1 : 1;
        return a.definitionName.localeCompare(b.definitionName);
      });
  }, [allDefinitions, runs, statusFilter, definitionFilters, favorites, showFavoritesOnly]);

  const allFilteredRuns = useMemo(() => groups.flatMap((g) => g.runs), [groups]);

  return {
    runs: allFilteredRuns,
    groups,
    isLoading: !!project && (isLoadingDefs || isLoadingRuns),
    error: error ? (typeof error === 'string' ? error : 'Failed to load pipelines') : null,
    statusFilter,
    setStatusFilter,
    definitions,
    definitionFilters,
    addDefinitionFilter: (d) => setDefinitionFilters((prev) => [...prev, d]),
    removeDefinitionFilter: (d) => setDefinitionFilters((prev) => prev.filter((x) => x !== d)),
    openRun: openUrl,
    favorites,
    toggleFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
  };
}
