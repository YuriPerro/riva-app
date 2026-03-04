import { useDashboard } from "./use-dashboard";
import { SprintHeader } from "./components/sprint-header";
import { StatsBar } from "./components/stats-bar";
import { WorkItemsList } from "./components/work-items-list";
import { PipelinesList } from "./components/pipelines-list";

export function DashboardPage() {
  const { sprint, stats, workItems, pipelines } = useDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SprintHeader sprint={sprint} />
        <StatsBar stats={stats} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <WorkItemsList items={workItems} />
        <PipelinesList pipelines={pipelines} />
      </div>
    </div>
  );
}
