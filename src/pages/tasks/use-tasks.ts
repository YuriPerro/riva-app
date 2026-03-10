import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useQuery } from '@tanstack/react-query';
import { azure } from '@/lib/tauri';
import { useSessionStore } from '@/store/session';
import { getAssigneeInitials } from '@/utils/formatters';
import { mapWorkItemType, mapWorkItemStatus } from '@/utils/mappers';
import { fuzzyMatch } from '@/utils/search';
import type { WorkItemType, WorkItemStatus } from '@/types/work-item';
import type { SortDirection, SortOption } from '@/components/ui/sort-selector/types';

export type { WorkItemType, WorkItemStatus };

export type TaskSortKey = 'relevance' | 'title' | 'status' | 'type';

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

export type StatusFilter = 'all' | WorkItemStatus;
export type TypeFilter = 'all' | WorkItemType;

export interface TasksData {
  items: TaskItem[];
  filtered: TaskItem[];
  isLoading: boolean;
  error: string | null;
  project: string | null;
  sortOptions: SortOption<TaskSortKey>[];
  statusFilters: { value: StatusFilter; label: string }[];
  typeFilters: { value: TypeFilter; label: string }[];
  countByStatus: (s: StatusFilter) => number;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  setStatusFilter: (f: StatusFilter) => void;
  setTypeFilter: (f: TypeFilter) => void;
  openItem: (url: string) => void;
  selectedWorkItemId: number | null;
  selectWorkItem: (id: number) => void;
  closeWorkItemDetail: () => void;
  query: string;
  setQuery: (q: string) => void;
  sortKey: TaskSortKey;
  sortDirection: SortDirection;
  setSort: (key: TaskSortKey, dir: SortDirection) => void;
}

export function useTasks(): TasksData {
  const { t } = useTranslation(['tasks', 'common']);
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? 'all') as StatusFilter;
  const initialType = (searchParams.get('type') ?? 'all') as TypeFilter;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialType);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TaskSortKey>('relevance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const setSort = useCallback((key: TaskSortKey, dir: SortDirection) => {
    setSortKey(key);
    setSortDirection(dir);
  }, []);

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', project, team],
    queryFn: () =>
      azure.getTasks(project!, team ?? undefined).then((raw) =>
        raw.map(
          (w): TaskItem => ({
            id: w.id,
            title: w.fields['System.Title'],
            type: mapWorkItemType(w.fields['System.WorkItemType']),
            status: mapWorkItemStatus(w.fields['System.State']),
            rawType: w.fields['System.WorkItemType'],
            rawState: w.fields['System.State'],
            iterationPath: w.fields['System.IterationPath'],
            assigneeInitials: getAssigneeInitials(w.fields['System.AssignedTo'] as { displayName: string } | null),
            url: w.webUrl,
          }),
        ),
      ),
    enabled: !!project,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      return true;
    });

    if (query) {
      result = result.filter((item) => {
        const searchTarget = `${item.title} ${item.rawType} ${item.rawState} #${item.id}`;
        return fuzzyMatch(query, searchTarget);
      });
    }

    if (sortKey !== 'relevance') {
      const dir = sortDirection === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (sortKey === 'title') return dir * a.title.localeCompare(b.title);
        if (sortKey === 'status') return dir * a.rawState.localeCompare(b.rawState);
        if (sortKey === 'type') return dir * a.rawType.localeCompare(b.rawType);
        return 0;
      });
    }

    return result;
  }, [items, statusFilter, typeFilter, query, sortKey, sortDirection]);

  const sortOptions: SortOption<TaskSortKey>[] = useMemo(() => [
    { value: 'relevance', label: t('tasks:sort.relevance') },
    { value: 'title', label: t('tasks:sort.title') },
    { value: 'status', label: t('tasks:sort.status') },
    { value: 'type', label: t('tasks:sort.type') },
  ], [t]);

  const statusFilters: { value: StatusFilter; label: string }[] = useMemo(() => [
    { value: 'all', label: t('common:filters.all') },
    { value: 'todo', label: t('common:status.todo') },
    { value: 'in-progress', label: t('common:status.inProgress') },
    { value: 'in-review', label: t('common:status.inReview') },
    { value: 'done', label: t('common:status.done') },
  ], [t]);

  const typeFilters: { value: TypeFilter; label: string }[] = useMemo(() => [
    { value: 'task', label: t('common:workItemTypes.task') },
    { value: 'bug', label: t('common:workItemTypes.bug') },
    { value: 'pbi', label: t('common:workItemTypes.pbi') },
    { value: 'feature', label: t('common:workItemTypes.feature') },
    { value: 'epic', label: t('common:workItemTypes.epic') },
  ], [t]);

  const countByStatus = useCallback(
    (s: StatusFilter) => (s === 'all' ? items.length : items.filter((i) => i.status === s).length),
    [items],
  );

  return {
    items,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === 'string' ? error : 'Failed to load work items') : null,
    project,
    sortOptions,
    statusFilters,
    typeFilters,
    countByStatus,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    openItem: openUrl,
    selectedWorkItemId,
    selectWorkItem: setSelectedWorkItemId,
    closeWorkItemDetail: () => setSelectedWorkItemId(null),
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  };
}
