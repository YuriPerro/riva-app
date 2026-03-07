import { Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { useDashboard } from './use-dashboard';
import { SprintHeader } from './components/sprint-header';
import { StatsBar } from './components/stats-bar';
import { WorkItemsList } from './components/work-items-list';
import { PipelinesList } from './components/pipelines-list';
import { WorkItemDetailDialog } from './components/work-item-detail';
import { FocusScore } from './components/focus-score';
import { StandupDialog } from './components/standup-dialog';

export function DashboardPage() {
  const {
    project,
    sprint,
    stats,
    workItems,
    pipelines,
    isLoading,
    error,
    selectedWorkItemId,
    selectWorkItem,
    closeWorkItemDetail,
    standup,
    standupLoading,
    standupPeriod,
    setStandupPeriod,
    standupOpen,
    setStandupOpen,
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={16} className="animate-spin text-fg-disabled" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
        <AlertCircle size={14} />
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle={project ?? undefined}
        actions={
          <button
            onClick={() => setStandupOpen(true)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              'border border-border bg-elevated text-fg-muted hover:bg-surface hover:text-fg',
            )}
          >
            <ClipboardList size={12} />
            Standup
          </button>
        }
      />

      <div>
        <SprintHeader sprint={sprint} />
        <StatsBar stats={stats} />
      </div>

      <FocusScore />

      <div className="grid grid-cols-2 gap-6">
        <WorkItemsList items={workItems} onSelect={selectWorkItem} />
        <PipelinesList pipelines={pipelines} />
      </div>

      {project && (
        <WorkItemDetailDialog
          itemId={selectedWorkItemId}
          project={project}
          onClose={closeWorkItemDetail}
          onNavigate={selectWorkItem}
        />
      )}

      <StandupDialog
        open={standupOpen}
        onOpenChange={setStandupOpen}
        standup={standup}
        isLoading={standupLoading}
        period={standupPeriod}
        onPeriodChange={setStandupPeriod}
      />
    </div>
  );
}
