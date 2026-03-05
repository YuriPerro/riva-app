import { ListTodo, GitPullRequest, Workflow, GitPullRequestArrow } from "lucide-react";
import type { StatsBarProps } from "./types";

export function StatsBar(props: StatsBarProps) {
  const { stats } = props;

  const items = [
    { value: stats.myTasks,          label: "my tasks",          icon: ListTodo },
    { value: stats.inReview,         label: "in review",         icon: GitPullRequest },
    { value: stats.pipelinesRunning, label: "pipelines running", icon: Workflow },
    { value: stats.openPRs,          label: "open PRs",          icon: GitPullRequestArrow },
  ];

  return (
    <div className="flex gap-3 mt-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="flex flex-1 items-center gap-3 rounded-md border border-border-subtle px-3 py-2.5 cursor-pointer transition-colors hover:bg-elevated hover:border-border"
          >
            <Icon size={15} className="text-fg flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-semibold leading-none text-fg">
                {item.value}
              </span>
              <span className="text-[11px] text-fg-muted">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
