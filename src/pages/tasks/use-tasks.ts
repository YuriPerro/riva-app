import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openUrl } from '@tauri-apps/plugin-opener';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azure } from '@/lib/tauri';
import { useSessionStore } from '@/store/session';
import { useTasksViewStore, type TasksViewMode } from '@/store/tasks-view';
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
  parentId: number | null;
}

export interface ChildTaskProgress {
  total: number;
  done: number;
}

export interface KanbanBoardItem extends TaskItem {
  childTasks: ChildTaskProgress;
}

export type AssigneeFilter = 'me' | 'all';
export type StatusFilter = 'all' | WorkItemStatus;
export type TypeFilter = 'all' | WorkItemType;

export interface TasksData {
  items: TaskItem[];
  filtered: TaskItem[];
  kanbanItems: KanbanBoardItem[];
  isLoading: boolean;
  error: string | null;
  project: string | null;
  viewMode: TasksViewMode;
  setViewMode: (mode: TasksViewMode) => void;
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
  orderedStates: string[];
  moveItemToState: (itemId: number, targetState: string) => void;
  isMoveUpdating: boolean;
  assigneeFilter: AssigneeFilter;
  setAssigneeFilter: (f: AssigneeFilter) => void;
}

export function useTasks(): TasksData {
  const { t } = useTranslation(['tasks', 'common']);
  const queryClient = useQueryClient();
  const project = useSessionStore((s) => s.project);
  const team = useSessionStore((s) => s.team);
  const viewMode = useTasksViewStore((s) => s.viewMode);
  const setViewMode = useTasksViewStore((s) => s.setViewMode);
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? 'all') as StatusFilter;
  const initialType = (searchParams.get('type') ?? 'all') as TypeFilter;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialType);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('me');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TaskSortKey>('relevance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const setSort = useCallback((key: TaskSortKey, dir: SortDirection) => {
    setSortKey(key);
    setSortDirection(dir);
  }, []);

  const onlyMine = assigneeFilter === 'me';

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', project, team, onlyMine],
    queryFn: () =>
      azure.getTasks(project!, team ?? undefined, onlyMine).then((raw) =>
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
            parentId: w.fields['System.Parent'] ?? null,
          }),
        ),
      ),
    enabled: !!project,
    refetchInterval: 30_000,
  });

  const BOARD_TYPES: Set<WorkItemType> = new Set(['pbi', 'bug']);

  const boardItems = useMemo(() => items.filter((i) => BOARD_TYPES.has(i.type)), [items]);
  const taskItems = useMemo(() => items.filter((i) => i.type === 'task'), [items]);

  const kanbanItems: KanbanBoardItem[] = useMemo(() => {
    const tasksByParent = new Map<number, TaskItem[]>();
    for (const task of taskItems) {
      if (task.parentId) {
        const existing = tasksByParent.get(task.parentId) ?? [];
        existing.push(task);
        tasksByParent.set(task.parentId, existing);
      }
    }

    const parentIdsInBoard = new Set(boardItems.map((i) => i.id));

    const orphanTasks = taskItems
      .filter((t) => !t.parentId || !parentIdsInBoard.has(t.parentId))
      .map((t): KanbanBoardItem => ({ ...t, childTasks: { total: 0, done: 0 } }));

    const boardWithChildren = boardItems.map((item): KanbanBoardItem => {
      const children = tasksByParent.get(item.id) ?? [];
      const doneCount = children.filter((c) => c.status === 'done').length;
      return { ...item, childTasks: { total: children.length, done: doneCount } };
    });

    return [...boardWithChildren, ...orphanTasks];
  }, [boardItems, taskItems]);

  const kanbanRawTypes = useMemo(
    () => [...new Set(kanbanItems.map((i) => i.rawType))],
    [kanbanItems],
  );

  const CATEGORY_ORDER: Record<string, number> = {
    Proposed: 0,
    InProgress: 1,
    Resolved: 2,
    Completed: 3,
    Removed: 4,
  };

  const categoryOrder = (category: string): number => {
    if (CATEGORY_ORDER[category] !== undefined) return CATEGORY_ORDER[category];
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return CATEGORY_ORDER[normalized] ?? 99;
  };

  const { data: orderedStates = [] } = useQuery({
    queryKey: ['kanban-states', project, kanbanRawTypes],
    queryFn: async () => {
      const allStates = await Promise.all(
        kanbanRawTypes.map((type) => azure.getWorkItemTypeStates(project!, type)),
      );

      const stateMap = new Map<string, string>();
      for (const states of allStates) {
        for (const state of states) {
          if (!stateMap.has(state.name)) {
            stateMap.set(state.name, state.category);
          }
        }
      }

      return [...stateMap.entries()]
        .sort(([, catA], [, catB]) => categoryOrder(catA) - categoryOrder(catB))
        .map(([name]) => name);
    },
    enabled: !!project && kanbanRawTypes.length > 0,
    staleTime: 300_000,
  });

  const tasksQueryKey = ['tasks', project, team, onlyMine];

  const moveMutation = useMutation({
    mutationFn: ({ itemId, targetState }: { itemId: number; targetState: string }) =>
      azure.updateWorkItemState(project!, itemId, targetState),
    onMutate: async ({ itemId, targetState }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previous = queryClient.getQueryData(tasksQueryKey);
      queryClient.setQueryData<TaskItem[]>(tasksQueryKey, (old) =>
        old?.map((item) =>
          item.id === itemId
            ? { ...item, rawState: targetState, status: mapWorkItemStatus(targetState) }
            : item,
        ),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksQueryKey, context.previous);
      toast.error(typeof err === 'string' ? err : String(err));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const moveItemToState = useCallback(
    (itemId: number, targetState: string) => moveMutation.mutate({ itemId, targetState }),
    [moveMutation],
  );

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

  const filteredKanbanItems = useMemo(() => {
    if (!query) return kanbanItems;
    return kanbanItems.filter((item) => {
      const searchTarget = `${item.title} ${item.rawType} ${item.rawState} #${item.id}`;
      return fuzzyMatch(query, searchTarget);
    });
  }, [kanbanItems, query]);

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
    kanbanItems: filteredKanbanItems,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === 'string' ? error : 'Failed to load work items') : null,
    project,
    viewMode,
    setViewMode,
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
    orderedStates,
    moveItemToState,
    isMoveUpdating: moveMutation.isPending,
    assigneeFilter,
    setAssigneeFilter,
  };
}
