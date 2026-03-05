import { Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "./use-dashboard";
import { SprintHeader } from "./components/sprint-header";
import { StatsBar } from "./components/stats-bar";
import { WorkItemsList } from "./components/work-items-list";
import { PipelinesList } from "./components/pipelines-list";
import { WorkItemDetailDialog } from "./components/work-item-detail";

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
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-[18px] font-bold text-fg">Dashboard</h2>
        {project && (
          <>
            <span className="text-[12px] text-fg-disabled">·</span>
            <p className="text-[12px] text-fg-muted">{project}</p>
          </>
        )}
      </div>

      <div>
        <SprintHeader sprint={sprint} />
        <StatsBar stats={stats} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <WorkItemsList items={workItems} onSelect={selectWorkItem} />
        <PipelinesList pipelines={pipelines} />
      </div>

      {project && (
        <WorkItemDetailDialog
          itemId={selectedWorkItemId}
          project={project}
          onClose={closeWorkItemDetail}
        />
      )}
    </div>
  );
}
