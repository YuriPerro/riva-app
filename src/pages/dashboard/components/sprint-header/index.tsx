import { cn } from "@/lib/utils";
import type { SprintHeaderProps } from "./types";

const statusConfig = {
  "on-track":  { label: "On Track",  badgeClass: "bg-success/15 text-success border-success/20" },
  "at-risk":   { label: "At Risk",   badgeClass: "bg-warning/15 text-warning border-warning/20" },
  "off-track": { label: "Off Track", badgeClass: "bg-error/15 text-error border-error/20" },
};

export function SprintHeader(props: SprintHeaderProps) {
  const { sprint } = props;

  if (!sprint) {
    return (
      <div className="flex items-center text-[12px] text-fg-disabled">
        No active sprint
      </div>
    );
  }

  const status = statusConfig[sprint.status];
  const progressPercent = sprint.totalDays > 0
    ? Math.min(100, Math.max(0, ((sprint.totalDays - sprint.daysRemaining) / sprint.totalDays) * 100))
    : 0;

  const fillColor: Record<string, string> = {
    "on-track": "bg-success",
    "at-risk": "bg-warning",
    "off-track": "bg-error",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[12px] text-fg-muted">
        <span className="text-fg-secondary">{sprint.name}</span>
        <span>·</span>
        <span>{sprint.daysRemaining} days remaining</span>
        <span>·</span>
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", status.badgeClass)}>
          {status.label}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border">
        <div
          className={cn("h-full rounded-full transition-all", fillColor[sprint.status])}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
