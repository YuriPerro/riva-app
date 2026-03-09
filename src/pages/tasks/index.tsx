import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTransition } from '@/components/ui/page-transition';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { SearchInput } from '@/components/ui/search-input';
import { SortSelector } from '@/components/ui/sort-selector';
import { WorkItemDetailDialog } from '@/pages/dashboard/components/work-item-detail';
import { TasksContent } from './components/tasks-content';
import { useTasks, type StatusFilter, type TypeFilter, type TaskSortKey } from './use-tasks';
import type { SortOption } from '@/components/ui/sort-selector/types';

export function TasksPage() {
  const { t } = useTranslation(['tasks', 'common']);

  const SORT_OPTIONS: SortOption<TaskSortKey>[] = useMemo(() => [
    { value: 'relevance', label: t('tasks:sort.relevance') },
    { value: 'title', label: t('tasks:sort.title') },
    { value: 'status', label: t('tasks:sort.status') },
    { value: 'type', label: t('tasks:sort.type') },
  ], [t]);

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = useMemo(() => [
    { value: 'all', label: t('common:filters.all') },
    { value: 'todo', label: t('common:status.todo') },
    { value: 'in-progress', label: t('common:status.inProgress') },
    { value: 'in-review', label: t('common:status.inReview') },
    { value: 'done', label: t('common:status.done') },
  ], [t]);

  const TYPE_FILTERS: { value: TypeFilter; label: string }[] = useMemo(() => [
    { value: 'task', label: t('common:workItemTypes.task') },
    { value: 'bug', label: t('common:workItemTypes.bug') },
    { value: 'pbi', label: t('common:workItemTypes.pbi') },
    { value: 'feature', label: t('common:workItemTypes.feature') },
    { value: 'epic', label: t('common:workItemTypes.epic') },
  ], [t]);
  const {
    filtered,
    items,
    isLoading,
    error,
    project,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    openItem,
    selectedWorkItemId,
    selectWorkItem,
    closeWorkItemDetail,
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  } = useTasks();

  const countByStatus = (s: StatusFilter) => (s === 'all' ? items.length : items.filter((i) => i.status === s).length);

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<Layers size={32} />}
          title={t('tasks:loading.title')}
          phrases={t('tasks:loading.phrases', { returnObjects: true }) as string[]}
        />
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <PageHeader
          title={t('tasks:title')}
          subtitle={t('tasks:subtitle', { count: items.length })}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput value={query} onChange={setQuery} placeholder={t('tasks:searchPlaceholder')} />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {STATUS_FILTERS.map(({ value, label }) => (
            <FilterPill key={value} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
              {label}
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]',
                  statusFilter === value ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
                )}
              >
                {countByStatus(value)}
              </span>
            </FilterPill>
          ))}

          <span className="mx-1 h-4 w-px bg-border" />

          {TYPE_FILTERS.map(({ value, label }) => (
            <FilterPill
              key={value}
              active={typeFilter === value}
              onClick={() => setTypeFilter(typeFilter === value ? 'all' : (value as TypeFilter))}
            >
              {label}
            </FilterPill>
          ))}

          <span className="ml-auto" />
          <SortSelector<TaskSortKey>
            options={SORT_OPTIONS}
            value={sortKey}
            direction={sortDirection}
            onChange={setSort}
          />
        </div>

        <TasksContent
          error={error}
          filtered={filtered}
          selectWorkItem={selectWorkItem}
          openItem={openItem}
        />

        {project && (
          <WorkItemDetailDialog
            itemId={selectedWorkItemId}
            project={project}
            onClose={closeWorkItemDetail}
            onNavigate={selectWorkItem}
          />
        )}
      </div>
    </PageTransition>
  );
}
