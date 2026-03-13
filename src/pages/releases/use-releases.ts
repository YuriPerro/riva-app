import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { azure } from '@/lib/tauri';
import type { Release, ReleaseDefinition, ReleaseApproval } from '@/types/azure';
import { useSessionStore } from '@/store/session';
import { useNotificationSettingsStore } from '@/store/notifications';
import { mapReleaseEnvironmentStatus, mapApprovalStatus } from '@/utils/mappers';
import { fuzzyMatch } from '@/utils/search';
import type { SortDirection, SortOption } from '@/components/ui/sort-selector/types';
import type { ReleaseItem, ReleaseApprovalItem, ReleaseEnvironmentItem, ReleaseGroup, ReleasesData, ReleaseStatusFilter, ReleaseSortKey } from './types';

function readFavorites(project: string | null): Set<number> {
  if (!project) return new Set();
  try {
    const raw = localStorage.getItem(`riva_favorite_releases_${project}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function writeFavorites(project: string, favorites: Set<number>) {
  localStorage.setItem(`riva_favorite_releases_${project}`, JSON.stringify([...favorites]));
}

function mapApprovals(approvals: ReleaseApproval[], type: 'preDeploy' | 'postDeploy'): ReleaseApprovalItem[] {
  return approvals
    .filter((a) => a.approver !== null)
    .map((a) => ({
      id: a.id,
      approvalType: type,
      status: mapApprovalStatus(a.status),
      approverName: a.approver!.displayName,
      approverUniqueName: a.approver!.uniqueName,
    }));
}

function mapRelease(raw: Release): ReleaseItem {
  const lastEnvWithDeploy = [...raw.environments]
    .reverse()
    .find((e) => e.deploySteps.length > 0);
  const steps = lastEnvWithDeploy?.deploySteps ?? [];
  const lastDeployTime = steps[steps.length - 1]?.lastModifiedOn;

  return {
    id: raw.id,
    name: raw.name,
    definitionId: raw.releaseDefinition.id,
    definitionName: raw.releaseDefinition.name,
    createdBy: raw.createdBy.displayName,
    createdOn: raw.createdOn,
    agoDate: lastDeployTime ?? raw.createdOn,
    environments: raw.environments
      .sort((a, b) => a.rank - b.rank)
      .map((env) => {
        const allApprovals = [
          ...mapApprovals(env.preDeployApprovals ?? [], 'preDeploy'),
          ...mapApprovals(env.postDeployApprovals ?? [], 'postDeploy'),
        ];
        let status = mapReleaseEnvironmentStatus(env.status);
        const isRejectedByApi = env.status.toLowerCase() === 'rejected';
        const hasRejectedApproval = allApprovals.some((a) => a.status === 'rejected');
        if (isRejectedByApi && !hasRejectedApproval) {
          status = 'failed';
        }
        return {
          name: env.name,
          status,
          lastDeployedOn: env.deploySteps[env.deploySteps.length - 1]?.lastModifiedOn,
          approvals: allApprovals,
        };
      }),
    url: raw.webUrl,
  };
}

function findMyPendingApproval(
  environments: ReleaseEnvironmentItem[],
  currentUser: string | null,
): ReleaseApprovalItem | null {
  if (!currentUser) return null;
  for (const env of environments) {
    for (const approval of env.approvals) {
      if (approval.status === 'pending' && approval.approverUniqueName === currentUser) {
        return approval;
      }
    }
  }
  return null;
}

const MAX_RELEASES_PER_DEFINITION = 3;

export function useReleases(): ReleasesData {
  const { t } = useTranslation(['releases', 'common']);
  const project = useSessionStore((s) => s.project);
  const queryClient = useQueryClient();
  const [definitionFilters, setDefinitionFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReleaseStatusFilter>('all');
  const [environmentFilters, setEnvironmentFilters] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(() => readFavorites(project));
  const [selectedRelease, setSelectedRelease] = useState<ReleaseItem | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<ReleaseSortKey>('relevance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const setSort = useCallback((key: ReleaseSortKey, dir: SortDirection) => {
    setSortKey(key);
    setSortDirection(dir);
  }, []);

  useEffect(() => {
    setFavorites(readFavorites(project));
    setShowFavoritesOnly(false);
  }, [project]);

  const toggleFavorite = useCallback(
    (definitionId: number) => {
      if (!project) return;
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(definitionId)) {
          next.delete(definitionId);
        } else {
          next.add(definitionId);
        }
        writeFavorites(project, next);
        return next;
      });
    },
    [project],
  );

  const monitorAllReleases = useNotificationSettingsStore((s) => s.monitorAllReleases);
  const monitoredReleaseIds = useNotificationSettingsStore((s) => s.monitoredReleaseIds);
  const pipelineFailedEnabled = useNotificationSettingsStore((s) => s.pipelineFailedEnabled);
  const setMonitorAllReleases = useNotificationSettingsStore((s) => s.setMonitorAllReleases);
  const setMonitoredReleaseIds = useNotificationSettingsStore((s) => s.setMonitoredReleaseIds);

  const { data: currentUserUniqueName = null } = useQuery({
    queryKey: ['my-unique-name'],
    queryFn: () => azure.getMyUniqueName(),
    staleTime: Infinity,
  });

  const { data: allDefinitions = [], isLoading: isLoadingDefs } = useQuery({
    queryKey: ['release-definitions', project],
    queryFn: () => azure.getReleaseDefinitions(project!),
    enabled: !!project,
    refetchInterval: 60_000,
  });

  const isNotifyEnabled = useCallback((definitionId: number) => {
    if (!pipelineFailedEnabled) return false;
    if (monitorAllReleases) return true;
    return monitoredReleaseIds.includes(definitionId);
  }, [pipelineFailedEnabled, monitorAllReleases, monitoredReleaseIds]);

  const toggleNotification = useCallback((definitionId: number) => {
    if (monitorAllReleases) {
      const allIds = allDefinitions.map((d) => d.id);
      setMonitorAllReleases(false);
      setMonitoredReleaseIds(allIds.filter((id) => id !== definitionId));
      return;
    }

    const isCurrentlyMonitored = monitoredReleaseIds.includes(definitionId);
    if (isCurrentlyMonitored) {
      setMonitoredReleaseIds(monitoredReleaseIds.filter((id) => id !== definitionId));
    } else {
      const updated = [...monitoredReleaseIds, definitionId];
      const allSelected = allDefinitions.every((d) => updated.includes(d.id));
      if (allSelected) {
        setMonitorAllReleases(true);
        setMonitoredReleaseIds([]);
      } else {
        setMonitoredReleaseIds(updated);
      }
    }
  }, [monitorAllReleases, monitoredReleaseIds, allDefinitions, setMonitorAllReleases, setMonitoredReleaseIds]);

  const definitionIds = useMemo(() => allDefinitions.map((d) => d.id), [allDefinitions]);

  const {
    data: releases = [],
    isLoading: isLoadingReleases,
    error,
  } = useQuery({
    queryKey: ['releases', project, definitionIds],
    queryFn: () => azure.getReleases(project!, definitionIds).then((raw) => raw.map(mapRelease)),
    enabled: !!project && definitionIds.length > 0,
    refetchInterval: 30_000,
  });

  const definitions = useMemo(() => {
    return allDefinitions.map((d) => d.name).sort((a, b) => a.localeCompare(b));
  }, [allDefinitions]);

  const allEnvironmentNames = useMemo(() => {
    const names = new Set<string>();
    for (const def of allDefinitions) {
      for (const env of def.environments) {
        names.add(env.name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [allDefinitions]);

  const baseGroups = useMemo(() => {
    const releasesByDefId = new Map<number, ReleaseItem[]>();
    for (const release of releases) {
      if (!releasesByDefId.has(release.definitionId)) releasesByDefId.set(release.definitionId, []);
      releasesByDefId.get(release.definitionId)!.push(release);
    }

    return allDefinitions
      .map((def: ReleaseDefinition) => {
        const defReleases = (releasesByDefId.get(def.id) ?? []).slice(0, MAX_RELEASES_PER_DEFINITION);

        if (definitionFilters.length > 0 && !definitionFilters.includes(def.name)) {
          return null;
        }

        const isFavorite = favorites.has(def.id);
        if (showFavoritesOnly && !isFavorite) return null;

        if (environmentFilters.length > 0) {
          const hasMatchingEnv = defReleases.some((r) =>
            r.environments.some((e) => environmentFilters.includes(e.name)),
          );
          if (!hasMatchingEnv) return null;
        }

        const environmentNames = def.environments
          .sort((a, b) => a.rank - b.rank)
          .map((e) => e.name);

        return {
          definitionId: def.id,
          definitionName: def.name,
          environmentNames,
          releases: defReleases,
          isFavorite,
          isNotifyEnabled: isNotifyEnabled(def.id),
        };
      })
      .filter((g): g is ReleaseGroup => g !== null)
      .map((g) => {
        if (!query) return g;
        const defNameMatches = fuzzyMatch(query, g.definitionName);
        if (defNameMatches) return g;
        const matchedReleases = g.releases.filter((r) => {
          const searchTarget = `${r.name} ${r.createdBy}`;
          return fuzzyMatch(query, searchTarget);
        });
        if (matchedReleases.length === 0) return null;
        return { ...g, releases: matchedReleases };
      })
      .filter((g): g is ReleaseGroup => g !== null)
      .sort((a, b) => {
        if (sortKey !== 'relevance') {
          const dir = sortDirection === 'asc' ? 1 : -1;
          if (sortKey === 'name') return dir * a.definitionName.localeCompare(b.definitionName);
          if (sortKey === 'newest') {
            const aTime = a.releases[0]?.createdOn ?? '';
            const bTime = b.releases[0]?.createdOn ?? '';
            return dir * (new Date(bTime).getTime() - new Date(aTime).getTime());
          }
          if (sortKey === 'status') {
            const aStatus = a.releases[0]?.environments[0]?.status ?? '';
            const bStatus = b.releases[0]?.environments[0]?.status ?? '';
            return dir * aStatus.localeCompare(bStatus);
          }
        }
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        const aHasReleases = a.releases.length > 0;
        const bHasReleases = b.releases.length > 0;
        if (aHasReleases !== bHasReleases) return aHasReleases ? -1 : 1;
        return a.definitionName.localeCompare(b.definitionName);
      });
  }, [allDefinitions, releases, definitionFilters, favorites, showFavoritesOnly, isNotifyEnabled, environmentFilters, query, sortKey, sortDirection]);

  const groups = useMemo(() => {
    if (statusFilter === 'all') return baseGroups;
    return baseGroups
      .map((g) => {
        const filtered = g.releases.filter((r) =>
          r.environments.some((e) => e.status === statusFilter),
        );
        if (filtered.length === 0) return null;
        return { ...g, releases: filtered };
      })
      .filter((g): g is ReleaseGroup => g !== null);
  }, [baseGroups, statusFilter]);

  const countByStatus = useCallback(
    (s: ReleaseStatusFilter): number => {
      if (s === 'all') return baseGroups.length;
      return baseGroups.filter((g) =>
        g.releases.some((r) => r.environments.some((e) => e.status === s)),
      ).length;
    },
    [baseGroups],
  );

  const approvalMutation = useMutation({
    mutationFn: (params: { approvalId: number; status: 'approved' | 'rejected' }) =>
      azure.updateReleaseApproval(project!, params.approvalId, params.status),
    onSuccess: (_data, variables) => {
      const label = variables.status === 'approved' ? 'Approved' : 'Rejected';
      toast.success(`${label} successfully`);
      setSelectedRelease(null);
      queryClient.invalidateQueries({ queryKey: ['releases', project] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : String(err));
    },
  });

  const approveRelease = useCallback(
    (approvalId: number) => approvalMutation.mutate({ approvalId, status: 'approved' }),
    [approvalMutation],
  );

  const rejectRelease = useCallback(
    (approvalId: number) => approvalMutation.mutate({ approvalId, status: 'rejected' }),
    [approvalMutation],
  );

  const myPendingApproval = useMemo(
    () => (selectedRelease ? findMyPendingApproval(selectedRelease.environments, currentUserUniqueName) : null),
    [selectedRelease, currentUserUniqueName],
  );

  const sortOptions: SortOption<ReleaseSortKey>[] = useMemo(() => [
    { value: 'relevance', label: t('releases:sort.relevance') },
    { value: 'newest', label: t('releases:sort.newest') },
    { value: 'name', label: t('releases:sort.name') },
    { value: 'status', label: t('releases:sort.status') },
  ], [t]);

  const statusFilterOptions: { value: ReleaseStatusFilter; label: string }[] = useMemo(() => [
    { value: 'all', label: t('common:filters.all') },
    { value: 'succeeded', label: t('common:status.succeeded') },
    { value: 'inProgress', label: t('common:status.inProgress') },
    { value: 'rejected', label: t('common:status.rejected') },
    { value: 'failed', label: t('common:status.failed') },
    { value: 'cancelled', label: t('common:status.cancelled') },
  ], [t]);

  return {
    groups,
    sortOptions,
    statusFilterOptions,
    isLoading: !!project && (isLoadingDefs || isLoadingReleases),
    error: error ? (error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)) : null,
    definitions,
    definitionFilters,
    addDefinitionFilter: (d) => setDefinitionFilters((prev) => [...prev, d]),
    removeDefinitionFilter: (d) => setDefinitionFilters((prev) => prev.filter((x) => x !== d)),
    statusFilter,
    setStatusFilter,
    environmentFilters,
    addEnvironmentFilter: (e) => setEnvironmentFilters((prev) => [...prev, e]),
    removeEnvironmentFilter: (e) => setEnvironmentFilters((prev) => prev.filter((x) => x !== e)),
    allEnvironmentNames,
    countByStatus,
    selectedRelease,
    selectRelease: setSelectedRelease,
    closeReleaseDetail: () => setSelectedRelease(null),
    favorites,
    toggleFavorite,
    toggleNotification,
    showFavoritesOnly,
    setShowFavoritesOnly,
    approveRelease,
    rejectRelease,
    isApproving: approvalMutation.isPending,
    currentUserUniqueName,
    myPendingApproval,
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  };
}
