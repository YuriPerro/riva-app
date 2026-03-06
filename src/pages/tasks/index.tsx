import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { WorkItemDetailDialog } from '@/pages/dashboard/components/work-item-detail';
import { TasksContent } from './components/tasks-content';
import { useTasks, type StatusFilter, type TypeFilter } from './use-tasks';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'pbi', label: 'PBI' },
  { value: 'feature', label: 'Feature' },
  { value: 'epic', label: 'Epic' },
];

export function TasksPage() {
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
  } = useTasks();

  const countByStatus = (s: StatusFilter) => (s === 'all' ? items.length : items.filter((i) => i.status === s).length);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Tasks"
        subtitle={isLoading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} assigned to you`}
      />

      <div className="flex flex-wrap items-center gap-1.5">
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
      </div>

      <TasksContent
        isLoading={isLoading}
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
  );
}
